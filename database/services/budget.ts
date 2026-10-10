/**
 * Budget Service
 *
 * All SQLite operations for the budgets table.
 */

import { getPeriodRange } from '@/utils/date';
import type { SQLiteDatabase } from 'expo-sqlite';
export type Budget = {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBudgetInput = {
  userId: number;
  categoryId: number;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
};

export type UpdateBudgetInput = Partial<
  Omit<CreateBudgetInput, 'userId'>
>;

/**
 * Fetches all budgets for a user.
 */
export async function getBudgets(
  db: SQLiteDatabase,
  userId: number
): Promise<Budget[]> {
  return db.getAllAsync<Budget>(
    `SELECT * FROM budgets
     WHERE userId = ?
     ORDER BY createdAt DESC;`,
    userId
  );
}

/**
 * Fetches a single budget by id.
 */
export async function getBudget(
  db: SQLiteDatabase,
  id: number,
): Promise<Budget | null> {
  return db.getFirstAsync<Budget>(
    `SELECT * FROM budgets WHERE id = ?;`,
    id
  );
}

export async function getBudgetByCategory(
  db: SQLiteDatabase,
  userId: number,
  categoryId: number
): Promise<Budget | null> {
  return db.getFirstAsync<Budget>(
    `
    SELECT *
    FROM budgets
    WHERE userId = ?
      AND categoryId = ?
    LIMIT 1
    `,
    [userId, categoryId]
  );
}

/**
 * Creates a new budget.
 */
export async function createBudget(
  db: SQLiteDatabase,
  input: CreateBudgetInput
): Promise<Budget> {
  const result = await db.runAsync(
    `INSERT INTO budgets (userId, categoryId, amount, period, startDate, endDate)
     VALUES (?, ?, ?, ?, ?, ?);`,
    input.userId,
    input.categoryId,
    input.amount,
    input.period,
    input.startDate,
    input.endDate ?? null
  );

  const budget = await db.getFirstAsync<Budget>(
    `SELECT * FROM budgets WHERE id = ?;`,
    result.lastInsertRowId
  );

  if (!budget) {
    throw new Error('Failed to retrieve the newly created budget.');
  }

  return budget;
}

/**
 * Updates a budget.
 */
/*
export async function updateBudget(
  db: SQLiteDatabase,
  id: number,
  input: UpdateBudgetInput
): Promise<Budget> {
  const fields = Object.keys(input) as (keyof UpdateBudgetInput)[];
  if (fields.length === 0) throw new Error('No fields to update.');

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => input[f]);

  await db.runAsync(
    `UPDATE budgets
     SET ${setClauses}, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    ...values,
    id
  );

  const budget = await db.getFirstAsync<Budget>(
    `SELECT * FROM budgets WHERE id = ?;`,
    id
  );

  if (!budget) {
    throw new Error(`Budget with id ${id} not found after update.`);
  }

  return budget;
}
*/
/**
 * Deletes a budget.
 */
export async function deleteBudget(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(
    `DELETE FROM budgets WHERE id = ?;`,
    id
  );
}


export async function getBudgetsWithSpending(
  db: SQLiteDatabase,
  userId: number,
  ): Promise<(Budget & { spent: number;})[]> {
  const budgets = await getBudgets(db, userId);
  const enriched = await Promise.all(
    budgets.map(async (budget) => {
      const result = await db.getFirstAsync<{ spent: number }>(
        `SELECT COALESCE(SUM(amount), 0) AS spent
         FROM transactions
         WHERE userId = ?
           AND categoryId = ?
           AND type = 'expense'
           AND date >= ?
           AND date <= ?;`,
        userId,
        budget.categoryId,
        budget.startDate,
        budget.endDate
      );

      const spent = result?.spent ?? 0;
      return { ...budget, spent };
    })
  );

  return enriched;
}



export async function refreshBudgetPeriods(
  db: SQLiteDatabase,
  userId: number
): Promise<void> {
  const budgets = await db.getAllAsync<Budget>(
    `SELECT * FROM budgets WHERE userId = ?`,
    [userId]
  );

  const today = new Date();

  await db.withTransactionAsync(async () => {
    for (const budget of budgets) {
      const { startDate, endDate } = getPeriodRange(
        today,
        budget.period
      );

      // Skip budgets whose dates are already correct.
      if (
        budget.startDate === startDate &&
        budget.endDate === endDate
      ) {
        continue;
      }

      await db.runAsync(
        `UPDATE budgets
         SET startDate = ?, endDate = ?
         WHERE id = ? AND userId = ?`,
        [startDate, endDate, budget.id, userId]
      );
    }
  });
}