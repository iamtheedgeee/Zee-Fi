import type { SQLiteDatabase } from 'expo-sqlite';

export type Transaction = {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionInput = {
  userId: number;
  categoryId: number;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
};

export type UpdateTransactionInput = Partial<
  Omit<CreateTransactionInput, 'userId'>
>;

export async function getTransactions(
  db: SQLiteDatabase,
  userId: number,
  limit?: number
): Promise<Transaction[]> {
  const limitClause = limit ? `LIMIT ${limit}` : '';
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE userId = ?
     ORDER BY date DESC, createdAt DESC
     ${limitClause};`,
    userId
  );
}

export async function getTransactionsByDateRange(
  db: SQLiteDatabase,
  userId: number,
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE userId = ?
       AND date >= ?
       AND date <= ?
     ORDER BY date DESC, createdAt DESC;`,
    userId,
    startDate,
    endDate
  );
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: CreateTransactionInput
): Promise<{ transaction: Transaction; newBalance: number }> {
  /**
   * The balance delta is positive for income and negative
   * for expenses. This mirrors how real bank accounts work.
   */
  const balanceDelta =
    input.type === 'income' ? input.amount : -input.amount;

  /**
   * execAsync runs multiple statements atomically.
   * If either the INSERT or the UPDATE fails, both are
   * rolled back — we never end up with a transaction
   * recorded but the balance not updated, or vice versa.
   */
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions (userId, categoryId, amount, type, date, notes)
       VALUES (?, ?, ?, ?, ?, ?);`,
      input.userId,
      input.categoryId,
      input.amount,
      input.type,
      input.date,
      input.notes ?? null
    );

    await db.runAsync(
      `UPDATE users
       SET balance = balance + ?,
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      balanceDelta,
      input.userId
    );
  });

  // Fetch the newly created transaction
  const transaction = await db.getFirstAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE userId = ?
     ORDER BY createdAt DESC
     LIMIT 1;`,
    input.userId
  );

  if (!transaction) {
    throw new Error('Failed to retrieve the newly created transaction.');
  }

  // Fetch the updated balance
  const userRow = await db.getFirstAsync<{ balance: number }>(
    `SELECT balance FROM users WHERE id = ?;`,
    input.userId
  );

  return {
    transaction,
    newBalance: userRow?.balance ?? 0,
  };
}

/**
 * Updates a transaction. If the amount or type changed,
 * we reverse the old balance effect and apply the new one.
 */
/*
export async function updateTransaction(
  db: SQLiteDatabase,
  id: number,
  oldTransaction: Transaction,
  input: UpdateTransactionInput
): Promise<{ transaction: Transaction; newBalance: number }> {
  const fields = Object.keys(input) as (keyof UpdateTransactionInput)[];
  if (fields.length === 0) throw new Error('No fields provided to update.');

  await db.withTransactionAsync(async () => {
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => input[f]);

    await db.runAsync(
      `UPDATE transactions
       SET ${setClauses}, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      ...values,
      id
    );

    // If amount or type changed, adjust the balance
    const amountChanged = input.amount !== undefined || input.type !== undefined;
    if (amountChanged) {
      // Reverse the old transaction's balance effect
      const oldDelta =
        oldTransaction.type === 'income'
          ? -oldTransaction.amount
          : oldTransaction.amount;

      // Apply the new transaction's balance effect
      const newAmount = input.amount ?? oldTransaction.amount;
      const newType = input.type ?? oldTransaction.type;
      const newDelta = newType === 'income' ? newAmount : -newAmount;

      await db.runAsync(
        `UPDATE users
         SET balance = balance + ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?;`,
        oldDelta + newDelta,
        oldTransaction.userId
      );
    }
  });

  const transaction = await db.getFirstAsync<Transaction>(
    `SELECT * FROM transactions WHERE id = ?;`,
    id
  );
  if (!transaction) throw new Error(`Transaction ${id} not found after update.`);

  const userRow = await db.getFirstAsync<{ balance: number }>(
    `SELECT balance FROM users WHERE id = ?;`,
    oldTransaction.userId
  );

  return { transaction, newBalance: userRow?.balance ?? 0 };
}
*/
/**
 * Deletes a transaction and reverses its balance effect.
 */
export async function deleteTransaction(
  db: SQLiteDatabase,
  transaction: Transaction
): Promise<number> {
  const reverseDelta =
    transaction.type === 'income'
      ? -transaction.amount
      : transaction.amount;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM transactions WHERE id = ?;`,
      transaction.id
    );

    await db.runAsync(
      `UPDATE users
       SET balance = balance + ?,
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      reverseDelta,
      transaction.userId
    );
  });

  const userRow = await db.getFirstAsync<{ balance: number }>(
    `SELECT balance FROM users WHERE id = ?;`,
    transaction.userId
  );

  return userRow?.balance ?? 0;
}

export async function getTransactionSummary(
  db: SQLiteDatabase,
  userId: number,
  startDate: string,
  endDate: string
): Promise<{ totalIncome: number; totalExpense: number; netSavings: number }> {
  const result = await db.getFirstAsync<{
    totalIncome: number;
    totalExpense: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
     FROM transactions
     WHERE userId = ?
       AND date >= ?
       AND date <= ?;`,
    userId,
    startDate,
    endDate
  );

  const totalIncome = result?.totalIncome ?? 0;
  const totalExpense = result?.totalExpense ?? 0;

  return { totalIncome, totalExpense, netSavings: totalIncome - totalExpense };
}