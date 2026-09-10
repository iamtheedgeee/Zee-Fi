/**
 * Transaction History Screen
 *
 * Shows the complete list of all transactions grouped
 * by date with search and filter functionality.
 *
 * Sections:
 *  1. ScreenHeader
 *  2. Page title and subtitle
 *  3. Search bar with filter button
 *  4. All / Income / Expense filter tabs
 *  5. Grouped transaction list
 *  6. FloatingActionButton — add new transaction
 *
 * Transactions are grouped by date into sections
 * (Today, Yesterday, August 11 2024, etc.) using
 * the groupTransactionsByDate utility function.
 *
 * The search filters transactions by title in real time
 * as the user types. The type filter (All/Income/Expense)
 * further narrows the results.
 */

import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import FilterTabs from '@/components/common/FilterTabs';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import ScreenHeader from '@/components/common/ScreenHeader';
import SearchBar from '@/components/common/SearchBar';
import TransactionItem from '@/components/transaction/TransactionItem';
import AddTransactionModal from '@/modals/AddTransactionModal';

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { mockTransactions } from '@/data/mockTransactions';
import {
    formatCurrency,
    groupTransactionsByDate,
} from '@/utils/formatters';

/** The three filter tab options */
const FILTER_TABS = ['All', 'Income', 'Expenses'];

export default function HistoryScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  /** Current search query string */
  const [searchQuery, setSearchQuery] = useState('');

  /** Currently active filter tab */
  const [activeFilter, setActiveFilter] = useState('All');

  /**
   * Filter and group transactions based on the current
   * search query and active type filter.
   *
   * useMemo recalculates only when the query or filter
   * changes, not on every render, which keeps the list
   * smooth while typing.
   */
  const groupedTransactions = useMemo(() => {
    let filtered = mockTransactions;

    // Apply type filter
    if (activeFilter === 'Income') {
      filtered = filtered.filter((t) => t.type === 'income');
    } else if (activeFilter === 'Expenses') {
      filtered = filtered.filter((t) => t.type === 'expense');
    }

    // Apply search filter (case-insensitive title match)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.categoryName.toLowerCase().includes(query)
      );
    }

    return groupTransactionsByDate(filtered);
  }, [searchQuery, activeFilter]);

  /**
   * Calculate totals for the filtered transactions
   * to show at the top of the screen.
   */
  const filteredTransactions = groupedTransactions.flatMap(
    (g) => g.transactions
  );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────── */}
      <ScreenHeader
        title="ZeeFi AI"
        subtitle="Transaction History"
      />

      {/* ── Scrollable Content ───────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page Title ──────────────────────────── */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Transaction History</Text>
          <Text style={styles.pageSubtitle}>
            Keep track of every cent you grow.
          </Text>
        </View>

        {/* ── Summary Row ─────────────────────────── */}
        {/*
         * Quick income and expense totals for the
         * currently filtered view.
         */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>SPENT THIS MTH</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>AVG. PER DAY</Text>
            <Text style={[styles.summaryValue, { color: COLORS.income }]}>
              {formatCurrency(totalExpense / 30)}
            </Text>
          </View>
        </View>

        {/* ── Search Bar ──────────────────────────── */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions..."
          showFilter
          onFilterPress={() => {
            // TODO: Open filter modal with date range,
            // amount range, and category filters
          }}
        />

        {/* ── Filter Tabs ─────────────────────────── */}
        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />

        {/* ── Grouped Transaction List ─────────────── */}
        {groupedTransactions.length === 0 ? (
          /*
           * Empty state when no transactions match the
           * current search query or filter.
           */
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No transactions found.
            </Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.dateLabel} style={styles.dateGroup}>
              {/* Date group header */}
              <View style={styles.dateGroupHeader}>
                <Text style={styles.dateGroupLabel}>
                  {group.dateLabel}
                </Text>
                <Text style={styles.dateGroupCount}>
                  {group.transactions.length}{' '}
                  {group.transactions.length === 1 ? 'item' : 'items'}
                </Text>
              </View>

              {/* Transactions card for this date group */}
              <View style={styles.transactionsCard}>
                {group.transactions.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={[
                      index < group.transactions.length - 1 &&
                        styles.transactionDivider,
                    ]}
                  >
                    <TransactionItem
                      transaction={transaction}
                      onPress={() => {
                        // TODO: Navigate to transaction detail
                      }}
                      showDelete
                      onDelete={() => {
                        // TODO: Delete transaction from SQLite
                        console.log('TODO: Delete', transaction.id);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ── Floating Action Button ───────────────── */}
      <FloatingActionButton onPress={() => setModalVisible(true)} />

      {/* ── Add Transaction Modal ────────────────── */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(data) => {
          console.log('TODO: Save transaction:', data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  // ── Page Title ──────────────────────────────────
  pageTitleSection: {
    gap: SPACING.xs,
  },

  pageTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  pageSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  // ── Summary Row ─────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },

  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  summaryValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Date Groups ─────────────────────────────────
  dateGroup: {
    gap: SPACING.sm,
  },

  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },

  dateGroupLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  dateGroupCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  /**
   * Each date group's transactions are wrapped in a
   * white card so they visually group together.
   */
  transactionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },

  transactionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // ── Empty State ─────────────────────────────────
  emptyState: {
    padding: SPACING['4xl'],
    alignItems: 'center',
  },

  emptyStateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },

  bottomPadding: {
    height: 80,
  },
});