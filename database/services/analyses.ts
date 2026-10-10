import { SQLiteDatabase } from "expo-sqlite";
interface PeriodTotals {
  periodIncome: number;
  periodExpense: number;
  periodNetChange: number;
}
export async function getPeriodTotals(
  db: SQLiteDatabase,
  userId: number,
  startDate: string,
  endDate: string
): Promise<PeriodTotals> {
  const result = await db.getFirstAsync<{
    income: number | null;
    expense: number | null;
  }>(
    `
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE userId = ?
      AND date BETWEEN ? AND ?
    `,
    [userId, startDate, endDate]
  );
  console.log(`result:${result}`)
  const income = result?.income ?? 0;
  const expense = result?.expense ?? 0;

  return {
    periodIncome:income,
    periodExpense:expense,
    periodNetChange: income - expense,
  };
}

export async function getCategorySpending(
  db: SQLiteDatabase,
  userId: number,
  categoryId: number,
  startDate: string,
  endDate: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    `
    SELECT SUM(amount) AS total
    FROM transactions
    WHERE userId = ?
      AND categoryId = ?
      AND type = 'expense'
      AND date BETWEEN ? AND ?
    `,
    [userId, categoryId, startDate, endDate]
  );

  return result?.total ?? 0;
}

