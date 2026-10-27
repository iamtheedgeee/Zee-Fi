/**
 * Insight Engine
 *
 * A collection of pure functions that analyse a user's
 * financial data and return structured insight objects.
 *
 * "Pure" means every function here:
 *  - Takes data as arguments
 *  - Returns a value
 *  - Has no side effects (no DB calls, no store access)
 *
 * This makes the engine easy to test, easy to reason about,
 * and completely decoupled from React and SQLite.
 *
 * The engine is called by useInsights.ts which handles
 * the orchestration (when to run, how to cache, etc.)
 *
 * ─────────────────────────────────────────────────────────
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────
 *
 * 1. The caller provides raw transactions, categories,
 *    and budgets for a given period and the previous period.
 *
 * 2. Each analyser function examines the data and returns
 *    either an InsightResult or null.
 *    Null means "this insight is not relevant or interesting
 *    enough to show right now."
 *
 * 3. runInsightEngine() calls all analysers, collects the
 *    non-null results, sorts them by severity, and returns
 *    the top N most relevant insights.
 *
 * ─────────────────────────────────────────────────────────
 * ADDING A NEW INSIGHT TYPE
 * ─────────────────────────────────────────────────────────
 * 1. Write an analyser function that follows the signature:
 *    (data: EngineInput) => InsightResult | null
 * 2. Add it to the ANALYSERS array at the bottom of the file.
 * That is all. The engine picks it up automatically.
 */

import { InStateBudget } from '@/store/budgetStore';
import { Category } from './category';
import { Transaction } from './transaction';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type InsightSeverity = 'success' | 'warning' | 'danger' | 'info' | 'tip';

export type InsightPeriodType = 'weekly' | 'monthly' | 'yearly';

export interface InsightResult {
  /**
   * Unique string key for this insight type.
   * Used to deduplicate and identify insights in the store.
   * Should be stable across runs so re-generation replaces
   * the old version of the same insight rather than adding a duplicate.
   * Example: "category_spike_food_monthly"
   */
  key: string;

  /** Controls the card accent color and icon */
  severity: InsightSeverity;

  /** Short card title */
  title: string;

  /** Full message shown on the card */
  message: string;

  /** Optional call-to-action label */
  ctaLabel?: string;

  /** Optional screen route for the CTA */
  ctaRoute?: string;

  /**
   * 0–100 relevance score used to sort insights.
   * Higher = more important = shown first.
   * Computed inside each analyser based on magnitude
   * of the finding (e.g. a 90% budget overspend scores
   * higher than a 15% category increase).
   */
  relevanceScore: number;

  /** Which period this insight covers */
  periodType: InsightPeriodType;
}

/**
 * A summary of spending per category, computed once and
 * reused by multiple analysers to avoid redundant iteration.
 */
export interface CategorySpend {
  categoryId: number;
  categoryName: string;
  type: 'income' | 'expense';
  total: number;
  transactionCount: number;
  /** Average amount per transaction */
  averageTransaction: number;
  /** Sorted list of daily totals for variance calculation */
  dailyTotals: number[];
}

/**
 * Everything the engine needs to run.
 * The caller (useInsights.ts) is responsible for fetching
 * and slicing the data into the correct time windows.
 */
export interface EngineInput {
  /** Transactions in the current analysis period */
  currentTransactions: Transaction[];
  /** Transactions in the previous period (for comparison) */
  previousTransactions: Transaction[];
  /** All categories for the user */
  categories: Category[];
  /** All budgets for the user */
  budgets: InStateBudget[];
  /** Which time window we are analysing */
  periodType: InsightPeriodType;
  /** ISO date string — first day of the current period */
  periodStart: string;
  /** ISO date string — last day of the current period */
  periodEnd: string;
  /** User's preferred currency symbol */
  currencySymbol: string;
}

// ─────────────────────────────────────────────────────────
// Utility helpers (pure, no side effects)
// ─────────────────────────────────────────────────────────

/**
 * Formats a number as a currency string.
 * Uses the symbol passed in from the user's settings
 * rather than hardcoding ₦ so the engine is currency-agnostic.
 */
function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Rounds a number to 1 decimal place */
function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Rounds to nearest integer */
function r0(n: number): number {
  return Math.round(n);
}

/**
 * Calculates the percentage change from previous to current.
 * Returns null if previous is 0 (can't divide by zero and
 * the comparison would be meaningless).
 */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * Used for detecting unusual spending.
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

/**
 * Returns the mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Converts an InsightPeriodType to a human-readable label.
 */
function periodLabel(periodType: InsightPeriodType): string {
  switch (periodType) {
    case 'weekly':  return 'this week';
    case 'monthly': return 'this month';
    case 'yearly':  return 'this year';
  }
}

/**
 * Previous period label for comparison language.
 */
function prevPeriodLabel(periodType: InsightPeriodType): string {
  switch (periodType) {
    case 'weekly':  return 'last week';
    case 'monthly': return 'last month';
    case 'yearly':  return 'last year';
  }
}

