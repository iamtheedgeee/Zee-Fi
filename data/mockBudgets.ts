import { COLORS } from '@/constants';
import { Budget } from '@/types';

export const mockBudgets: Budget[] = [
  {
    id: 'bud-001',
    categoryId: 'cat-001',
    categoryName: 'Dining & Drinks',
    iconName: 'restaurant-outline',
    iconBackground: COLORS.categoryDining,
    iconColor: COLORS.categoryDiningIcon,
    limit: 600.00,
    spent: 450.80,
    daysRemaining: 17,
  },
  {
    id: 'bud-002',
    categoryId: 'cat-002',
    categoryName: 'Weekly Groceries',
    iconName: 'cart-outline',
    iconBackground: COLORS.categoryGroceries,
    iconColor: COLORS.categoryGroceriesIcon,
    limit: 700.00,
    spent: 520.15,
    daysRemaining: 17,
  },
  {
    id: 'bud-003',
    categoryId: 'cat-003',
    categoryName: 'Transport & Fuel',
    iconName: 'car-outline',
    iconBackground: COLORS.categoryTransport,
    iconColor: COLORS.categoryTransportIcon,
    limit: 200.00,
    spent: 120.00,
    daysRemaining: 17,
  },
  {
    id: 'bud-004',
    categoryId: 'cat-007',
    categoryName: 'Entertainment',
    iconName: 'game-controller-outline',
    iconBackground: COLORS.categoryEntertainment,
    iconColor: COLORS.categoryEntertainmentIcon,
    limit: 100.00,
    spent: 85.00,
    daysRemaining: 17,
  },
  {
    id: 'bud-005',
    categoryId: 'cat-006',
    categoryName: 'Health & Fitness',
    iconName: 'fitness-outline',
    iconBackground: COLORS.categoryHealth,
    iconColor: COLORS.categoryHealthIcon,
    limit: 150.00,
    spent: 95.00,
    daysRemaining: 17,
  },
];

/**
 * The overall monthly budget summary shown at the top of
 * the My Budgets screen.
 */
export const mockOverallBudget = {
  totalBudget: 1270.75,
  totalSpent: 950.00,
  percentUsed: 75,
  daysRemaining: 17,
};