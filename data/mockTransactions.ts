import { Transaction } from '@/types';

/**
 * Mock transaction data for UI development.
 *
 * Transactions are stored in reverse chronological order
 * (newest first) since that is how they appear in the
 * Transaction History screen.
 *
 * All amounts are in Nigerian Naira (₦).
 * Amounts are always positive — the transaction type
 * determines whether money went in or out.
 *
 * TODO: Replace with real data from SQLite in a later phase.
 */
export const mockTransactions: Transaction[] = [
  // ── Today, August 14 ─────────────────────────
  {
    id: 'txn-001',
    title: 'Starbucks Coffee',
    categoryId: 'cat-008',
    categoryName: 'Coffee',
    type: 'expense',
    amount: 5.50,
    date: '2024-08-14T09:41:00',
    note: null,
    account: 'Main Savings',
  },
  {
    id: 'txn-002',
    title: 'Freelance Payment',
    categoryId: 'cat-011',
    categoryName: 'Income',
    type: 'income',
    amount: 800.00,
    date: '2024-08-14T10:15:00',
    note: 'Client project payment',
    account: 'Main Savings',
  },

  // ── Yesterday, August 13 ──────────────────────
  {
    id: 'txn-003',
    title: 'Whole Foods Market',
    categoryId: 'cat-002',
    categoryName: 'Shopping',
    type: 'expense',
    amount: 142.20,
    date: '2024-08-13T14:22:00',
    note: null,
    account: 'Main Savings',
  },
  {
    id: 'txn-004',
    title: 'Netflix Subscription',
    categoryId: 'cat-007',
    categoryName: 'Entertainment',
    type: 'expense',
    amount: 15.99,
    date: '2024-08-13T00:00:00',
    note: null,
    account: 'Main Savings',
  },
  {
    id: 'txn-005',
    title: 'Shell Petrol Station',
    categoryId: 'cat-003',
    categoryName: 'Transport',
    type: 'expense',
    amount: 65.00,
    date: '2024-08-13T07:25:00',
    note: null,
    account: 'Main Savings',
  },

  // ── August 11 ────────────────────────────────
  {
    id: 'txn-006',
    title: 'Apple Store',
    categoryId: 'cat-004',
    categoryName: 'Shopping',
    type: 'expense',
    amount: 129.00,
    date: '2024-08-11T13:00:00',
    note: null,
    account: 'Main Savings',
  },
  {
    id: 'txn-007',
    title: 'Steam Games',
    categoryId: 'cat-007',
    categoryName: 'Entertainment',
    type: 'expense',
    amount: 24.50,
    date: '2024-08-11T20:00:00',
    note: null,
    account: 'Main Savings',
  },

  // ── August 9 ─────────────────────────────────
  {
    id: 'txn-008',
    title: 'Monthly Salary',
    categoryId: 'cat-009',
    categoryName: 'Income',
    type: 'income',
    amount: 4900.00,
    date: '2024-08-09T08:00:00',
    note: null,
    account: 'Main Savings',
  },
  {
    id: 'txn-009',
    title: 'Weekly Groceries',
    categoryId: 'cat-002',
    categoryName: 'Shopping',
    type: 'expense',
    amount: 142.20,
    date: '2024-08-09T11:30:00',
    note: null,
    account: 'Main Savings',
  },
  {
    id: 'txn-010',
    title: 'Rent Payment',
    categoryId: 'cat-005',
    categoryName: 'Housing',
    type: 'expense',
    amount: 1200.00,
    date: '2024-08-09T09:00:00',
    note: 'August rent',
    account: 'Main Savings',
  },
];