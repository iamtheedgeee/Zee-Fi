import { CreateCategoryInput } from "@/database/services/category";

export const DEFAULT_CATEGORIES: Omit<CreateCategoryInput, 'userId'>[] = [
// Expenses
{ name: 'Food & Dining',    type: 'expense', iconName: "restaurant-outline",     iconColor: "Red" },
{ name: 'Shopping',          type: 'expense', iconName: "cart-outline",           iconColor: "Orange" },
{ name: 'Utilities',          type: 'expense', iconName: "flash-outline",          iconColor: "Blue" },
{ name: 'Health & Medical',  type: 'expense', iconName: "fitness-outline",        iconColor: "Yellow" },
{ name: 'Entertainment',     type: 'expense', iconName: "game-controller-outline", iconColor: "Indigo" },
{ name: 'UNN',               type: 'expense', iconName: "school-outline",          iconColor: "Purple" },
{ name: 'Wife',              type: 'expense', iconName: "heart-outline",           iconColor: "Red" },
{ name: 'Junk Food',         type: 'expense', iconName: "fast-food-outline",       iconColor: "Orange" },
{ name: 'Airtime',           type: 'expense', iconName: "phone-portrait-outline",  iconColor: "Green" },
{ name: 'Transportation',   type: 'expense', iconName: "bus-outline",             iconColor: "Blue" },
{ name: 'Books',             type: 'expense', iconName: "book-outline",           iconColor: "Indigo" },
{ name: 'Foodstuff',         type: 'expense', iconName: "basket-outline",         iconColor: "Forest" },
{ name: 'Soda',              type: 'expense', iconName: "beer-outline",           iconColor: "Teal" },
{ name: 'Electricity',       type: 'expense', iconName: "flash-outline",          iconColor: "Yellow" },

// Income
{ name: 'Salary',            type: 'income', iconName: "cash-outline",            iconColor: "Forest" },
{ name: 'Freelance',         type: 'income', iconName: "laptop-outline",          iconColor: "Green" },
{ name: 'Gift',              type: 'income', iconName: "star-outline",            iconColor: "Teal" },
{ name: 'Allowance',         type: 'income', iconName: "wallet-outline",          iconColor: "Purple" },
{ name: 'Friends',           type: 'income', iconName: "people-outline",          iconColor: "Blue" },
{ name: 'Uncles',            type: 'income', iconName: "person-outline",          iconColor: "Orange" },
];
