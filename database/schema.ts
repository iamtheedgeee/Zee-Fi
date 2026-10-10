//database/schema.ts
import type { SQLiteDatabase } from 'expo-sqlite';
export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      currency TEXT NOT NULL DEFAULT 'NGN',
      balance REAL NOT NULL DEFAULT 0,
      initialBalance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY NOT NULL,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      iconName TEXT NOT NULL,
      iconColor TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY NOT NULL,
      userId INTEGER NOT NULL,
      categoryId INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      date TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY NOT NULL,
      userId INTEGER NOT NULL,
      categoryId INTEGER NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY NOT NULL,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'info', 'tip')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      periodStart TEXT NOT NULL,
      periodEnd TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}
