/**
 * Transaction Store
 *
 * Holds the user's transaction list in memory so that
 * the Dashboard and History screens can both read from
 * the same data without redundant database queries.
 *
 * The store does NOT talk to the database directly.
 * Components call the service functions (services/transaction.ts)
 * and then call these store actions to sync the result
 * into global state.
 */

import { getTransactions, Transaction } from '@/database/services/transaction';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

interface TransactionState {
  /** Full list of transactions for the current user */
  transactions: Transaction[];

  /** True while transactions are being fetched from SQLite */
  isLoading: boolean;

  /** Stores any fetch/mutation error message */
  error: string | null;

  // ── Actions ──────────────────────────────────────────

  /** Replace the entire transaction list (used after initial load) */
  setTransactions: (db: SQLiteDatabase, userId: number) => Promise<void>;

  /**
   * Prepend a newly created transaction to the front of the list.
   * More efficient than re-fetching the whole list after every insert.
   */
  addTransaction: (transaction: Transaction) => void;

  /**
   * Replace a specific transaction in the list by id.
   * Used after an update operation.
   */
  updateTransaction: (transaction: Transaction) => void;

  /** Remove a transaction from the list by id */
  removeTransaction: (id: number) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /** Reset to initial state — called on logout */
  reset: () => void;
}

const initialState = {
  transactions: [],
  isLoading: false,
  error: null,
};

export const useTransactionStore = create<TransactionState>((set) => ({
  ...initialState,

  setTransactions: async (db,userId) =>{
    set({ isLoading: true, error: null });
    console.log("Fetching  Transactions")
    try {
      const transactions = await getTransactions(db, userId);
      console.log("Yayy Transactions fetched",transactions)

      set({ transactions });
    } catch (error) {
      set({ error: 'Failed to load transactions.' });
    } finally {
      set({ isLoading: false });
    }
  
  },
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
    
  updateTransaction: (transaction) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transaction.id ? transaction : t
      ),
    })),

  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));