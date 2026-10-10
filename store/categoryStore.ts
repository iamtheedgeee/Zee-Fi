import { DEFAULT_CATEGORIES } from '@/constants/defaults';
import { Category, createCategory, getCategories } from '@/database/services/category';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';
interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // ── Actions ──────────────────────────────────────────
  setCategories: (db:SQLiteDatabase,userId:number) => Promise<void>;
  seedDefaultCategories: (db:SQLiteDatabase, userId:number) =>Promise<void>;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const useCategoryStore = create<CategoryState>((set) => ({
  ...initialState,
  
  setCategories: async (db,userId) =>{
    set({ isLoading: true, error: null });
    console.log("Fetching Categories")
    try {
      const categories = await getCategories(db, userId);
      console.log("Categories Fetched")
      set({ categories });
    } catch (error) {
      set({ error: 'Failed to load Categories.' });
    } finally {
      set({ isLoading: false });
    }
  
  },
  seedDefaultCategories: async(db,userId)=>{
    const created: Category[] = [];
    try{
      for (const cat of DEFAULT_CATEGORIES) {
        const category = await createCategory(db, {
          userId: userId,
          ...cat,
        });
        created.push(category);
      }
      set({categories:created})
    } catch (error) {
      console.log(error)
      set({error:"Failed to Seed Categories"})
    } 
    
  },
  addCategory: (category) =>{
    console.log("Adding cat")
    set((state) => ({
      categories: [...state.categories, category],
    }))
    console.log("finished setting cat")
  },

  updateCategory: (category) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === category.id ? category : c
      ),
    })),

  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));