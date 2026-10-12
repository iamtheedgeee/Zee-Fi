/**
 * useInsights
 *
 * The orchestrator between raw transaction data and the
 * insight engine. This hook is responsible for:
 *
 *  1. Deciding whether to regenerate insights or use cached ones
 *  2. Slicing transaction data into current and previous periods
 *  3. Calling runInsightEngine with the right inputs
 *  4. Saving results to the insight store
 *  5. Optionally persisting results to SQLite for history
 *
 * ─────────────────────────────────────────────────────────
 * WHEN INSIGHTS ARE REGENERATED
 * ─────────────────────────────────────────────────────────
 *
 * Insights are not recalculated on every render or every
 * time the user opens the screen. That would be wasteful.
 *
 * Instead each period type has a staleness threshold:
 *
 *   weekly  → regenerate if older than 6 hours
 *   monthly → regenerate if older than 24 hours
 *   yearly  → regenerate if older than 7 days
 *
 * Additionally, any time a new transaction is added the
 * insights for the affected period are immediately marked
 * stale so the next open of the insights screen shows
 * fresh data. This is handled by watching the transaction
 * store length as a dependency.
 *
 * ─────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────
 *
 * Call this hook once in the insights screen or in a parent
 * layout that wraps it. It handles everything internally.
 *
 *   const { insights, isLoading, activePeriod, setActivePeriod }
 *     = useInsights();
 *
 * The hook returns the insights for the currently selected
 * period type so the screen does not need to reach into
 * the store directly.
 */

import {
    EngineInput,
    InsightPeriodType,
    InsightResult,
    runInsightEngine,
} from '@/database/services/insightEngine';
import { Transaction } from '@/database/services/transaction';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useInsightStore } from '@/store/insightStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useUserStore } from '@/store/userStore';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────
// Staleness thresholds in milliseconds
// ─────────────────────────────────────────────────────────
const STALE_THRESHOLDS: Record<InsightPeriodType, number> = {
  weekly:  6  * 60 * 60 * 1000,  // 6 hours
  monthly: 24 * 60 * 60 * 1000,  // 24 hours
  yearly:  7  * 24 * 60 * 60 * 1000, // 7 days
};

// ─────────────────────────────────────────────────────────
// Date range helpers
// ─────────────────────────────────────────────────────────

/**
 * Returns the start and end of the CURRENT period as
 * YYYY-MM-DD strings.
 */
function getCurrentPeriodBounds(
  periodType: InsightPeriodType
): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (periodType) {
    case 'weekly': {
      // Monday → Sunday
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
      };
    }
    case 'monthly': {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
      };
    }
    case 'yearly': {
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      };
    }
  }
}

/**
 * Returns the start and end of the PREVIOUS period as
 * YYYY-MM-DD strings.
 * Previous period always has the same duration as the current.
 */
function getPreviousPeriodBounds(
  periodType: InsightPeriodType
): { start: string; end: string } {
  const now = new Date();

  switch (periodType) {
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + diff);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return {
        start: lastMonday.toISOString().split('T')[0],
        end: lastSunday.toISOString().split('T')[0],
      };
    }
    case 'monthly': {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfPrevMonth = new Date(firstOfThisMonth);
      lastOfPrevMonth.setDate(0);
      const firstOfPrevMonth = new Date(
        lastOfPrevMonth.getFullYear(),
        lastOfPrevMonth.getMonth(),
        1
      );
      return {
        start: firstOfPrevMonth.toISOString().split('T')[0],
        end: lastOfPrevMonth.toISOString().split('T')[0],
      };
    }
    case 'yearly': {
      const prevYear = now.getFullYear() - 1;
      return {
        start: `${prevYear}-01-01`,
        end: `${prevYear}-12-31`,
      };
    }
  }
}

/**
 * Filters a transaction array to only those within a
 * YYYY-MM-DD date range (inclusive on both ends).
 * String comparison works here because ISO dates sort
 * lexicographically in the same order as chronologically.
 */
function filterByDateRange(
  transactions: Transaction[],
  start: string,
  end: string
): Transaction[] {
  return transactions.filter(
    (t) => {
      const date = t.date.split('T')[0];
      return date >= start && date <= end;
    }
  );
}

// ─────────────────────────────────────────────────────────
// Staleness check
// ─────────────────────────────────────────────────────────

/**
 * Returns true if the insights for a given period are
 * stale and should be regenerated.
 */
