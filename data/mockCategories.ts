import { COLORS } from '@/constants';
import { Category } from '@/types';

/**
 * Master list of transaction categories available in the app.
 * These match the categories shown across the PDF wireframes.
 *
 * iconName values correspond to Ionicons icon names from
 * @expo/vector-icons which is available in all Expo projects.
 */

export const mockCategories: Category[] = [
  {
    id: 'cat-001',
    name: 'Dining & Drinks',
    iconName: 'restaurant-outline',
    iconBackground: COLORS.categoryDining,
    iconColor: COLORS.categoryDiningIcon,
    type: 'expense',
  },
  {
    id: 'cat-002',
    name: 'Weekly Groceries',
    iconName: 'cart-outline',
    iconBackground: COLORS.categoryGroceries,
    iconColor: COLORS.categoryGroceriesIcon,
    type: 'expense',
  },
  {
    id: 'cat-003',
    name: 'Transport & Fuel',
    iconName: 'car-outline',
    iconBackground: COLORS.categoryTransport,
    iconColor: COLORS.categoryTransportIcon,
    type: 'expense',
  },
  {
    id: 'cat-004',
    name: 'Shopping',
    iconName: 'bag-outline',
    iconBackground: COLORS.categoryShopping,
    iconColor: COLORS.categoryShoppingIcon,
    type: 'expense',
  },
  {
    id: 'cat-005',
    name: 'Utilities',
    iconName: 'flash-outline',
    iconBackground: COLORS.categoryUtilities,
    iconColor: COLORS.categoryUtilitiesIcon,
    type: 'expense',
  },
  {
    id: 'cat-006',
    name: 'Health & Fitness',
    iconName: 'fitness-outline',
    iconBackground: COLORS.categoryHealth,
    iconColor: COLORS.categoryHealthIcon,
    type: 'expense',
  },
  {
    id: 'cat-007',
    name: 'Entertainment',
    iconName: 'game-controller-outline',
    iconBackground: COLORS.categoryEntertainment,
    iconColor: COLORS.categoryEntertainmentIcon,
    type: 'expense',
  },
  {
    id: 'cat-008',
    name: 'Coffee',
    iconName: 'cafe-outline',
    iconBackground: COLORS.categoryCoffee,
    iconColor: COLORS.categoryCoffeeIcon,
    type: 'expense',
  },
  {
    id: 'cat-009',
    name: 'Monthly Salary',
    iconName: 'cash-outline',
    iconBackground: COLORS.categorySalary,
    iconColor: COLORS.categorySalaryIcon,
    type: 'income',
  },
  {
    id: 'cat-010',
    name: 'Bonus',
    iconName: 'star-outline',
    iconBackground: COLORS.categoryBonus,
    iconColor: COLORS.categoryBonusIcon,
    type: 'income',
  },
  {
    id: 'cat-011',
    name: 'Freelance Payment',
    iconName: 'laptop-outline',
    iconBackground: COLORS.categorySalary,
    iconColor: COLORS.categorySalaryIcon,
    type: 'income',
  },
];