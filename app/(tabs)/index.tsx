/**
 * Dashboard Screen
 *
 * The main home screen of ZeeFi. This is the first screen
 * users see after logging in and serves as the central hub
 * of the application.
 *
 * Sections (top to bottom):
 *  1. ScreenHeader — app logo, greeting, notification, avatar
 *  2. Total Balance Card — large green card showing net balance
 *  3. Stats Row — 2x2 grid of income, expense, savings, budget
 *  4. Budget Progress Card — overall monthly budget status
 *  5. Spending Breakdown — pie chart placeholder with legend
 *  6. Savings Goal Card — Japan Trip progress
 *  7. Recent Transactions — last 4 transactions with View All
 *  8. FloatingActionButton — opens Add Transaction modal
 *
 * The entire screen scrolls vertically. The FAB floats
 * above the ScrollView using absolute positioning.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import ScreenHeader from '@/components/common/ScreenHeader';
import SectionHeader from '@/components/common/SectionHeader';
import StatCard from '@/components/common/StatCard';
import TransactionItem from '@/components/transaction/TransactionItem';
import AddTransactionModal from '@/modals/AddTransactionModal';

import { mockOverallBudget } from '@/data/mockBudgets';
import { mockMonthlySummary, mockSavingsGoal } from '@/data/mockInsights';
import { mockTransactions } from '@/data/mockTransactions';
import { mockUser } from '@/data/mockUser';

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { formatCurrency } from '@/utils/formatters';

export default function DashboardScreen() {
  /** Controls visibility of the Add Transaction modal */
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Only show the 4 most recent transactions in the
   * dashboard preview. The full list is on the History tab.
   */
  const recentTransactions = mockTransactions.slice(0, 4);

  /**
   * Extract the user's first name for the greeting.
   * e.g. "Alex Johnson" → "Alex"
   */
  const firstName = mockUser.name.split(' ')[0];

  /**
   * Get the initials for the avatar circle.
   * e.g. "Alex Johnson" → "AJ"
   */
  const initials = mockUser.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  /**
   * Calculate the savings goal progress percentage.
   */
  const goalPercent = Math.round(
    (mockSavingsGoal.currentAmount / mockSavingsGoal.targetAmount) * 100
  );

  return (
    /**
     * The outer View is position: 'relative' so the
     * FloatingActionButton can be absolutely positioned
     * relative to this container rather than the screen.
     */
    <View style={styles.screen}>
      {/* ── Header ────────────────────────────────── */}
      <ScreenHeader
        title="ZeeFi AI"
        subtitle={`Hello, ${firstName} 👋`}
        avatarInitials={initials}
        onNotificationPress={() => {
          // TODO: Navigate to notifications screen
        }}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      {/* ── Scrollable Content ───────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Total Balance Card ───────────────────── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(12845.60)}
          </Text>

          {/*
           * Small trend indicator showing balance change
           * compared to last month. Hardcoded mock for now.
           * TODO: Calculate real trend from transaction history.
           */}
          <View style={styles.balanceTrendRow}>
            <Ionicons
              name="trending-up"
              size={14}
              color={COLORS.primaryMuted}
            />
            <Text style={styles.balanceTrend}>
              +₦320.40 from last month
            </Text>
          </View>
        </View>

        {/* ── Stats Grid ───────────────────────────── */}
        {/*
         * A 2x2 grid of stat cards. We use flexWrap with
         * flexDirection: 'row' so they naturally wrap into
         * two columns. Each StatCard has flex: 1 so they
         * share space equally within each row.
         */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Monthly Income"
            value={formatCurrency(mockMonthlySummary.totalIncome)}
            trend="+8%"
            trendPositive
          />
          <StatCard
            label="Monthly Expense"
            value={formatCurrency(mockMonthlySummary.totalSpent)}
            trend="-3%"
            trendPositive={false}
          />
          <StatCard
            label="Daily Budget"
            value={formatCurrency(120.00)}
            trend={undefined}
          />
          <StatCard
            label="Monthly Savings"
            value={formatCurrency(mockMonthlySummary.netSavings)}
            trend="+12%"
            trendPositive
          />
        </View>

        {/* ── Budget Progress Card ─────────────────── */}
        <View style={styles.card}>
          <View style={styles.budgetCardHeader}>
            <View>
              <Text style={styles.cardLabel}>Budget Progress</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(mockOverallBudget.totalSpent)}
              </Text>
              <Text style={styles.budgetLimit}>
                Monthly Limit: {formatCurrency(mockOverallBudget.totalBudget)}
              </Text>
            </View>
            <Text style={styles.budgetPercent}>
              {mockOverallBudget.percentUsed}%
            </Text>
          </View>

          <ProgressBar
            percent={mockOverallBudget.percentUsed}
            height={10}
          />

          <Text style={styles.budgetStatusText}>
            ✓ You are on track to stay within budget.
          </Text>
        </View>

        {/* ── Spending Breakdown ───────────────────── */}
        <View style={styles.card}>
          <SectionHeader title="Spending Breakdown" />

          {/*
           * Simple visual approximation of the donut chart
           * from the PDF using colored bars as a legend.
           * TODO: Replace with real donut chart library.
           */}
          <View style={styles.spendingBreakdown}>
            {/*  Donut placeholder */}
            <View style={styles.donutPlaceholder}>
              <View style={styles.donutHole} />
            </View>

            {/* Legend */}
            <View style={styles.spendingLegend}>
              {[
                { label: 'Housing', percent: 40, color: COLORS.categoryBillsIcon },
                { label: 'Dining', percent: 35, color: COLORS.categoryDiningIcon },
                { label: 'Shopping', percent: 25, color: COLORS.categoryShoppingIcon },
              ].map((item) => (
                <View key={item.label} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendPercent}>
                    {item.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Savings Goal Card ────────────────────── */}
        <View style={styles.card}>
          <View style={styles.goalHeader}>
            {/* Goal icon */}
            <View style={styles.goalIconCircle}>
              <Ionicons
                name="airplane-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>
                {mockSavingsGoal.title}
              </Text>
              <Text style={styles.goalSubtitle}>
                {goalPercent}% Complete
              </Text>
            </View>

            <Text style={styles.goalPercent}>{goalPercent}%</Text>
          </View>

          <ProgressBar
            percent={goalPercent}
            height={8}
            overrideColor={COLORS.primary}
          />

          <View style={styles.goalFooter}>
            <Text style={styles.goalAmounts}>
              {formatCurrency(mockSavingsGoal.currentAmount)} of{' '}
              {formatCurrency(mockSavingsGoal.targetAmount)}
            </Text>
            <Text style={styles.goalMonths}>
              {mockSavingsGoal.monthsRemaining} months to go
            </Text>
          </View>

          <Text style={styles.goalContribution}>
            Monthly Contribution:{' '}
            {formatCurrency(mockSavingsGoal.monthlyContribution)}
          </Text>
        </View>

        {/* ── Recent Transactions ──────────────────── */}
        <View style={styles.card}>
          <SectionHeader
            title="Recent Transactions"
            actionLabel="View All"
            onActionPress={() => router.push('/(tabs)/history')}
          />

          {/*
           * Divider lines between transactions are created
           * by adding a bottom border to each item except
           * the last one. We use index to detect the last item.
           */}
          {recentTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                index < recentTransactions.length - 1 &&
                  styles.transactionDivider,
              ]}
            >
              <TransactionItem
                transaction={transaction}
                onPress={() => {
                  // TODO: Navigate to transaction detail screen
                }}
              />
            </View>
          ))}
        </View>

        {/*
         * Bottom padding so the last card is not hidden
         * behind the FloatingActionButton when scrolled
         * to the bottom.
         */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ── Floating Action Button ───────────────── */}
      <FloatingActionButton onPress={() => setModalVisible(true)} />

      {/* ── Add Transaction Modal ────────────────── */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(data) => {
          // TODO: Save transaction to SQLite in a later phase
          console.log('New transaction:', data);
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

  // ── Balance Card ────────────────────────────────
  /**
   * The total balance card is a large green card that
   * spans the full width and sits at the top of the
   * scrollable content area.
   */
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },

  balanceLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  balanceAmount: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  balanceTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },

  balanceTrend: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Stats Grid ──────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },

  // ── Generic Card ────────────────────────────────
  /**
   * Base card style shared by Budget Progress,
   * Spending Breakdown, Savings Goal, and
   * Recent Transactions sections.
   */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  // ── Budget Card ─────────────────────────────────
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },

  cardLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  budgetAmount: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  budgetLimit: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  budgetPercent: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },

  budgetStatusText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },

  // ── Spending Breakdown ──────────────────────────
  spendingBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.md,
  },

  /**
   * Circular donut placeholder. The inner hole is a
   * white circle creating the donut effect.
   * TODO: Replace with real chart library.
   */
  donutPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  donutHole: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
  },

  spendingLegend: {
    flex: 1,
    gap: SPACING.sm,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  legendLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  legendPercent: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  // ── Savings Goal ────────────────────────────────
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  goalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  goalInfo: {
    flex: 1,
  },

  goalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  goalSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  goalPercent: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },

  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },

  goalAmounts: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },

  goalMonths: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  goalContribution: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // ── Recent Transactions ─────────────────────────
  transactionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // ── Bottom Padding ──────────────────────────────
  /**
   * Extra space at the bottom of the scroll view so
   * the last card clears the floating action button.
   */
  bottomPadding: {
    height: 80,
  },
});