// ─────────────────────────────────────────────────────────
// Core computation: category spend summaries
// ─────────────────────────────────────────────────────────

/**
 * Aggregates transactions into per-category spend summaries.
 * This is the central computation that most analysers build on.
 * Called once for the current period and once for the previous
 * period, then both results are passed to individual analysers.
 */
function buildCategorySpendMap(
  transactions: Transaction[],
  categories: Category[]
): Map<number, CategorySpend> {
  const map = new Map<number, CategorySpend>();

  // Build a lookup for category metadata
  const categoryLookup = new Map(categories.map((c) => [c.id, c]));

  // Group transactions by day for each category
  // (used later for variance / consistency analysis)
  const dailyByCategory = new Map<number, Map<string, number>>();

  for (const t of transactions) {
    const cat = categoryLookup.get(t.categoryId);
    if (!cat) continue;

    // Initialise category entry if needed
    if (!map.has(t.categoryId)) {
      map.set(t.categoryId, {
        categoryId: t.categoryId,
        categoryName: cat.name,
        type: cat.type,
        total: 0,
        transactionCount: 0,
        averageTransaction: 0,
        dailyTotals: [],
      });
      dailyByCategory.set(t.categoryId, new Map());
    }

    const entry = map.get(t.categoryId)!;
    entry.total += t.amount;
    entry.transactionCount += 1;

    // Accumulate daily totals
    const dayMap = dailyByCategory.get(t.categoryId)!;
    const day = t.date.split('T')[0]; // normalise to YYYY-MM-DD
    dayMap.set(day, (dayMap.get(day) ?? 0) + t.amount);
  }

  // Finalise averages and daily totals arrays
  for (const [catId, entry] of map) {
    entry.averageTransaction =
      entry.transactionCount > 0
        ? entry.total / entry.transactionCount
        : 0;

    const dayMap = dailyByCategory.get(catId);
    entry.dailyTotals = dayMap ? Array.from(dayMap.values()) : [];
  }

  return map;
}

/**
 * Aggregates all daily spending totals across ALL categories
 * for a given transaction list. Used for day-level analysis.
 */
function buildDailySpendMap(
  transactions: Transaction[],
  type: 'income' | 'expense' | 'both' = 'both'
): Map<string, number> {
  const map = new Map<string, number>();

  for (const t of transactions) {
    if (type !== 'both' && t.type !== type) continue;
    const day = t.date.split('T')[0];
    map.set(day, (map.get(day) ?? 0) + t.amount);
  }

  return map;
}

// ─────────────────────────────────────────────────────────
// ANALYSERS
// Each function takes EngineInput and returns
// InsightResult | null. Null = not relevant enough.
// ─────────────────────────────────────────────────────────

/**
 * ANALYSER 1: Category spending change vs previous period
 *
 * "You spent 35% more on Dining this month than last month."
 * "Your Transport spending dropped 40% compared to last month."
 *
 * Only fires when the change is >= THRESHOLD_PCT to avoid
 * surfacing trivial fluctuations.
 */
const CATEGORY_CHANGE_THRESHOLD = 15; // percent

