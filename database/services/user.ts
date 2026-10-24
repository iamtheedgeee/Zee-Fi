
import type { SQLiteDatabase } from 'expo-sqlite';
export interface User {
  id: number;
  name: string;
  email: string | null;
  currency: string;
  balance: number;
  initialBalance: number;
  loggedIn: number;
  supabaseUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
export async function createUser(
  db: SQLiteDatabase,
  name: string,
  email: string,
  balance: number,
  currency: string = 'NGN'
): Promise<User> {
  console.log(name,email,currency)
  const result = await db.runAsync(
    `INSERT INTO users (name, email, currency, balance, initialBalance) VALUES (?, ?, ?, ?, ?)`,
    name,
    email,
    currency,
    balance,
    balance,
  );
  const user = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?;`,
    result.lastInsertRowId
  );

  if (!user) throw new Error('Failed to retrieve the newly created user.');
  return user;
}

export async function getUser(
  db: SQLiteDatabase,
  id: number
): Promise<User | null> {
  return db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?;`,
    id
  );
}

export async function getFirstUser(
  db: SQLiteDatabase
): Promise<User | null> {
  return db.getFirstAsync<User>(`SELECT * FROM users LIMIT 1;`);
}

/*export async function updateUser(
  db: SQLiteDatabase,
  id: number,
  input: Partial<Pick<User, 'name' | 'email' | 'currency'>>
): Promise<User> {
  const fields = Object.keys(input) as (keyof typeof input)[];
  if (fields.length === 0) throw new Error('No fields to update.');

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => input[f]);

  await db.runAsync(
    `UPDATE users SET ${setClauses}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?;`,
    ...values,
    id
  );
  
*/

export async function adjustUserBalance(
  db: SQLiteDatabase,
  userId: number,
  delta: number
): Promise<User> {
  await db.runAsync(
    `UPDATE users
     SET balance = balance + ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    delta,
    userId
  );

  const user = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?;`,
    userId
  );
  if (!user) throw new Error(`User with id ${userId} not found after balance update.`);
  return user;
}

export async function deleteUser(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(`DELETE FROM users WHERE id = ?;`, id);
}

export async function markUnsynced(
  db: SQLiteDatabase,
  userId: number
) {
  await db.runAsync(
    `UPDATE users
     SET hasUnsyncedChanges = 1
     WHERE id = ?;`,
    userId
  );
}