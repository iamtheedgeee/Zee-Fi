
import { getLoggedInUser } from '@/database/services/auth';

import {
  useBudgetStore,
  useCategoryStore,
  useTransactionStore,
  useUserStore,
} from '@/store';

import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';

export function useAppInit() {
  const db = useSQLiteContext();

  const {
    setUser,
    setLoading,
    setSummary,
  } = useUserStore();

  const { setTransactions } =
    useTransactionStore();

  const { setCategories } =
    useCategoryStore();

  const { setBudgets } =
    useBudgetStore();

  useEffect(() => {
    async function init() {
      try {
        const user = await getLoggedInUser(db);

        if (user) {
          await Promise.all([
            setTransactions(db, user.id),
            setCategories(db, user.id),
            setBudgets(db, user.id),
          ]);

          setUser(user);
          await setSummary(db);
        }
      } catch (error) {
        console.error(
          'App initialization failed:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);
}
