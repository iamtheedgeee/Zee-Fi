import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../supabase';
import type { Budget } from './budget';
import type { Category } from './category';
import type { Transaction } from './transaction';
import type { User } from './user';
type RemoteProfile = {
  id: string;
  name: string;
  email: string | null;
  currency: string;
  balance: number;
  initial_balance: number;
  created_at: string;
  updated_at: string;
};

type RemoteCategory = {
  local_sync_id: string;
  name: string;
  type: 'income' | 'expense';
  icon_name: string;
  icon_color: string;
  created_at: string;
  updated_at: string;
};

type RemoteTransaction = {
  local_sync_id: string;
  category_sync_id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type RemoteBudget = {
  local_sync_id: string;
  category_sync_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};
export async function hasUnsyncedChanges(
  db: SQLiteDatabase,
  userId: number,
): Promise<boolean> {
  const user = await db.getFirstAsync<{
    hasUnsyncedChanges: number;
  }>(
    `SELECT hasUnsyncedChanges
     FROM users
     WHERE id = ?`,
    userId,
  );
  return user?.hasUnsyncedChanges === 1;
}
async function ensureSyncIds(
  db: SQLiteDatabase,
  userId: number
) {
  const tables = [
    'categories',
    'transactions',
    'budgets',
  ] as const;

  await db.withTransactionAsync(async () => {
    for (const table of tables) {
      const rows = await db.getAllAsync<{
        id: number;
      }>(
        `SELECT id
         FROM ${table}
         WHERE userId = ?
         AND syncId IS NULL`,
        userId
      );

      for (const row of rows) {
        await db.runAsync(
          `UPDATE ${table}
           SET syncId = ?
           WHERE id = ?`,
          Crypto.randomUUID(),
          row.id
        );
      }
    }
  });
}

export async function restoreOnlineData(
  db: SQLiteDatabase,
  supabaseUserId: string
): Promise<User> {
  // Fetch profile
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

  throwIfError(profileError);

  if (!profile) {
    throw new Error(
      'No ZeeFi profile was found for this online account.'
    );
  }

  const remoteProfile = profile as RemoteProfile;

  // Fetch categories
  const { data: remoteCategories,
    error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', supabaseUserId)
      .is('deleted_at', null);

  throwIfError(categoriesError);

  // Fetch transactions
  const { data: remoteTransactions,
    error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', supabaseUserId)
      .is('deleted_at', null);

  throwIfError(transactionsError);

  // Fetch budgets
  const { data: remoteBudgets,
    error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', supabaseUserId)
      .is('deleted_at', null);

  throwIfError(budgetsError);

  const categories =
    (remoteCategories ?? []) as RemoteCategory[];

  const transactions =
    (remoteTransactions ?? []) as RemoteTransaction[];

  const budgets =
    (remoteBudgets ?? []) as RemoteBudget[];

  // Find or create local user.
  let localUser = await db.getFirstAsync<User>(
    `SELECT *
     FROM users
     WHERE supabaseUserId = ?
     LIMIT 1`,
    supabaseUserId
  );

  if (!localUser) {
    const result = await db.runAsync(
      `INSERT INTO users (
        name,
        email,
        currency,
        initialBalance,
        balance,
        loggedIn,
        supabaseUserId,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      remoteProfile.name,
      remoteProfile.email,
      remoteProfile.currency,
      remoteProfile.initial_balance,
      remoteProfile.balance,
      supabaseUserId,
      remoteProfile.created_at,
      remoteProfile.updated_at
    );

    localUser = await db.getFirstAsync<User>(
      `SELECT *
       FROM users
       WHERE id = ?`,
      result.lastInsertRowId
    );
  } else {
    await db.runAsync(
      `UPDATE users
       SET name = ?,
           email = ?,
           currency = ?,
           initialBalance = ?,
           loggedIn = 1,
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      remoteProfile.name,
      remoteProfile.email,
      remoteProfile.currency,
      remoteProfile.initial_balance,
      localUser.id
    );

    localUser = await db.getFirstAsync<User>(
      `SELECT *
       FROM users
       WHERE id = ?`,
      localUser.id
    );
  }

  if (!localUser) {
    throw new Error(
      'Could not create the local user profile.'
    );
  }

  // Restore categories first.
  await db.withTransactionAsync(async () => {
    for (const category of categories) {
      await db.runAsync(
        `INSERT INTO categories (
          userId,
          syncId,
          name,
          type,
          iconName,
          iconColor,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(syncId) DO UPDATE SET
          name = excluded.name,
          type = excluded.type,
          iconName = excluded.iconName,
          iconColor = excluded.iconColor,
          updatedAt = excluded.updatedAt`,
        localUser!.id,
        category.local_sync_id,
        category.name,
        category.type,
        category.icon_name,
        category.icon_color,
        category.created_at,
        category.updated_at
      );
    }

    // Restore transactions.
    for (const transaction of transactions) {
      const category =
        await db.getFirstAsync<{
          id: number;
        }>(
          `SELECT id
           FROM categories
           WHERE userId = ?
           AND syncId = ?`,
          localUser!.id,
          transaction.category_sync_id
        );

      if (!category) {
        throw new Error(
          `Missing category for transaction ${transaction.local_sync_id}`
        );
      }  

      await db.runAsync(
        `INSERT INTO transactions (
          userId,
          syncId,
          categoryId,
          amount,
          type,
          date,
          notes,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(syncId) DO UPDATE SET
          categoryId = excluded.categoryId,
          amount = excluded.amount,
          type = excluded.type,
          date = excluded.date,
          notes = excluded.notes,
          updatedAt = excluded.updatedAt`,
        localUser!.id,
        transaction.local_sync_id,
        category.id,
        transaction.amount,
        transaction.type,
        transaction.date,
        transaction.notes,
        transaction.created_at,
        transaction.updated_at
      );
    }

    // Restore budgets.
    for (const budget of budgets) {
      const category =
        await db.getFirstAsync<{
          id: number;
        }>(
          `SELECT id
           FROM categories
           WHERE userId = ?
           AND syncId = ?`,
          localUser!.id,
          budget.category_sync_id
        );

      if (!category) {
        throw new Error(
          `Missing category for budget ${budget.local_sync_id}`
        );
      }

      await db.runAsync(
        `INSERT INTO budgets (
          userId,
          syncId,
          categoryId,
          amount,
          period,
          startDate,
          endDate,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(syncId) DO UPDATE SET
          categoryId = excluded.categoryId,
          amount = excluded.amount,
          period = excluded.period,
          startDate = excluded.startDate,
          endDate = excluded.endDate,
          updatedAt = excluded.updatedAt`,
        localUser!.id,
        budget.local_sync_id,
        category.id,
        budget.amount,
        budget.period,
        budget.start_date,
        budget.end_date,
        budget.created_at,
        budget.updated_at
      );
    }
  });

  return localUser;
}


type SyncTable = 'categories' | 'transactions' | 'budgets';

type LocalRecord = {
  id: number;
  userId: number;
  syncId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

// Delete cloud records corresponding to local tombstones.
async function deleteRemoteRows(
  table: SyncTable,
  supabaseUserId: string,
  rows: LocalRecord[],
) {
  const syncIds = rows
    .map((row) => row.syncId)
    .filter((id): id is string => Boolean(id));

  if (syncIds.length === 0) return;

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('user_id', supabaseUserId)
    .in('local_sync_id', syncIds);

  throwIfError(error);
}

// Upload or update cloud records.
async function upsertRemoteRows(
  table: SyncTable,
  rows: Record<string, any>[],
) {
  if (rows.length === 0) return;

  const { error } = await supabase
    .from(table)
    .upsert(rows, {
      onConflict: 'user_id,local_sync_id',
    });

  throwIfError(error);
}

// Physically remove local tombstones after successful cloud operations.
async function deleteLocalTombstones(
  db: SQLiteDatabase,
  userId: number,
  table: SyncTable,
  rows: LocalRecord[],
) {
  const syncIds = rows
    .map((row) => row.syncId)
    .filter((id): id is string => Boolean(id));

  if (syncIds.length === 0) return;

  const placeholders = syncIds.map(() => '?').join(', ');

  await db.runAsync(
    `DELETE FROM ${table}
     WHERE userId = ?
       AND deletedAt IS NOT NULL
       AND syncId IN (${placeholders})`,
    userId,
    ...syncIds,
  );
}

export async function syncUserData(
  db: SQLiteDatabase,
  user: User,
  supabaseUserId?:string|null,
  email?:string|null,
): Promise<{ success: true }> {
  const userId = user.id;
  supabaseUserId = supabaseUserId?supabaseUserId:user.supabaseUserId
  email=email?email:user.email
  if (!supabaseUserId) {
    throw new Error('This account is not linked to Supabase.');
  }

  // Read the current unsynced state. Allow an explicit sync even when
  // false, since the user may want to retry or verify their cloud data.
  await ensureSyncIds(db, userId)
  // 2. Sync the profile.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: supabaseUserId,
        name: user.name,
        email: user.email,
        currency: user.currency,
        balance: user.balance,
        initial_balance: user.initialBalance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  throwIfError(profileError);
  const categories = await db.getAllAsync<Category>(
    'SELECT * FROM categories WHERE userId = ?',
    userId,
  );
  const transactions = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE userId = ?',
    userId,
  );
  const budgets = await db.getAllAsync<Budget>(
    'SELECT * FROM budgets WHERE userId = ?',
    userId,
  );

  const activeCategories = categories.filter((r) => !r.deletedAt);
  const activeTransactions = transactions.filter((r) => !r.deletedAt);
  const activeBudgets = budgets.filter((r) => !r.deletedAt);

  const deletedCategories = categories.filter((r) => r.deletedAt);
  const deletedTransactions = transactions.filter((r) => r.deletedAt);
  const deletedBudgets = budgets.filter((r) => r.deletedAt);

  // 1. Delete cloud records marked for deletion locally.
  // Dependent records are deleted before categories.
  await deleteRemoteRows(
    'transactions',
    supabaseUserId,
    deletedTransactions,
  );

  await deleteRemoteRows(
    'budgets',
    supabaseUserId,
    deletedBudgets,
  );

  await deleteRemoteRows(
    'categories',
    supabaseUserId,
    deletedCategories,
  );

  // 3. Map local category IDs to their stable sync IDs.
  const categorySyncIds = new Map<number, string>();
  for (const category of activeCategories) {
    if (!category.syncId) {
      throw new Error(`Category "${category.name}" has no sync ID.`);
    }
    categorySyncIds.set(category.id, category.syncId);
  }
  // 4. Upload categories first.
  await upsertRemoteRows(
    'categories',
    activeCategories.map((category) => ({
      user_id: supabaseUserId,
      local_sync_id: category.syncId,
      name: category.name,
      type: category.type,
      icon_name: category.iconName,
      icon_color: category.iconColor,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    })),
  );

  // 5. Upload transactions.
  await upsertRemoteRows(
    'transactions',
    activeTransactions.map((transaction) => {
      const categorySyncId = categorySyncIds.get(
        transaction.categoryId,
      );
      if (!categorySyncId) {
        throw new Error(
          `Transaction ${transaction.id} references a missing or deleted category.`,
        );
      }
      return {
        user_id: supabaseUserId,
        local_sync_id: transaction.syncId,
        category_sync_id: categorySyncId,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        notes: transaction.notes,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
      };
    }),
  );
  // 6. Upload budgets.
  await upsertRemoteRows(
    'budgets',
    activeBudgets.map((budget) => {
      const categorySyncId = categorySyncIds.get(budget.categoryId);

      if (!categorySyncId) {
        throw new Error(
          `Budget ${budget.id} references a missing or deleted category.`,
        );
      }
      return {
        user_id: supabaseUserId,
        local_sync_id: budget.syncId,
        category_sync_id: categorySyncId,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.startDate,
        end_date: budget.endDate,
        created_at: budget.createdAt,
        updated_at: budget.updatedAt,
      };
    }),
  );
  // 7. Every cloud operation succeeded. Now purge local tombstones.
  await db.withTransactionAsync(async () => {
    await deleteLocalTombstones(
      db, userId, 'transactions', deletedTransactions,
    );
    await deleteLocalTombstones(
      db, userId, 'budgets', deletedBudgets,
    );
    await deleteLocalTombstones(
      db, userId, 'categories', deletedCategories,
    );
  });
  //update to show sync status
  await db.runAsync(
    `UPDATE users
     SET hasUnsyncedChanges = 0
     WHERE id = ?`,
    userId,
  );
  return { success: true };
}
