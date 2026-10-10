import { CreateCategoryInput } from "@/database/services/category";

export const DEFAULT_CATEGORIES: Omit<CreateCategoryInput, 'userId'>[] = [
  // Expenses
  { name: 'Food & Dining',    type: 'expense', iconName:"restaurant-outline", iconColor:"Red"},
  { name: 'Transport',        type: 'expense', iconName:"car-outline", iconColor:"Purple"},
  { name: 'Shopping',         type: 'expense', iconName:"cart-outline", iconColor:"Orange"},
  { name: 'Utilities',        type: 'expense', iconName:"flash-outline", iconColor:"Blue" },
  { name: 'Health & Medical', type: 'expense', iconName:"fitness-outline", iconColor:"Yellow"},
  { name: 'Entertainment',    type: 'expense', iconName:"game-controller-outline", iconColor:"Indigo"},
  
  // Income
  { name: 'Salary',           type: 'income', iconName:"cash-outline", iconColor:"Forest" },
  { name: 'Freelance',        type: 'income', iconName:"laptop-outline", iconColor:"Green" },
  { name: 'Gift',         type: 'income', iconName:"star-outline", iconColor:"Teal" },
];
