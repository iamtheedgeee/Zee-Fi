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
      AND substr(date, 1, 10) BETWEEN ? AND ?
    `,
    [userId, startDate, endDate]
  );
  const income = result?.income ?? 0;
  const expense = result?.expense ?? 0;

  return {
    periodIncome:income,
    periodExpense:expense,
    periodNetChange: income - expense,
  };
}
//FOR BUDGETS
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
      AND substr(date, 1, 10) BETWEEN ? AND ?
    `,
    [userId, categoryId, startDate, endDate]
  );

  return result?.total ?? 0;
}

//FOR CHARTS
export type CategorySpending = {
  categoryId: number;
  categoryName: string;
  iconColor: string;
  amount: number;
};

export async function getCategoriesSpending(
  db: SQLiteDatabase,
  userId: number,
  startDate: string,
  endDate: string
): Promise<CategorySpending[]> {
  return db.getAllAsync<CategorySpending>(
    `SELECT
       c.id AS categoryId,
       c.name AS categoryName,
       c.iconColor AS iconColor,
       SUM(t.amount) AS amount
     FROM transactions t
     JOIN categories c ON c.id = t.categoryId
     WHERE t.userId = ?
       AND t.type = 'expense'
       AND substr(t.date, 1, 10) BETWEEN ? AND ?
     GROUP BY c.id, c.name, c.iconColor
     ORDER BY amount DESC`,
    [userId, startDate, endDate]
  );
}


export type SpendingSlice = {
  label: string;
  amount: number;
  percent: number;
  color: string;
};

export function buildSpendingBreakdown(
  categories: CategorySpending[],
  getColor: (iconColor: string) => string,
  othersColor: string
): SpendingSlice[] {
  const sorted = [...categories]
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = sorted.reduce(
    (sum, category) => sum + category.amount,
    0
  );

  if (total === 0) return [];

  const visible = sorted.slice(0, 4);
  const remaining = sorted.slice(4);

  const slices: SpendingSlice[] = visible.map((category) => ({
    label: category.categoryName,
    amount: category.amount,
    percent: (category.amount / total) * 100,
    color: getColor(category.iconColor),
  }));

  if (remaining.length > 0) {
    const othersAmount = remaining.reduce(
      (sum, category) => sum + category.amount,
      0
    );

    slices.push({
      label: 'Others',
      amount: othersAmount,
      percent: (othersAmount / total) * 100,
      color: othersColor,
    });
  }

  return slices;
}