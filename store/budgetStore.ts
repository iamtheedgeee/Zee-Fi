import { getCategorySpending } from '@/database/services/analyses';
import { Budget, getBudgetsWithSpending } from '@/database/services/budget';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

export interface InStateBudget extends Budget{
  spent:number;
}

interface BudgetState {
  budgets: InStateBudget[];
  isLoading: boolean;
  error: string | null;

  // ── Actions ──────────────────────────────────────────
  setBudgets: (db:SQLiteDatabase,userId:number) => Promise<void>;
  addBudget: (db:SQLiteDatabase,userId:number,budget: Budget) => Promise<void>;
  updateBudget: (budget: InStateBudget) => void;
  updateBudgetProgress: (budgetId:number, spent:number)=>void;
  removeBudget: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  budgets: [],
  isLoading: false,
  error: null,
};

export const useBudgetStore = create<BudgetState>((set) => ({
  ...initialState,

  setBudgets:async (db,userId) =>{
    set({ isLoading: true, error: null });
    console.log("Fetching  Budgets")
    try {
      const budgets = await getBudgetsWithSpending(db, userId);
      console.log("Budgets fetched")
      set({ budgets });
    } catch (error) {
      set({ error: 'Failed to load transactions.' });
    } finally {
      set({ isLoading: false });
    }
  },

  addBudget: async (db,userId,budget) =>{
    const spent= await getCategorySpending(db,userId,budget.categoryId,budget.startDate,budget.endDate)
    set((state) => ({
      budgets: [...state.budgets, {...budget,spent}],
    }))
  },

  updateBudgetProgress: (budgetId, spent) =>
    set((state) => ({
    budgets: state.budgets.map((budget) => {
      if (budget.id !== budgetId) {
        return budget;
      }

      const remaining = budget.amount - spent;

      const progress =
        budget.amount > 0
          ? spent / budget.amount
          : 0;

      return {
        ...budget,
        spent,
        remaining,
        progress,
      };
    }),
  })),

  updateBudget: (budget) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === budget.id ? budget : b
      ),
    })),

  removeBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));