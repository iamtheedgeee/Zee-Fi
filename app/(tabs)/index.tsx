import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import ScreenHeader from '@/components/common/ScreenHeader';
import SectionHeader from '@/components/common/SectionHeader';
import StatCard from '@/components/common/StatCard';
import TransactionItem from '@/components/transaction/TransactionItem';
import AddTransactionModal from '@/modals/AddTransactionModal3';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { PieChart } from "react-native-gifted-charts";


import {
  CATEGORY_COLOR_OPTIONS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { buildSpendingBreakdown, CategorySpending, getCategoriesSpending } from '@/database/services/analyses';
import { useBudgetStore, useTransactionStore, useUserStore } from '@/store';
import { getDashboardRange } from '@/utils/date';
import { formatCurrency, toTitleCase } from '@/utils/formatters';
import { useSQLiteContext } from 'expo-sqlite';



export default function DashboardScreen() {
  const db=useSQLiteContext()
  const [modalVisible, setModalVisible] = useState(false);
  const { user,summary,period,setSummary,setPeriod,percentChange,summaryLoading } = useUserStore();
  const {budgets}=useBudgetStore(); 
  const { transactions } = useTransactionStore(); 
  const [categorySpending, setCategorySpending] =useState<CategorySpending[]>([]);
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const recentTransactions = [...transactions].sort((a, b) => {
    return Date.parse(b.date) - Date.parse(a.date);
  }).slice(0,4);
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce(
    (sum, b) => sum + ((b as any).spent ?? 0),
    0
  );
  const overallPercent =
    totalBudget > 0
        ? Math.min(100, Math.round((totalSpent / totalBudget) * 100))
        : 0;

  const cyclePeriod = () => {
      if(summaryLoading) return
      setPeriod();
    };
    const spendingBreakdown = useMemo(() => {
    const getColor = (iconColor: string) =>
      CATEGORY_COLOR_OPTIONS.find(
        (option) => option.label === iconColor
      )?.icon ?? COLORS.textMuted

    return buildSpendingBreakdown(
      categorySpending,
      getColor,
      COLORS.textMuted
    );
  }, [categorySpending])
  useEffect(()=>{
    //cleanup variable
    let cancelled = false;
    console.log("h")
    console.log(transactions)
    async function refreshSummary(){
      if (summaryLoading) return
      await setSummary(db)
    }
    if (!user) return;


    async function loadSpending() {
      const { startDate, endDate } = getDashboardRange(period);
      try {
        const result = await getCategoriesSpending(
          db,
          user!.id,
          startDate,
          endDate
        );

        if (!cancelled) {
          setCategorySpending(result);
        }
      } catch (error) {
        console.error('Failed to load category spending:', error)
      }
   }

    loadSpending()
    refreshSummary()
  },[db,period,user?.id,transactions])
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
        onNotificationPress={() => {
          // TODO: Navigate to notifications screen
        }}
      />

      {/* ── Scrollable Content ───────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Total Balance Card ───────────────────── */}
        <Pressable style={styles.balanceCard} onPress={cyclePeriod}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(user?.balance??0)}
          </Text>

        </Pressable>

        {/* ── Stats Grid ───────────────────────────── */}
        {/*
         * A 2x2 grid of stat cards. We use flexWrap with
         * flexDirection: 'row' so they naturally wrap into
         * two columns. Each StatCard has flex: 1 so they
         * share space equally within each row.
         */}
        <View style={styles.statsGrid}>
          <StatCard
            label={`${toTitleCase(period)} Income`}
            func={cyclePeriod}
            summaryLoading={summaryLoading}
            value={summary?.periodIncome}
            trend={percentChange?.incomeChange}
            trendPositive
          />
          <StatCard
            func={cyclePeriod}
            summaryLoading={summaryLoading}
            label={`${toTitleCase(period)} Expense`}
            value={summary?.periodExpense}
            trend={percentChange?.expenseChange}
            trendPositive={false}
          />
        </View>

        {/* ── Budget Progress Card ─────────────────── *
            SUMS UP ALL THE BUDGETS AND GETS THE COMBINED PROGRESS CLICK TO GO TO BUDGET PAGE
        */}
        <View style={styles.card}>
          <View style={styles.budgetCardHeader}>
            <View>
              <Text style={styles.cardLabel}>Budget Progress</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(totalSpent)}
              </Text>
              <Text style={styles.budgetLimit}>
                Monthly Limit: {formatCurrency(totalBudget)}
              </Text>
            </View>
            <Text style={styles.budgetPercent}>
              {overallPercent}%
            </Text>
          </View>

          <ProgressBar
            percent={overallPercent}
            height={10}
          />

          <Text style={styles.budgetStatusText}>
          </Text>
        </View>

        {/* ── Spending Breakdown ───────────────────── */}
        <View style={styles.card}>
          <SectionHeader title={`${toTitleCase(period)} Spending Breakdown`} />

          <View style={styles.spendingBreakdown}>


            {/* Legend */}
            {(!summaryLoading)?(spendingBreakdown.length > 0 ? (
              <>
                <View style={styles.spendingChart}>
                  <PieChart
                    data={spendingBreakdown.map((item) => ({
                      value: item.amount,
                      color: item.color,
                      text: item.label,
                    }))}
                    donut
                    radius={90}
                    innerRadius={60}
                    innerCircleColor={COLORS.background}
                    showText={false}
                  />
                </View>

                <View style={styles.spendingLegend}>
                  {spendingBreakdown.map((item) => (
                    <View key={item.label} style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: item.color },
                        ]}
                      />

                      <Text style={styles.legendLabel}>
                        {item.label.split(' ')[0]}
                      </Text>

                      <Text style={styles.legendPercent}>
                        {Math.round(item.percent)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
        ) : (
          <View style={styles.emptySpending}>
            <Text style={styles.emptySpendingText}>
              No expenses recorded for this period.
            </Text>
          </View>
        )):<View style={styles.emptySpending}>
              <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                />
          </View>}
          </View>
        </View>

        
        {/* ── Recent Transactions ──────────────────── */}
        <View style={styles.card}>
          <SectionHeader
            title="Recent Transactions"
            actionLabel="View All"
            onActionPress={() => router.push('/history')}
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
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ── Floating Action Button ─────────────────*/}
      <FloatingActionButton onPress={() => setModalVisible(true)} />

      {/* ── Add Transaction Modal ────────────────── */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false)
          console.log('Successfully added new transaction');
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
    width:'100%',
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
  spendingChart: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },

  emptySpending: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },

  emptySpendingText: {
    color: COLORS.textMuted,
    textAlign: 'center',
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