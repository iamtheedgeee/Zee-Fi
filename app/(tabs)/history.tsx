import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FilterTabs from '@/components/common/FilterTabs';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import ScreenHeader from '@/components/common/ScreenHeader';
import SearchBar from '@/components/common/SearchBar';
import TransactionItem from '@/components/transaction/TransactionItem';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import AddTransactionModal from '@/modals/AddTransactionModal3';
import DateFilterModal, {
  DateFilter,
  buildPresetFilter,
} from '@/modals/DateFilterModal';
import { useCategoryStore, useTransactionStore } from '@/store';
import {
  formatCurrency,
  groupTransactionsByDate,
} from '@/utils/formatters';

const FILTER_TABS = ['All', 'Income', 'Expenses'];

export default function HistoryScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);

  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  /**
   * Date filter state.
   * Starts as "All Time" so no transactions are hidden by default.
   * Replaced entirely when the user applies a new filter from
   * the DateFilterModal.
   */
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    () => buildPresetFilter('this_month')
  );

  /**
   * Whether a non-default date filter is active.
   * Used to visually highlight the filter button and
   * show the active filter label below the search bar.
   */
  const isDateFiltered = dateFilter.preset !== 'all';

  // ── Filtering ───────────────────────────────────────────
  const groupedTransactions = useMemo(() => {
    let filtered = transactions;

    // 1. Type filter (All / Income / Expenses)
    if (activeFilter === 'Income') {
      filtered = filtered.filter((t) => t.type === 'income');
    } else if (activeFilter === 'Expenses') {
      filtered = filtered.filter((t) => t.type === 'expense');
    }

    // 2. Search filter (by category name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        categories
          .find((c) => c.id === t.categoryId)
          ?.name.toLowerCase()
          .includes(query)
      );
    }

    // 3. Date filter
    /**
     * Both the transaction date and the filter bounds are
     * ISO date strings (YYYY-MM-DD), so string comparison
     * works correctly for date ordering.
     */
    if (isDateFiltered) {
      filtered = filtered.filter(
        (t) =>
          t.date >= dateFilter.startDate &&
          t.date <= dateFilter.endDate
      );
    }

    return groupTransactionsByDate(filtered);
  }, [
    searchQuery,
    activeFilter,
    transactions,
    dateFilter,
    isDateFiltered,
    categories,
  ]);

  // ── Totals ──────────────────────────────────────────────
  const filteredTransactions = groupedTransactions.flatMap(
    (g) => g.transactions
  );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // ── Render ───────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScreenHeader title="ZeeFi AI" subtitle="Transaction History" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page title ──────────────────────────── */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Transaction History</Text>
          <Text style={styles.pageSubtitle}>
            Keep track of every cent you grow.
          </Text>
        </View>

        {/* ── Summary row ─────────────────────────── */}
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

        {/* ── Search + filter button row ───────────── */}
        {/**
         * The SearchBar already has a showFilter prop but we
         * want the filter button to be visually distinct when
         * a date filter is active, so we render the filter
         * button separately beside the search bar.
         */}
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search transactions..."
            />
          </View>

          {/**
           * The filter button glows green when a date filter
           * is active so the user knows something is applied.
           */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              isDateFiltered && styles.filterButtonActive,
            ]}
            onPress={() => setDateFilterVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={isDateFiltered ? COLORS.textOnPrimary : COLORS.textSecondary}
            />
            {/**
             * Badge dot shown when a date filter is active.
             * Small visual indicator that something is applied
             * even when the button is just glanced at.
             */}
            {isDateFiltered && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

        {/* ── Active date filter pill ──────────────── */}
        {/**
         * When a date filter is active, show a dismissible
         * pill below the search row so the user always knows
         * their results are being narrowed by date.
         */}
        {isDateFiltered && (
          <View style={styles.activeDatePill}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.activeDatePillText}>
              {dateFilter.label}
            </Text>
            <TouchableOpacity
              onPress={() => setDateFilter(buildPresetFilter('all'))}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Type filter tabs ─────────────────────── */}
        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />

        {/* ── Empty state ──────────────────────────── */}
        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={40}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyStateText}>
              {isDateFiltered || searchQuery || activeFilter !== 'All'
                ? 'No transactions match your filters.'
                : 'No transactions yet.'}
            </Text>
            {(isDateFiltered || searchQuery || activeFilter !== 'All') && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('All');
                  setDateFilter(buildPresetFilter('all'));
                }}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllButtonText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.dateLabel} style={styles.dateGroup}>
              <View style={styles.dateGroupHeader}>
                <Text style={styles.dateGroupLabel}>
                  {group.dateLabel}
                </Text>
                <Text style={styles.dateGroupCount}>
                  {group.transactions.length}{' '}
                  {group.transactions.length === 1 ? 'item' : 'items'}
                </Text>
              </View>

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
                      onPress={() => {}}
                      showDelete
                      onDelete={() => {
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

      <FloatingActionButton onPress={() => setModalVisible(true)} />

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <DateFilterModal
        visible={dateFilterVisible}
        onClose={() => setDateFilterVisible(false)}
        onApply={setDateFilter}
        currentFilter={dateFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: { flex: 1 },

  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  pageTitleSection: { gap: SPACING.xs },

  pageTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  pageSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

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

  // ── Search + filter row ──────────────────────────────
  /**
   * Row containing the search bar and filter button.
   * The search bar gets flex: 1 so it fills available
   * space while the filter button stays fixed width.
   */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  searchBarWrapper: {
    flex: 1,
  },

  filterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  /** Small dot overlaid on the filter button when active */
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },

  // ── Active date filter pill ──────────────────────────
  /**
   * Compact pill shown below the search row when a date
   * filter is active. Has a close button to dismiss quickly
   * without opening the modal again.
   */
  activeDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  activeDatePillText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },

  // ── Date groups ──────────────────────────────────────
  dateGroup: { gap: SPACING.sm },

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

  // ── Empty state ──────────────────────────────────────
  emptyState: {
    padding: SPACING['4xl'],
    alignItems: 'center',
    gap: SPACING.md,
  },

  emptyStateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  clearAllButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  clearAllButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
  },

  bottomPadding: { height: 80 },
});