/**
 * Insight Store
 *
 * Holds the generated insights for each time period in memory
 * so the insights screen can read them synchronously without
 * waiting for a recalculation on every render.
 *
 * Structure is split by period type so the user can switch
 * between Weekly / Monthly / Yearly views without re-running
 * the engine — all three are calculated and stored together.
 */

import { InsightPeriodType, InsightResult } from '@/database/services/insightEngine';
import { create } from 'zustand';

interface InsightsByPeriod {
  weekly: InsightResult[];
  monthly: InsightResult[];
  yearly: InsightResult[];
}

interface InsightState {
  insights: InsightsByPeriod;

  /**
   * Tracks when each period's insights were last generated.
   * ISO timestamp strings — null means never generated.
   * Used by useInsights to decide whether to regenerate.
   */
  lastGenerated: {
    weekly: string | null;
    monthly: string | null;
    yearly: string | null;
  };

  /**
   * True while the engine is running.
   * The insights screen shows a loading state while this is true.
   */
  isLoading: boolean;

  /**
   * Error message if the last generation failed.
   * Null when everything is fine.
   */
  error: string | null;

  // ── Actions ────────────────────────────────────────────

  /**
   * Replaces the insights for a specific period type.
   * Called by useInsights after a successful engine run.
   */
  setInsights: (
    periodType: InsightPeriodType,
    results: InsightResult[]
  ) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /**
   * Clears all insights — called on logout so a new user
   * does not see the previous user's insights.
   */
  reset: () => void;
}

const initialInsights: InsightsByPeriod = {
  weekly: [],
  monthly: [],
  yearly: [],
};

const initialLastGenerated = {
  weekly: null,
  monthly: null,
  yearly: null,
};

export const useInsightStore = create<InsightState>((set) => ({
  insights: initialInsights,
  lastGenerated: initialLastGenerated,
  isLoading: false,
  error: null,

  setInsights: (periodType, results) =>
    set((state) => ({
      insights: {
        ...state.insights,
        [periodType]: results,
      },
      lastGenerated: {
        ...state.lastGenerated,
        [periodType]: new Date().toISOString(),
      },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      insights: initialInsights,
      lastGenerated: initialLastGenerated,
      isLoading: false,
      error: null,
    }),
}));