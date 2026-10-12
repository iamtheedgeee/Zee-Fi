/**
 * Central type definitions for the ZeeFi application.
 *
 * All major data structures are defined here and re-exported
 * from a single location so that imports across the codebase
 * stay clean:
 *
 *   import { Transaction, Budget } from '@/types'
 *
 * rather than importing from multiple different files.
 */

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  /** ISO date string e.g. "2023-01-15" */
  memberSince: string;
  /** URI string for avatar image. Null means show initials fallback. */
  avatarUri: string | null;
}

// ─────────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────────

/**
 * Whether a category applies to money coming in or going out.
 */
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  /**
   * Icon name from Ionicons (@expo/vector-icons).
   * Stored as a string so it can be passed as a prop easily.
   */
  iconName: string;
  /** Background color for the category icon circle */
  iconBackground: string;
  /** Icon color */
  iconColor: string;
  type: TransactionType;
}

// ─────────────────────────────────────────────
// TRANSACTION
// ─────────────────────────────────────────────

export interface Transaction {
  id: string;
  title: string;
  /** Category this transaction belongs to */
  categoryId: string;
  /** Pre-resolved category name for display without joins */
  categoryName: string;
  type: TransactionType;
  /** Amount in Naira. Always a positive number. Type determines sign. */
  amount: number;
  /** ISO date-time string e.g. "2024-08-14T09:41:00" */
  date: string;
  /** Optional note attached to the transaction */
  note: string | null;
  /** Which account this transaction was made from */
  account: string;
}

// ─────────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────────

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  iconName: string;
  iconBackground: string;
  iconColor: string;
  /** Total budget limit for the month in Naira */
  limit: number;
  /** How much has been spent so far this month in Naira */
  spent: number;
  /** Days remaining in the budget period */
  daysRemaining: number;
}

// ─────────────────────────────────────────────
// INSIGHT
// ─────────────────────────────────────────────

/**
 * Severity level of an insight card.
 * Controls the accent color and icon shown on the card.
 */
export type InsightSeverity = 'info' | 'warning' | 'success' | 'tip' | 'danger';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  /** Optional label for the CTA link at the bottom of the card */
  ctaLabel: string | null;
  /** Optional route to navigate to when CTA is tapped */
  ctaRoute: string | null;
}

// ─────────────────────────────────────────────
// FINANCIAL SUMMARY
// ─────────────────────────────────────────────

/**
 * The monthly summary shown at the bottom of the Insights screen
 * and partially on the Dashboard.
 */
export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalSpent: number;
  netSavings: number;
  budgetGoal: number;
  /** Percentage of budget goal achieved */
  budgetGoalPercent: number;
  /** Financial health score out of 100 */
  financialScore: number;
  /** Short label describing the score e.g. "Good" */
  scoreLabel: string;
}

// ─────────────────────────────────────────────
// SAVINGS GOAL
// ─────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  /** ISO date string for target completion date */
  targetDate: string;
  /** Monthly contribution amount */
  monthlyContribution: number;
  /** Months remaining to reach the goal */
  monthsRemaining: number;
}

// ─────────────────────────────────────────────
// CHART DATA
// ─────────────────────────────────────────────

/**
 * A single data point for bar or line charts.
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * A single slice in a donut / pie chart.
 */
export interface DonutSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export type DashboardPeriod = 'weekly' | 'monthly' | 'yearly';
