
import type { SQLiteDatabase } from 'expo-sqlite';
import { markUnsynced } from './user';

export type ImportRowError = {
  row: number;
  message: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: ImportRowError[];
};

type CsvRecord = {
  date: string;
  amount: string;
  type: string;
  categoryName: string;
  row: number;
};

/**
 * Parse CSV while supporting quoted values, commas inside
 * quoted fields, escaped quotes, and Windows line endings.
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (quoted) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i++;

      row.push(field);
      if (row.some((value) => value.trim() !== '')) {
        rows.push(row);
      }

      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (quoted) {
    throw new Error('The CSV contains an unclosed quoted field.');
  }

  row.push(field);

  if (row.some((value) => value.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

export async function importTransactionsFromCsv(
  db: SQLiteDatabase,
  userId: number,
  csvContent: string
): Promise<ImportResult> {
  if (!csvContent.trim()) {
    throw new Error('The selected CSV file is empty.');
  }

  const rows = parseCsv(csvContent);

  if (rows.length < 2) {
    throw new Error('The CSV must contain a header and at least one transaction.');
  }

  const headers = rows[0].map((header) =>
    header.replace(/^\uFEFF/, '').trim().toLowerCase()
  );

  const requiredHeaders = [
    'date',
    'amount',
    'type',
    'categoryname',
  ];

  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns: ${missingHeaders.join(', ')}`
    );
  }

  const column = (name: string) => headers.indexOf(name);

  const records: CsvRecord[] = rows.slice(1).map((values, index) => ({
    row: index + 2,
    date: (values[column('date')] ?? '').trim(),
    amount: (values[column('amount')] ?? '').trim(),
    type: (values[column('type')] ?? '').trim().toLowerCase(),
    categoryName: (values[column('categoryname')] ?? '').trim(),
  }));

  // Only categories belonging to this user are eligible.
  const categories = await db.getAllAsync<{
    id: number;
    name: string;
    type: 'income' | 'expense';
  }>(
    `SELECT id, name, type
     FROM categories
     WHERE userId = ?;`,
    userId
  );

  const categoryMap = new Map(
    categories.map((category) => [
      `${category.type}:${category.name.trim().toLowerCase()}`,
      category.id,
    ])
  );

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (const record of records) {
    try {
      if (!record.date || !record.amount || !record.type ||
          !record.categoryName) {
        throw new Error('One or more required values are empty.');
      }

      // Require a complete ISO timestamp, including a timezone.
      const validIsoTimestamp =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

      if (!validIsoTimestamp.test(record.date) ||
          !Number.isFinite(Date.parse(record.date))) {
        throw new Error(
          'Date must be a valid ISO 8601 timestamp with a timezone.'
        );
      }

      const amount = Number(record.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Amount must be a positive number.');
      }

      if (record.type !== 'income' && record.type !== 'expense') {
        throw new Error('Type must be income or expense.');
      }

      const categoryKey =
        `${record.type}:${record.categoryName.toLowerCase()}`;

      const categoryId = categoryMap.get(categoryKey);

      if (categoryId === undefined) {
        throw new Error(
          `Category "${record.categoryName}" was not found for this user and transaction type.`
        );
      }

      const balanceDelta =
        record.type === 'income' ? amount : -amount;

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO transactions
            (userId, categoryId, amount, type, date, notes)
           VALUES (?, ?, ?, ?, ?, ?);`,
          userId,
          categoryId,
          amount,
          record.type,
          record.date,
          null
        );

        await db.runAsync(
          `UPDATE users
           SET balance = balance + ?,
               updatedAt = CURRENT_TIMESTAMP
           WHERE id = ?;`,
          balanceDelta,
          userId
        );
      });
        await markUnsynced(db, userId);
      
      result.imported++;
    } catch (error) {
      result.skipped++;
      result.errors.push({
        row: record.row,
        message:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred.',
      });
    }
  }

  return result;
}
