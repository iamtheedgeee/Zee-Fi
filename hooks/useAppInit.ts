/**
 * useAppInit
 *
 * This hook is the engine behind the splash screen.
 * It runs once on app launch and handles:
 *
 *  1. Checking if a user already exists in SQLite
 *  2. If yes: loading the user + their data into all stores
 *  3. If no: leaving the stores empty (user will register)
 *  4. Setting isLoading = false when done so the splash
 *     screen knows to navigate
 *
 * It is a hook rather than a plain function because it
 * needs access to the SQLite database via useSQLiteContext,
 * which only works inside a React component or hook.
 *
 * Usage: call this hook inside the splash screen component.
 */

import { getFirstUser } from '@/database/services/user';
import { useBudgetStore, useCategoryStore, useTransactionStore, useUserStore } from '@/store';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';

export function useAppInit() {
  const db = useSQLiteContext();

  const { setUser, setLoading ,setSummary} = useUserStore();
  const { setTransactions } = useTransactionStore();
  const { setCategories } = useCategoryStore();
  const { setBudgets } = useBudgetStore();

  useEffect(() => {
    async function init() {
      try {
        const user = await getFirstUser(db);

        if (user) {
          await Promise.all([
            setTransactions(db,user.id),
            setCategories(db,user.id),
            setBudgets(db,user.id),
          ]);
          setUser(user)
          await setSummary(db)
          
        }

        /**
         * Whether or not a user was found, loading is done.
         * The splash screen watches isLoading and will navigate
         * once this is set to false.
         */
      } catch (error) {
        console.error('App initialization failed:', error);
        // Even on error we stop loading so the user
        // is not stuck on the splash screen forever.
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);
}