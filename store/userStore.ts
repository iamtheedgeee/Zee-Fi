import { getPeriodTotals } from '@/database/services/analyses';
import { User } from '@/database/services/user';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

interface Summary{
  periodIncome:number|null;
  periodExpense:number|null;
  periodNetChange:number|null;
}
interface UserState {
  user: User | null;
  isLoading: boolean;
  summary: Summary | null;
  setUser: (user: User) => void;
  setSummary: (db: SQLiteDatabase, date:{startDate:string,endDate:string})=>Promise<void>
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  /**
   * Updates the balance field on the in-memory user object.
   * Called after adjustUserBalance() succeeds in the DB so
   * the UI reflects the new balance without a full refetch.
   */
  setBalance: (balance: number) => void;
}

export const useUserStore = create<UserState>((set,get) => ({
  user: null,
  isLoading: true,
  summary:null,

  setUser: (user) => set({ user }),

  setSummary: async (db, date)=> {
    console.log("summaruu")
    const summary = await getPeriodTotals(
      db,
      get().user!.id,
      date.startDate,
      date.endDate
    );
    set({summary});
  },

  clearUser: () => set({ user: null , summary: null}),

  setLoading: (loading) => set({ isLoading: loading }),

  setBalance: (balance) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    })),
}));