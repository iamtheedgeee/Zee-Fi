/**
 * Financial Insights Screen — wired to real data.
 *
 * Changes from the mock version:
 *  - Reads from useInsights() hook instead of mockInsights
 *  - Period switcher (Weekly / Monthly / Yearly) at the top
 *  - Loading state while engine runs
 *  - Empty state when no transactions exist for the period
 *  - Pull-to-refresh triggers forced regeneration
 *  - Financial score derived from real savings rate
 *  - Real monthly summary from transaction store
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import SectionHeader from '@/components/common/SectionHeader';
import InsightCard from '@/components/insights/InsightCard';
import AddTransactionModal from '@/modals/AddTransactionModal';

import ScreenHeader from '@/components/common/ScreenHeader';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { InsightPeriodType } from '@/database/services/insightEngine';
import { useInsights } from '@/hooks/useInsights';
import { useBudgetStore } from '@/store/budgetStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useUserStore } from '@/store/userStore';
import { formatCurrency } from '@/utils/formatters';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────
// Period tab config
// ─────────────────────────────────────────────────────────

const PERIOD_TABS: { id: InsightPeriodType; label: string }[] = [
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly',  label: 'Yearly'  },
];

// ─────────────────────────────────────────────────────────
// Financial score derivation
//
// Rather than a hardcoded number, derive a 0-100 score
// from the user's actual financial behaviour this period.
//
// Scoring components:
//   Savings rate (40 pts max)
//   Budget adherence (30 pts max)
//   Income recorded (15 pts max)
//   Transaction consistency (15 pts max)
// ─────────────────────────────────────────────────────────

function deriveFinancialScore(
  totalIncome: number,
  totalExpense: number,
  budgetCount: number,
  exceededBudgetCount: number,
  transactionCount: number
): { score: number; label: string } {
  let score = 0;

  // Savings rate component (40 pts)
  if (totalIncome > 0) {
    const savingsRate = Math.max(0, (totalIncome - totalExpense) / totalIncome);
    score += Math.round(savingsRate * 40);
  }

  // Budget adherence (30 pts)
  if (budgetCount > 0) {
    const adherenceRate =
      (budgetCount - exceededBudgetCount) / budgetCount;
    score += Math.round(adherenceRate * 30);
  } else {
    // No budgets set — give partial credit
    score += 15;
  }

  // Income recorded (15 pts)
  if (totalIncome > 0) score += 15;

  // Transaction activity (15 pts)
  if (transactionCount >= 5)  score += 15;
  else if (transactionCount >= 2) score += 8;
  else if (transactionCount >= 1) score += 4;

  const clampedScore = Math.min(100, Math.max(0, score));

  const label =
    clampedScore >= 80 ? 'Excellent' :
    clampedScore >= 60 ? 'Good' :
    clampedScore >= 40 ? 'Fair' :
    'Needs Work';

  return { score: clampedScore, label };
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const { user } = useUserStore();
  const { transactions } = useTransactionStore();

  const {
    insights,
    isLoading,
    error,
    activePeriod,
    setActivePeriod,
    refresh,
  } = useInsights();

  // ── Derive summary stats for the current period ────────

  /**
   * Filter transactions to those in the current month.
   * Used for the summary card at the bottom — always shows
   * the monthly summary regardless of which period tab is
   * active, since monthly is the most meaningful at a glance.
   */
  const { budgets } = useBudgetStore();

  // ── Derive summary stats for the current month ──────────
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const monthTransactions = transactions.filter((t) => {
    const d = t.date.split('T')[0];
    return d >= monthStart && d <= monthEnd;
  });

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalSpent;

  // ── Budget adherence for the score ──────────────────────
  /**
   * Build a map of how much was spent per category this month.
   * Then check each budget to see if it was exceeded.
   * This mirrors exactly what analyseBudgetAdherence does in
   * the engine so the score is consistent with the insight cards.
   */
  const monthlySpendPerCategory = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<number, number>>((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] ?? 0) + t.amount;
      return acc;
    }, {});

  const budgetCount = budgets.length;

  const exceededBudgetCount = budgets.filter(
    (b) => (monthlySpendPerCategory[b.categoryId] ?? 0) > b.amount
  ).length;

  const { score, label: scoreLabel } = deriveFinancialScore(
    totalIncome,
    totalSpent,
    budgetCount,
    exceededBudgetCount,
    monthTransactions.length
  );

  const sym = (() => {
    const map: Record<string, string> = {
      NGN: '₦', USD: '$', GBP: '£', EUR: '€',
      GHS: '₵', KES: 'KSh ', ZAR: 'R',
    };
    return map[user?.currency ?? 'NGN'] ?? '₦';
  })();

  // ── Render ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="ZeeFi AI"
        subtitle="Financial Insights"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        /**
         * Pull-to-refresh forces a regeneration regardless
         * of whether the staleness threshold has elapsed.
         */
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── Page title ────────────────────────── */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Financial Insights</Text>
          <Text style={styles.pageSubtitle}>
            AI-powered analysis of your growth.
          </Text>
        </View>

        {/* ── Financial score card ─────────────── */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCardTop}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreLabel}>YOUR FINANCIAL SCORE</Text>
              <View style={styles.scoreNumberRow}>
                <Text style={styles.scoreNumber}>{score}</Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreBadgeText}>{scoreLabel}</Text>
              </View>
            </View>

            {/* Circular score indicator */}
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor:
                    score >= 80 ? COLORS.primaryLight :
                    score >= 60 ? COLORS.warning :
                    COLORS.danger,
                },
              ]}
            >
              <Text style={styles.scoreCircleNumber}>{score}</Text>
              <Text style={styles.scoreCircleLabel}>Score</Text>
            </View>
          </View>

          <ProgressBar
            percent={score}
            height={10}
            overrideColor={
              score >= 80 ? COLORS.primaryLight :
              score >= 60 ? COLORS.warning :
              COLORS.danger
            }
          />

          <View style={styles.scoreBarLabels}>
            <Text style={styles.scoreBarMin}>0</Text>
            <Text style={styles.scoreBarMax}>100</Text>
          </View>

          <Text style={styles.scoreDescription}>
            {score >= 80
              ? 'Excellent financial health. Keep up the great work.'
              : score >= 60
              ? 'Good progress. Small adjustments could improve your score.'
              : score >= 40
              ? 'There is room for improvement. Review your budgets and spending.'
              : 'Your finances need attention. Start by recording all transactions and setting budgets.'}
          </Text>
        </View>

        {/* ── Period selector ───────────────────── */}
        <View style={styles.periodTabsCard}>
          <Text style={styles.periodTabsLabel}>Analysis Period</Text>
          <View style={styles.periodTabs}>
            {PERIOD_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.periodTab,
                  activePeriod === tab.id && styles.periodTabActive,
                ]}
                onPress={() => setActivePeriod(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    activePeriod === tab.id && styles.periodTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Insight cards ─────────────────────── */}
        <SectionHeader title={`${PERIOD_TABS.find(t => t.id === activePeriod)?.label} Insights`} />

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Analysing your financial data...
            </Text>
          </View>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <View style={styles.errorState}>
            <Ionicons
              name="warning-outline"
              size={36}
              color={COLORS.warning}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refresh}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state — no transactions in this period */}
        {!isLoading && !error && insights.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="analytics-outline"
              size={48}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptySubtitle}>
              Add some transactions for this period and insights
              will appear automatically.
            </Text>
            <TouchableOpacity
              style={styles.addTransactionButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={16}
                color={COLORS.textOnPrimary}
              />
              <Text style={styles.addTransactionButtonText}>
                Add Transaction
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Insight cards list */}
        {!isLoading && !error && insights.length > 0 && (
          <View style={styles.insightsList}>
            {insights.map((insight) => (
              <InsightCard
                key={insight.key}
                insight={{
                  id: insight.key,
                  title: insight.title,
                  description: insight.message,
                  severity: insight.severity,
                  ctaLabel: insight.ctaLabel ?? null,
                  ctaRoute: insight.ctaRoute ?? null,
                }}
                onCtaPress={() => {
                  if (insight.ctaRoute) {
                    router.push(insight.ctaRoute as any);
                  }
                }}
              />
            ))}
          </View>
        )}

        {/* ── Monthly summary card ─────────────── */}
        {monthTransactions.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {now.toLocaleDateString('en', { month: 'long' })} Summary
            </Text>

            <View style={styles.summaryTopRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>TOTAL INCOME</Text>
                <Text style={styles.summaryItemValue}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>TOTAL SPENT</Text>
                <Text style={styles.summaryItemValue}>
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBottomRow}>
              <View style={styles.summaryBottomItem}>
                <Text style={styles.summaryItemLabel}>NET SAVINGS</Text>
                <Text
                  style={[
                    styles.summaryBottomValue,
                    { color: netSavings >= 0 ? COLORS.income : COLORS.expense },
                  ]}
                >
                  {formatCurrency(Math.abs(netSavings))}
                </Text>
                <Text style={styles.savingsSubtext}>
                  {netSavings >= 0
                    ? `${totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0}% saved`
                    : 'deficit'}
                </Text>
              </View>

              <View style={styles.summaryBottomItem}>
                <Text style={styles.summaryItemLabel}>TRANSACTIONS</Text>
                <Text
                  style={[styles.summaryBottomValue, { color: COLORS.primary }]}
                >
                  {monthTransactions.length}
                </Text>
                <Text style={styles.savingsSubtext}>this month</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FloatingActionButton onPress={() => setModalVisible(true)} />

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: { flex: 1 },

  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  // ── Page title ────────────────────────────────────────
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

  // ── Score card ────────────────────────────────────────
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.md,
  },

  scoreCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  scoreLeft: { gap: SPACING.sm },

  scoreLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  scoreNumber: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  scoreOutOf: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textMuted,
  },

  scoreBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },

  scoreBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
  },

  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  scoreCircleNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },

  scoreCircleLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryLight,
  },

  scoreBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -SPACING.xs,
  },

  scoreBarMin: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  scoreBarMax: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  scoreDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  // ── Period tabs ───────────────────────────────────────
  periodTabsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },

  periodTabsLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
  },

  periodTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },

  periodTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },

  periodTabActive: {
    backgroundColor: COLORS.primary,
  },

  periodTabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },

  periodTabTextActive: {
    color: COLORS.textOnPrimary,
    fontWeight: FONT_WEIGHT.semiBold,
  },

  // ── Insights list ─────────────────────────────────────
  insightsList: {
    gap: SPACING.sm,
  },

  // ── Loading state ─────────────────────────────────────
  loadingState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.lg,
  },

  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ── Error state ───────────────────────────────────────
  errorState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.md,
  },

  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  retryButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  retryButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
  },

  // ── Empty state ───────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.md,
  },

  emptyTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: FONT_SIZE.sm * 1.6,
    paddingHorizontal: SPACING.xl,
  },

  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },

  addTransactionButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },

  // ── Monthly summary ───────────────────────────────────
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.lg,
    ...SHADOWS.sm,
  },

  summaryTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  summaryTopRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },

  summaryItem: {
    flex: 1,
    gap: SPACING.xs,
  },

  summaryItemLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  summaryItemValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  summaryBottomRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },

  summaryBottomItem: {
    flex: 1,
    gap: SPACING.xs,
  },

  summaryBottomValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },

  savingsSubtext: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },

  bottomPadding: { height: 80 },
});