function analyseCategoryChanges(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const current = buildCategorySpendMap(
    data.currentTransactions,
    data.categories
  );
  const previous = buildCategorySpendMap(
    data.previousTransactions,
    data.categories
  );

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);
  const prevPeriod = prevPeriodLabel(data.periodType);

  for (const [catId, currEntry] of current) {
    // Only analyse expense categories for spending changes
    if (currEntry.type !== 'expense') continue;
    // Need at least 2 transactions to be meaningful
    if (currEntry.transactionCount < 2) continue;

    const prevEntry = previous.get(catId);
    const prevTotal = prevEntry?.total ?? 0;

    const change = pctChange(currEntry.total, prevTotal);
    if (change === null) continue;

    const absPct = Math.abs(change);
    if (absPct < CATEGORY_CHANGE_THRESHOLD) continue;

    const increased = change > 0;
    const diff = Math.abs(currEntry.total - prevTotal);

    results.push({
      key: `category_change_${catId}_${data.periodType}`,
      severity: increased ? 'warning' : 'success',
      title: increased
        ? `${currEntry.categoryName} spending up`
        : `${currEntry.categoryName} spending down`,
      message: increased
        ? `You spent ${r0(absPct)}% more on ${currEntry.categoryName} ${period} (${fmt(currEntry.total, sym)}) compared to ${prevPeriod} (${fmt(prevTotal, sym)}). That is ${fmt(diff, sym)} extra.`
        : `Your ${currEntry.categoryName} spending dropped ${r0(absPct)}% ${period} — ${fmt(diff, sym)} less than ${prevPeriod}. Great progress.`,
      ctaLabel: increased ? 'View Transactions' : undefined,
      ctaRoute: increased ? '/(tabs)/history' : undefined,
      // Score scales with the magnitude of the change
      relevanceScore: Math.min(90, 40 + absPct * 0.5),
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 2: Category share of total expenses
 *
 * "Dining & Drinks accounts for 42% of your expenses this month."
 *
 * Only fires for categories that represent a significant
 * share of total spending (>= SHARE_THRESHOLD %).
 */
const CATEGORY_SHARE_THRESHOLD = 20; // percent

function analyseCategoryShare(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const expenseTransactions = data.currentTransactions.filter(
    (t) => t.type === 'expense'
  );
  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  if (totalExpenses === 0) return results;

  const current = buildCategorySpendMap(
    expenseTransactions,
    data.categories
  );

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  for (const [, entry] of current) {
    if (entry.type !== 'expense') continue;
    if (entry.transactionCount < 2) continue;

    const share = (entry.total / totalExpenses) * 100;
    if (share < CATEGORY_SHARE_THRESHOLD) continue;

    // The higher the share, the more relevant
    const isVeryHigh = share >= 40;

    results.push({
      key: `category_share_expense_${entry.categoryId}_${data.periodType}`,
      severity: isVeryHigh ? 'warning' : 'info',
      title: `${entry.categoryName} dominates expenses`,
      message: `${entry.categoryName} accounts for ${r1(share)}% of your total expenses ${period} — ${fmt(entry.total, sym)} out of ${fmt(totalExpenses, sym)}.`,
      ctaLabel: isVeryHigh ? 'Review Budget' : undefined,
      ctaRoute: isVeryHigh ? '/(tabs)/budget' : undefined,
      relevanceScore: 30 + share * 0.5,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 3: Category share of total income
 *
 * "Freelance accounts for 65% of your income this month."
 *
 * Useful for understanding income source concentration.
 */
function analyseIncomeShare(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const incomeTransactions = data.currentTransactions.filter(
    (t) => t.type === 'income'
  );
  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  if (totalIncome === 0) return results;

  const current = buildCategorySpendMap(
    incomeTransactions,
    data.categories
  );

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  for (const [, entry] of current) {
    if (entry.type !== 'income') continue;

    const share = (entry.total / totalIncome) * 100;

    // Only surface if one source is very dominant (>= 60%)
    // because mild concentration in income is normal
    if (share < 60) continue;

    results.push({
      key: `category_share_income_${entry.categoryId}_${data.periodType}`,
      severity: share >= 90 ? 'warning' : 'info',
      title: `Income concentrated in ${entry.categoryName}`,
      message:
        share >= 90
          ? `${entry.categoryName} is your only income source ${period} (${fmt(entry.total, sym)}).`
          : `${entry.categoryName} accounts for ${r1(share)}% of your income ${period} (${fmt(entry.total, sym)}).`,
      relevanceScore: 25 + share * 0.3,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 4: Highest and lowest spending categories
 *
 * "Your biggest expense category this month was Housing (₦45,000)."
 * "Your lowest expense category was Coffee (₦1,200)."
 */
function analyseHighLowCategories(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const expenseEntries = Array.from(
    buildCategorySpendMap(
      data.currentTransactions.filter((t) => t.type === 'expense'),
      data.categories
    ).values()
  ).filter((e) => e.transactionCount >= 1);

  if (expenseEntries.length < 2) return results;

  // Sort by total spend
  const sorted = [...expenseEntries].sort((a, b) => b.total - a.total);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  results.push({
    key: `highest_expense_category_${data.periodType}`,
    severity: 'info',
    title: `Biggest spend: ${highest.categoryName}`,
    message: `Your highest expense category ${period} was ${highest.categoryName} at ${fmt(highest.total, sym)} across ${highest.transactionCount} transaction${highest.transactionCount === 1 ? '' : 's'}.`,
    relevanceScore: 35,
    periodType: data.periodType,
  });

  // Only add lowest if it is meaningfully different from highest
  if (lowest.categoryId !== highest.categoryId) {
    results.push({
      key: `lowest_expense_category_${data.periodType}`,
      severity: 'info',
      title: `Lowest spend: ${lowest.categoryName}`,
      message: `Your lowest expense category ${period} was ${lowest.categoryName} at ${fmt(lowest.total, sym)}.`,
      relevanceScore: 20,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 5: Transaction frequency
 *
 * "You made 23 transactions this month — averaging about 1 per day."
 * "Transaction activity was light this week (3 transactions)."
 */
function analyseTransactionFrequency(data: EngineInput): InsightResult[] {
  const count = data.currentTransactions.length;
  if (count === 0) return [];

  const period = periodLabel(data.periodType);

  // How many days in the period
  const start = new Date(data.periodStart);
  const end = new Date(data.periodEnd);
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const avgPerDay = count / days;
  const prevCount = data.previousTransactions.length;
  const change = pctChange(count, prevCount);

  let message = `You made ${count} transaction${count === 1 ? '' : 's'} ${period}`;

  if (days >= 7) {
    message += `, averaging ${r1(avgPerDay)} per day`;
  }

  if (change !== null && Math.abs(change) >= 20) {
    const direction = change > 0 ? 'more' : 'fewer';
    message += `. That is ${r0(Math.abs(change))}% ${direction} than ${prevPeriodLabel(data.periodType)}`;
  }

  message += '.';

  return [
    {
      key: `transaction_frequency_${data.periodType}`,
      severity: 'info',
      title: 'Transaction activity',
      message,
      relevanceScore: 20,
      periodType: data.periodType,
    },
  ];
}

/**
 * ANALYSER 6: Unusual spending detection (z-score based)
 *
 * "Your Entertainment spending this month (₦28,000) is unusually
 * high — about 2.3x your typical monthly average of ₦12,000."
 *
 * Uses z-score to define "unusual": a transaction or category
 * total that is more than Z_THRESHOLD standard deviations from
 * the mean of recent history is flagged.
 */
const Z_THRESHOLD = 1.8;

function analyseUnusualSpending(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const current = buildCategorySpendMap(
    data.currentTransactions.filter((t) => t.type === 'expense'),
    data.categories
  );

  const previous = buildCategorySpendMap(
    data.previousTransactions.filter((t) => t.type === 'expense'),
    data.categories
  );

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  for (const [catId, currEntry] of current) {
    const prevEntry = previous.get(catId);
    if (!prevEntry || prevEntry.total === 0) continue;

    // Build a small history from daily totals in both periods
    const history = [
      ...prevEntry.dailyTotals,
      ...currEntry.dailyTotals.slice(0, -1), // exclude the very latest day
    ];

    if (history.length < 3) continue;

    const histMean = mean(history);
    const histStd = stdDev(history);
    if (histStd === 0) continue;

    // Check the current period total as a daily-equivalent
    const dailyEquiv =
      currEntry.total / Math.max(1, currEntry.dailyTotals.length);
    const z = (dailyEquiv - histMean) / histStd;

    if (z > Z_THRESHOLD) {
      const multiple = r1(dailyEquiv / histMean);
      results.push({
        key: `unusual_spending_${catId}_${data.periodType}`,
        severity: 'warning',
        title: `Unusual ${currEntry.categoryName} spending`,
        message: `Your ${currEntry.categoryName} spending ${period} (${fmt(currEntry.total, sym)}) is unusually high — about ${multiple}× your typical average. This may be worth reviewing.`,
        ctaLabel: 'View Transactions',
        ctaRoute: '/(tabs)/history',
        relevanceScore: 50 + Math.min(40, z * 10),
        periodType: data.periodType,
      });
    }
  }

  return results;
}

/**
 * ANALYSER 7: Average spending per day increased or decreased
 *
 * "You spent an average of ₦4,200 per day this month."
 * "Your daily spend average is up 18% from last month."
 */
function analyseAverageDailySpend(data: EngineInput): InsightResult[] {
  const expenseTx = data.currentTransactions.filter(
    (t) => t.type === 'expense'
  );

  if (expenseTx.length === 0) return [];

  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const dailyMap = buildDailySpendMap(expenseTx, 'expense');
  const activeDays = dailyMap.size;

  if (activeDays === 0) return [];

  const avgPerActiveDay = totalExpense / activeDays;

  const prevExpenseTx = data.previousTransactions.filter(
    (t) => t.type === 'expense'
  );
  const prevTotal = prevExpenseTx.reduce((sum, t) => sum + t.amount, 0);
  const prevDailyMap = buildDailySpendMap(prevExpenseTx, 'expense');
  const prevActiveDays = Math.max(1, prevDailyMap.size);
  const prevAvg = prevTotal / prevActiveDays;

  const change = pctChange(avgPerActiveDay, prevAvg);
  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  let message = `You averaged ${fmt(avgPerActiveDay, sym)} per day you spent ${period} (across ${activeDays} active day${activeDays === 1 ? '' : 's'})`;

  if (change !== null && Math.abs(change) >= 10) {
    const direction = change > 0 ? 'higher' : 'lower';
    message += ` — ${r0(Math.abs(change))}% ${direction} than ${prevPeriodLabel(data.periodType)}`;
  }

  message += '.';

  return [
    {
      key: `avg_daily_spend_${data.periodType}`,
      severity: change !== null && change > 20 ? 'warning' : 'info',
      title: 'Average daily spending',
      message,
      relevanceScore: 30,
      periodType: data.periodType,
    },
  ];
}

/**
 * ANALYSER 8: Highest and lowest spending days
 *
 * "Your biggest spending day this month was August 14 (₦18,400)."
 * "Your lightest spending day was August 3 (₦450)."
 */
function analyseHighLowSpendingDays(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const expenseTx = data.currentTransactions.filter(
    (t) => t.type === 'expense'
  );
  const dailyMap = buildDailySpendMap(expenseTx, 'expense');

  if (dailyMap.size < 3) return results;

  const sorted = Array.from(dailyMap.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const [highDay, highAmount] = sorted[0];
  const [lowDay, lowAmount] = sorted[sorted.length - 1];

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  // Format date nicely: "2024-08-14" → "Aug 14"
  function fmtDay(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  results.push({
    key: `highest_spending_day_${data.periodType}`,
    severity: 'info',
    title: 'Biggest spending day',
    message: `Your highest spending day ${period} was ${fmtDay(highDay)} with ${fmt(highAmount, sym)} in expenses.`,
    relevanceScore: 25,
    periodType: data.periodType,
  });

  if (lowDay !== highDay) {
    results.push({
      key: `lowest_spending_day_${data.periodType}`,
      severity: 'info',
      title: 'Lightest spending day',
      message: `Your lightest spending day ${period} was ${fmtDay(lowDay)} with only ${fmt(lowAmount, sym)} in expenses.`,
      relevanceScore: 15,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 9: Income frequency
 *
 * "You received income 3 times this month."
 * "Your income arrived on 2 separate days this week."
 */
function analyseIncomeFrequency(data: EngineInput): InsightResult[] {
  const incomeTx = data.currentTransactions.filter(
    (t) => t.type === 'income'
  );

  if (incomeTx.length === 0) return [];

  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
  const uniqueDays = new Set(incomeTx.map((t) => t.date.split('T')[0])).size;

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  return [
    {
      key: `income_frequency_${data.periodType}`,
      severity: 'info',
      title: 'Income activity',
      message: `You received income ${incomeTx.length} time${incomeTx.length === 1 ? '' : 's'} across ${uniqueDays} day${uniqueDays === 1 ? '' : 's'} ${period}, totalling ${fmt(totalIncome, sym)}.`,
      relevanceScore: 25,
      periodType: data.periodType,
    },
  ];
}

/**
 * ANALYSER 10: Category spending consistency / variation
 *
 * "Your Food spending is very consistent — you spend about the
 * same amount each week."
 * "Your Entertainment spending varies a lot — from ₦500 to ₦15,000
 * on different days."
 *
 * Uses coefficient of variation (CV = stdDev / mean).
 * High CV = high variability. Low CV = consistent.
 */
const HIGH_VARIATION_CV = 0.8;
const LOW_VARIATION_CV = 0.2;

function analyseCategoryConsistency(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const current = buildCategorySpendMap(
    data.currentTransactions.filter((t) => t.type === 'expense'),
    data.categories
  );

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  for (const [, entry] of current) {
    // Need at least 4 data points for variance to be meaningful
    if (entry.dailyTotals.length < 4) continue;

    const avg = mean(entry.dailyTotals);
    const sd = stdDev(entry.dailyTotals);
    const cv = avg > 0 ? sd / avg : 0;

    if (cv >= HIGH_VARIATION_CV) {
      const min = Math.min(...entry.dailyTotals);
      const max = Math.max(...entry.dailyTotals);

      results.push({
        key: `high_variation_${entry.categoryId}_${data.periodType}`,
        severity: 'tip',
        title: `Inconsistent ${entry.categoryName} spending`,
        message: `Your ${entry.categoryName} spending varies widely ${period} — from ${fmt(min, sym)} to ${fmt(max, sym)} on different days. Setting a daily limit might help.`,
        relevanceScore: 30,
        periodType: data.periodType,
      });
    } else if (cv <= LOW_VARIATION_CV && entry.transactionCount >= 4) {
      results.push({
        key: `low_variation_${entry.categoryId}_${data.periodType}`,
        severity: 'success',
        title: `Consistent ${entry.categoryName} spending`,
        message: `Your ${entry.categoryName} spending is very consistent ${period} — you average ${fmt(avg, sym)} per active day with little variation.`,
        relevanceScore: 20,
        periodType: data.periodType,
      });
    }
  }

  return results;
}

/**
 * ANALYSER 11: Zero-spend categories
 *
 * "You didn't spend anything on Health & Fitness this month."
 *
 * Only fires for categories that had spending in the previous
 * period but not the current one — that absence is meaningful.
 * A category that has never had spending is not interesting.
 */
function analyseZeroSpendCategories(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const currentCatIds = new Set(
    data.currentTransactions
      .filter((t) => t.type === 'expense')
      .map((t) => t.categoryId)
  );

  const previousCatIds = new Set(
    data.previousTransactions
      .filter((t) => t.type === 'expense')
      .map((t) => t.categoryId)
  );

  const period = periodLabel(data.periodType);

  for (const catId of previousCatIds) {
    if (currentCatIds.has(catId)) continue;

    const cat = data.categories.find((c) => c.id === catId);
    if (!cat || cat.type !== 'expense') continue;

    results.push({
      key: `zero_spend_${catId}_${data.periodType}`,
      // Could be good (cutting unnecessary spending) or neutral
      // We mark it as success because zero spend is usually positive
      severity: 'success',
      title: `No ${cat.name} spending`,
      message: `You didn't spend anything on ${cat.name} ${period}. You spent in this category ${prevPeriodLabel(data.periodType)}.`,
      relevanceScore: 18,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 12: Largest income and expense transactions
 *
 * "Your largest expense this month was ₦45,000 (Housing, Aug 1)."
 * "Your largest income this month was ₦200,000 (Salary, Aug 9)."
 */
function analyseLargestTransactions(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  function fmtDay(iso: string): string {
    const d = new Date(iso.split('T')[0] + 'T00:00:00');
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  const expenses = data.currentTransactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount);

  const incomes = data.currentTransactions
    .filter((t) => t.type === 'income')
    .sort((a, b) => b.amount - a.amount);

  if (expenses.length > 0) {
    const largest = expenses[0];
    const cat = data.categories.find((c) => c.id === largest.categoryId);

    results.push({
      key: `largest_expense_${data.periodType}`,
      severity: 'info',
      title: 'Largest expense',
      message: `Your largest single expense ${period} was ${fmt(largest.amount, sym)}${cat ? ` in ${cat.name}` : ''} on ${fmtDay(largest.date)}.`,
      relevanceScore: 30,
      periodType: data.periodType,
    });
  }

  if (incomes.length > 0) {
    const largest = incomes[0];
    const cat = data.categories.find((c) => c.id === largest.categoryId);

    results.push({
      key: `largest_income_${data.periodType}`,
      severity: 'success',
      title: 'Largest income',
      message: `Your largest income ${period} was ${fmt(largest.amount, sym)}${cat ? ` from ${cat.name}` : ''} on ${fmtDay(largest.date)}.`,
      relevanceScore: 25,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 13: Savings rate
 *
 * "You saved 28% of your income this month (₦56,000 of ₦200,000)."
 * "Your expenses exceeded your income this month by ₦12,000."
 */
function analyseSavingsRate(data: EngineInput): InsightResult[] {
  const totalIncome = data.currentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = data.currentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalIncome === 0 && totalExpense === 0) return [];

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);
  const net = totalIncome - totalExpense;

  if (totalIncome === 0) {
    return [
      {
        key: `savings_rate_${data.periodType}`,
        severity: 'warning',
        title: 'No income recorded',
        message: `You recorded ${fmt(totalExpense, sym)} in expenses ${period} but no income. Make sure your income transactions are logged.`,
        relevanceScore: 60,
        periodType: data.periodType,
      },
    ];
  }

  if (net < 0) {
    return [
      {
        key: `savings_rate_${data.periodType}`,
        severity: 'danger',
        title: 'Expenses exceeded income',
        message: `Your expenses (${fmt(totalExpense, sym)}) exceeded your income (${fmt(totalIncome, sym)}) ${period} by ${fmt(Math.abs(net), sym)}. Your balance decreased this period.`,
        ctaLabel: 'Review Budget',
        ctaRoute: '/(tabs)/budget',
        relevanceScore: 85,
        periodType: data.periodType,
      },
    ];
  }

  const rate = (net / totalIncome) * 100;

  // Compare to previous period
  const prevIncome = data.previousTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = data.previousTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevNet = prevIncome - prevExpense;
  const prevRate =
    prevIncome > 0 ? (prevNet / prevIncome) * 100 : null;

  const rateChange = prevRate !== null ? pctChange(rate, prevRate) : null;

  let message = `You saved ${fmt(net, sym)} (${r1(rate)}% of your income) ${period}.`;

  if (rateChange !== null && Math.abs(rateChange) >= 5) {
    const direction = rateChange > 0 ? 'up' : 'down';
    message += ` Your savings rate is ${direction} ${r0(Math.abs(rateChange))}% from ${prevPeriodLabel(data.periodType)}.`;
  }

  const severity: InsightSeverity =
    rate >= 20 ? 'success' : rate >= 10 ? 'info' : 'warning';

  return [
    {
      key: `savings_rate_${data.periodType}`,
      severity,
      title: rate >= 20 ? 'Healthy savings rate' : 'Savings rate',
      message,
      relevanceScore: rate < 10 ? 70 : rate >= 20 ? 55 : 45,
      periodType: data.periodType,
    },
  ];
}

/**
 * ANALYSER 14: Budget adherence
 *
 * "You stayed within budget in 3 of 4 categories this month."
 * "You exceeded your Food & Dining budget by ₦12,400."
 *
 * Cross-references transactions with the budgets table.
 * Each budget overspend generates a separate card.
 */
function analyseBudgetAdherence(data: EngineInput): InsightResult[] {
  const results: InsightResult[] = [];

  if (data.budgets.length === 0) return results;

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);

  // Build spend per category for the current period
 
  let withinCount = 0;
  let exceededCount = 0;
  
  for (const budget of data.budgets) {
    const cat = data.categories.find((c) => c.id === budget.categoryId);
    const catName = cat?.name ?? 'Unknown';
    const spent=budget.spent
    if (spent > budget.amount) {
      exceededCount++;
      const overage = spent - budget.amount;
      const pct = r0(((spent - budget.amount) / budget.amount) * 100);

      results.push({
        key: `budget_exceeded_${budget.id}_${data.periodType}`,
        severity: pct > 50 ? 'danger' : 'warning',
        title: `${catName} budget exceeded`,
        message: `You spent ${fmt(spent, sym)} on ${catName} ${period}, exceeding your ${fmt(budget.amount, sym)} budget by ${fmt(overage, sym)} (${pct}% over).`,
        ctaLabel: 'View Budget',
        ctaRoute: '/(tabs)/budget',
        // Overage severity scales the score
        relevanceScore: 60 + Math.min(30, pct * 0.3),
        periodType: data.periodType,
      });
    } else {
      withinCount++;
    }
  }

  // Summary card for budgets that were kept
  if (withinCount > 0 && exceededCount === 0) {
    results.push({
      key: `budget_all_within_${data.periodType}`,
      severity: 'success',
      title: 'All budgets on track',
      message: `You stayed within budget in all ${withinCount} categor${withinCount === 1 ? 'y' : 'ies'} ${period}. Keep it up.`,
      relevanceScore: 65,
      periodType: data.periodType,
    });
  } else if (withinCount > 0 && exceededCount > 0) {
    results.push({
      key: `budget_partial_${data.periodType}`,
      severity: 'info',
      title: 'Budget summary',
      message: `You stayed within budget in ${withinCount} of ${withinCount + exceededCount} categories ${period}.`,
      relevanceScore: 35,
      periodType: data.periodType,
    });
  }

  return results;
}

/**
 * ANALYSER 15: Spending velocity projection
 *
 * "You've spent ₦45,000 in the first 10 days of the month.
 *  At this pace you'll spend about ₦135,000 by month end."
 *
 * Only meaningful for monthly periods with enough data
 * (at least 5 days elapsed).
 */
function analyseSpendingVelocity(data: EngineInput): InsightResult[] {
  if (data.periodType !== 'monthly') return [];

  const expenseTx = data.currentTransactions.filter(
    (t) => t.type === 'expense'
  );
  if (expenseTx.length === 0) return [];

  const totalSoFar = expenseTx.reduce((sum, t) => sum + t.amount, 0);

  const start = new Date(data.periodStart + 'T00:00:00');
  const now = new Date();
  const end = new Date(data.periodEnd + 'T23:59:59');

  const elapsedDays = Math.ceil(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Need at least 5 days of data for projection to be meaningful
  if (elapsedDays < 5) return [];
  // Don't project if we are near the end of the period
  if (elapsedDays >= totalDays - 3) return [];

  const dailyRate = totalSoFar / elapsedDays;
  const projectedTotal = dailyRate * totalDays;

  const sym = data.currencySymbol;

  // Only surface this if the projected total is noticeably
  // higher than what they might expect
  const totalIncome = data.currentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const isWorthShowing =
    totalIncome === 0 || projectedTotal > totalIncome * 0.8;
  if (!isWorthShowing) return [];

  return [
    {
      key: `spending_velocity_${data.periodType}`,
      severity: projectedTotal > totalIncome ? 'warning' : 'info',
      title: 'Spending pace',
      message: `You have spent ${fmt(totalSoFar, sym)} in the first ${elapsedDays} days of the month. At this pace you will spend about ${fmt(projectedTotal, sym)} by month end.`,
      ctaLabel:
        projectedTotal > totalIncome ? 'Review Budget' : undefined,
      ctaRoute:
        projectedTotal > totalIncome ? '/(tabs)/budget' : undefined,
      relevanceScore: projectedTotal > totalIncome ? 75 : 40,
      periodType: data.periodType,
    },
  ];
}

/**
 * ANALYSER 16: Day of week spending pattern
 *
 * "You tend to spend the most on Fridays —
 *  your average Friday spend is ₦8,200."
 *
 * Only meaningful for monthly or yearly periods where
 * there are enough data points per day of week.
 */
const DAY_NAMES = [
  'Sundays', 'Mondays', 'Tuesdays', 'Wednesdays',
  'Thursdays', 'Fridays', 'Saturdays',
];

function analyseDayOfWeekPattern(data: EngineInput): InsightResult[] {
  if (data.periodType === 'weekly') return [];

  const expenseTx = data.currentTransactions.filter(
    (t) => t.type === 'expense'
  );
  if (expenseTx.length < 7) return [];

  // Accumulate total spend per day of week
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);

  for (const t of expenseTx) {
    const d = new Date(t.date.split('T')[0] + 'T00:00:00');
    const dow = d.getDay();
    totals[dow] += t.amount;
    counts[dow]++;
  }

  // Calculate average spend per occurrence of that day
  const averages = totals.map((total, i) =>
    counts[i] > 0 ? total / counts[i] : 0
  );

  const maxAvg = Math.max(...averages);
  const maxDow = averages.indexOf(maxAvg);

  // Only show if the highest day is notably above the mean
  const overallMean = mean(averages.filter((a) => a > 0));
  if (maxAvg < overallMean * 1.3) return [];

  const sym = data.currencySymbol;

  return [
    {
      key: `day_of_week_pattern_${data.periodType}`,
      severity: 'tip',
      title: `Heavy spending on ${DAY_NAMES[maxDow]}`,
      message: `You tend to spend the most on ${DAY_NAMES[maxDow]} — averaging ${fmt(maxAvg, sym)} per ${DAY_NAMES[maxDow].slice(0, -1)}.`,
      relevanceScore: 28,
      periodType: data.periodType,
    },
  ];
}

/**
 * ANALYSER 17: Income trend
 *
 * "Your income increased 15% compared to last month."
 * "You earned less this month than last month."
 */
function analyseIncomeTrend(data: EngineInput): InsightResult[] {
  const currentIncome = data.currentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const previousIncome = data.previousTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  if (currentIncome === 0 && previousIncome === 0) return [];

  const change = pctChange(currentIncome, previousIncome);
  if (change === null || Math.abs(change) < 10) return [];

  const sym = data.currencySymbol;
  const period = periodLabel(data.periodType);
  const prevPeriod = prevPeriodLabel(data.periodType);
  const increased = change > 0;

  return [
    {
      key: `income_trend_${data.periodType}`,
      severity: increased ? 'success' : 'warning',
      title: increased ? 'Income increased' : 'Income decreased',
      message: increased
        ? `Your income ${period} (${fmt(currentIncome, sym)}) is ${r0(change)}% higher than ${prevPeriod} (${fmt(previousIncome, sym)}).`
        : `Your income ${period} (${fmt(currentIncome, sym)}) is ${r0(Math.abs(change))}% lower than ${prevPeriod} (${fmt(previousIncome, sym)}).`,
      relevanceScore: increased ? 50 : 65,
      periodType: data.periodType,
    },
  ];
}

// ─────────────────────────────────────────────────────────
// ANALYSER REGISTRY
//
// Add new analysers here. Order does not matter —
// results are sorted by relevanceScore before returning.
// ─────────────────────────────────────────────────────────

type MultiResultAnalyser = (data: EngineInput) => InsightResult[];

const ANALYSERS: MultiResultAnalyser[] = [
  // Returns arrays — already wrapped above
  analyseCategoryChanges,
  analyseCategoryShare,
  analyseIncomeShare,
  analyseHighLowCategories,
  analyseTransactionFrequency,
  analyseUnusualSpending,
  analyseAverageDailySpend,
  analyseHighLowSpendingDays,
  analyseIncomeFrequency,
  analyseCategoryConsistency,
  analyseZeroSpendCategories,
  analyseLargestTransactions,
  analyseSavingsRate,
  analyseBudgetAdherence,
  analyseSpendingVelocity,
  analyseDayOfWeekPattern,
  analyseIncomeTrend,
];

// ─────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────

/**
 * The maximum number of insights to return per run.
 * Keeps the insights screen from becoming overwhelming.
 */
const MAX_INSIGHTS = 12;

/**
 * Minimum relevance score for an insight to be included.
 * Anything below this is considered too trivial to show.
 */
const MIN_RELEVANCE = 15;

/**
 * Runs all analysers against the provided data and returns
 * a sorted, deduplicated list of the most relevant insights.
 *
 * This is the only function that callers (useInsights.ts)
 * need to import from this file.
 *
 * @param data - The engine input built by the caller
 * @returns Sorted array of InsightResult, most relevant first
 */
export function runInsightEngine(data: EngineInput): InsightResult[] {
  const allResults: InsightResult[] = [];

  for (const analyser of ANALYSERS) {
    try {
      /**
       * Wrap each analyser in try/catch so one broken
       * analyser does not prevent all others from running.
       * In production you'd log these errors.
       */
      const results = analyser(data);
      allResults.push(...results);
    } catch (error) {
      console.warn('Insight analyser failed:', error);
    }
  }

  return allResults
    // Remove insights below the relevance threshold
    .filter((r) => r.relevanceScore >= MIN_RELEVANCE)
    // Sort most relevant first
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    // Danger and warning always bubble above info/tip/success
    // within similar relevance bands
    .sort((a, b) => {
      const severityOrder: Record<InsightSeverity, number> = {
        danger:  5,
        warning: 4,
        success: 3,
        tip:     2,
        info:    1,
      };
      const scoreDiff = b.relevanceScore - a.relevanceScore;
      // Only reorder by severity if scores are within 10 points
      if (Math.abs(scoreDiff) <= 10) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return scoreDiff;
    })
    // Cap the list
    .slice(0, MAX_INSIGHTS);
}