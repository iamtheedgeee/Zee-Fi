//userStore
import { getPeriodTotals } from '@/database/services/analyses';
import { deleteUser, User } from '@/database/services/user';
import { DashboardPeriod } from '@/types';
import { calculatePercentageChange, getDashboardRange, getPreviousComparisonRange } from '@/utils/date';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';
//hererree
export interface Summary{
  periodIncome:number;
  periodExpense:number;
  periodNetChange:number;
}

export interface PercentChange{
  incomeChange:number|null;
  expenseChange:number|null;
}
interface UserState {
  user: User | null;
  isLoading: boolean;
  period: DashboardPeriod;
  summary: Summary | null;
  percentChange:PercentChange|null;
  summaryLoading:boolean;
  setUser: (user: User) => void;
  setSummary: (db: SQLiteDatabase)=>Promise<void>
  
  setPeriod:()=>void;
  clearUser: (db:SQLiteDatabase) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setBalance: (balance: number) => void;
}


export const useUserStore = create<UserState>((set,get) => ({
  user: null,
  isLoading: true,
  summary:null,
  percentChange:null,
  period:'monthly',
  summaryLoading:true,
  setUser: (user) => set({ user }),

  setSummary: async (db)=> {
    set({summaryLoading:true})
    const dateRange=getDashboardRange(get().period)
    const prevDateRange=getPreviousComparisonRange(get().period)
    console.log("current",dateRange)
    console.log("prev",prevDateRange)
    try{
      const [summary,prevSummary] = await Promise.all([
        getPeriodTotals(
          db,
          get().user!.id,
          dateRange.startDate,
          dateRange.endDate
        ),
        getPeriodTotals(
          db,
          get().user!.id,
          prevDateRange.startDate,
          prevDateRange.endDate
        )
      ])
      console.log(prevSummary)
      set({percentChange:{
        incomeChange:calculatePercentageChange(summary.periodIncome,prevSummary.periodIncome),
        expenseChange:calculatePercentageChange(summary.periodExpense,prevSummary.periodExpense)
      }})
      set({summary});
    }catch(error){
      console.log(error)
      //pass it on to a loading state sometime in the future
    }finally{
      set({summaryLoading:false})
    }
    
  },
  setPeriod:()=>{
    set((state)=>({
    period:state.period==='monthly'?'weekly':state.period==="weekly"?'yearly':'monthly'
  }))},
  clearUser: async(db:SQLiteDatabase) =>{
    await deleteUser(db,get().user?.id!) 
    set({ user: null , summary: null})
  
    },

  setLoading: (loading) => set({ isLoading: loading }),

  setBalance: (balance) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    })),
}));