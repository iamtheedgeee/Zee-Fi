
import type { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../supabase';

import type { User } from './user';

export async function getLoggedInUser(
  db: SQLiteDatabase
): Promise<User | null> {
  return db.getFirstAsync<User>(
    `SELECT *
     FROM users
     WHERE loggedIn = 1
     LIMIT 1`
  );
}

export async function setLoggedIn(
  db: SQLiteDatabase,
  userId: number,
  loggedIn: boolean
) {
  await db.runAsync(
    `UPDATE users
     SET loggedIn = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    loggedIn ? 1 : 0,
    userId
  );
}

export async function registerOnlineAccount(
  db: SQLiteDatabase,
  user: User,
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: user.name,
        },
      },
    });

  if (error) throw error;

  if (!data.user) {
    throw new Error('Could not create Supabase account.');
  }

  // Supabase may require email confirmation.
  // Do not assume that the user is authenticated yet.
  if (!data.session) {
    return {
      needsEmailConfirmation: true,
      supabaseUserId: data.user.id,
    };
  }

  await db.runAsync(
    `UPDATE users
     SET supabaseUserId = ?,
         email = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    data.user.id,
    email,
    user.id
  );

  return {
    needsEmailConfirmation: false,
    supabaseUserId: data.user.id,
  };
}

export async function loginOnline(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) throw error;

  if (!data.user) {
    throw new Error('Login failed.');
  }

  return data.user;
}

export async function logoutOnline() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}


export async function logoutLocalUser(
  db: SQLiteDatabase,
  userId: number
) {
  await db.runAsync(
    `UPDATE users
     SET loggedIn = 0,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    userId
  );
}

