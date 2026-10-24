/**
 * Category Service
 *
 * All SQLite operations for the categories table.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { markUnsynced } from './user';

export type Category = {
  id: number;
  userId: number;
  syncId: string | null;
  name: string;
  iconName:string;
  iconColor:string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
  deletedAt: string |null;
};

export type CreateCategoryInput = {
  userId: number;
  name: string;
  type: 'income' | 'expense';
  iconName:string;
  iconColor:string;
};

/**
 * Fetches all categories for a user.
 * Optionally filter by type ('income' or 'expense').
 */
export async function getCategories(
  db: SQLiteDatabase,
  userId: number,
  type?: 'income' | 'expense'
): Promise<Category[]> {
  if (type) {
    return db.getAllAsync<Category>(
      `SELECT * FROM categories
       WHERE userId = ? AND type = ?
       ORDER BY name ASC;`,
      userId,
      type
    );
  }

  return db.getAllAsync<Category>(
    `SELECT * FROM categories
     WHERE userId = ?
     ORDER BY name ASC;`,
    userId
  );
}

/**
 * Creates a new category.
 */
export async function createCategory(
  db: SQLiteDatabase,
  input: CreateCategoryInput
): Promise<Category> {
  const result = await db.runAsync(
    `INSERT INTO categories (userId, name, type, iconName, iconColor)
     VALUES (?, ?, ?, ?, ?);`,
    input.userId,
    input.name,
    input.type,
    input.iconName,
    input.iconColor
  );

  const category = await db.getFirstAsync<Category>(
    `SELECT * FROM categories WHERE id = ?;`,
    result.lastInsertRowId
  );

  if (!category) {
    throw new Error('Failed to retrieve the newly created category.');
  }
  await markUnsynced(db, input.userId);
  return category;
}

/**
 * Updates a category's name or type.
 */

export async function updateCategory(
  db: SQLiteDatabase,
  id: number,
  input: Partial<Pick<CreateCategoryInput, 'name' | 'type' | 'iconColor' | 'iconName'>>
): Promise<Category> {
  const fields = Object.keys(input) as ('name' | 'type' | 'iconName' | 'iconColor')[];
  if (fields.length === 0) throw new Error('No fields to update.'); 

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => input[f] ?? null);

  await db.runAsync(
    `UPDATE categories
     SET ${setClauses}, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    [...values,id]
    
  );

  const category = await db.getFirstAsync<Category>(
    `SELECT * FROM categories WHERE id = ?;`,
    [id]
  );

  if (!category) {
    throw new Error(`Category with id ${id} not found after update.`);
  }
    await markUnsynced(db, category.userId);
  return category;
}
  

/**
 * Deletes a category.
 * Note: The schema uses ON DELETE RESTRICT on transactions
 * and budgets, so this will fail if any transactions or
 * budgets reference this category. Handle that error in
 * the calling component and show the user a message.
 */
export async function deleteCategory(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  const cat=await db.runAsync(
    `DELETE FROM categories WHERE id = ?;`,
    id
  );
    //await markUnsynced(db, cat.userId);

}