function isStale(
  lastGenerated: string | null,
  periodType: InsightPeriodType
): boolean {
  if (!lastGenerated) return true;

  const threshold = STALE_THRESHOLDS[periodType];
  const lastTime = new Date(lastGenerated).getTime();
  const now = Date.now();

  return now - lastTime > threshold;
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

interface UseInsightsReturn {
  /** Insights for the currently selected period */
  insights: InsightResult[];
  /** True while the engine is running */
  isLoading: boolean;
  /** Error string if generation failed, null otherwise */
  error: string | null;
  /** Which period is currently displayed */
  activePeriod: InsightPeriodType;
  /** Change the active period — triggers generation if stale */
  setActivePeriod: (period: InsightPeriodType) => void;
  /** Force regeneration regardless of staleness */
  refresh: () => void;
}

export function useInsights(): UseInsightsReturn {
  const { user } = useUserStore();
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { budgets } = useBudgetStore();

  const {
    insights,
    lastGenerated,
    isLoading,
    error,
    setInsights,
    setLoading,
    setError,
  } = useInsightStore();

  // Which period tab is currently showing
  const [activePeriod, setActivePeriod] =
    useState<InsightPeriodType>('monthly');

  /**
   * Ref to track whether a generation is already in progress.
   * Prevents duplicate concurrent runs if the component
   * re-renders mid-generation.
   */
  const isGenerating = useRef(false);

  /**
   * Ref to track the transaction count at last generation.
   * When this changes we know new transactions were added and
   * should regenerate regardless of the time threshold.
   */
  const lastTransactionCount = useRef(transactions.length);

  // ── Core generation function ──────────────────────────

  const generate = useCallback(
    async (periodType: InsightPeriodType) => {
      if (!user) return;
      if (isGenerating.current) return;

      isGenerating.current = true;
      setLoading(true);
      setError(null);

      try {
        const currentBounds = getCurrentPeriodBounds(periodType);
        const previousBounds = getPreviousPeriodBounds(periodType);

        const currentTransactions = filterByDateRange(
          transactions,
          currentBounds.start,
          currentBounds.end
        );

        const previousTransactions = filterByDateRange(
          transactions,
          previousBounds.start,
          previousBounds.end
        );

        /**
         * Determine the currency symbol from the user's
         * preference. Expand this map as you add currencies.
         */
        const currencySymbols: Record<string, string> = {
          NGN: '₦',
          USD: '$',
          GBP: '£',
          EUR: '€',
          GHS: '₵',
          KES: 'KSh ',
          ZAR: 'R',
        };
        const currencySymbol = currencySymbols[user.currency] ?? '₦';

        const input: EngineInput = {
          currentTransactions,
          previousTransactions,
          categories,
          budgets,
          periodType,
          periodStart: currentBounds.start,
          periodEnd: currentBounds.end,
          currencySymbol,
        };

        /**
         * The engine is synchronous and pure so we do not
         * need to await it. However wrapping in a setTimeout
         * with 0ms delay yields to the JS event loop first
         * so the loading spinner has a chance to render
         * before the (potentially heavy) computation starts.
         */
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            try {
              const results = runInsightEngine(input);
              setInsights(periodType, results);
            } catch (err) {
              console.error('Insight engine error:', err);
              setError('Failed to generate insights. Please try again.');
            }
            resolve();
          }, 0);
        });

      } catch (err) {
        console.error('useInsights generation error:', err);
        setError('Something went wrong generating insights.');
      } finally {
        setLoading(false);
        isGenerating.current = false;
      }
    },
    [user, transactions, categories, budgets, setInsights, setLoading, setError]
  );

  // ── Auto-generate on mount and period change ──────────

  useEffect(() => {
    /**
     * Regenerate when:
     *  a) The active period's insights are stale (or never generated)
     *  b) New transactions have been added since last generation
     *
     * The transaction count check ensures fresh insights after
     * the user adds a transaction and returns to the insights screen,
     * even if the time threshold has not elapsed yet.
     */
    const transactionCountChanged =
      transactions.length !== lastTransactionCount.current;

    if (
      isStale(lastGenerated[activePeriod], activePeriod) ||
      transactionCountChanged
    ) {
      lastTransactionCount.current = transactions.length;
      generate(activePeriod);
    }
  }, [activePeriod, transactions.length]);

  // ── Period switch ─────────────────────────────────────

  const handleSetActivePeriod = useCallback(
    (period: InsightPeriodType) => {
      setActivePeriod(period);
      /**
       * When switching periods, generate immediately if that
       * period has never been generated or is stale.
       * The useEffect above also handles this, but calling
       * generate directly here avoids a one-render delay
       * before the loading state appears.
       */
      if (isStale(lastGenerated[period], period)) {
        generate(period);
      }
    },
    [lastGenerated, generate]
  );

  // ── Forced refresh ────────────────────────────────────

  const refresh = useCallback(() => {
    generate(activePeriod);
  }, [activePeriod, generate]);

  // ── Return ────────────────────────────────────────────

  return {
    insights: insights[activePeriod],
    isLoading,
    error,
    activePeriod,
    setActivePeriod: handleSetActivePeriod,
    refresh,
  };
}