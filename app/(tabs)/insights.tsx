import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import SectionHeader from '@/components/common/SectionHeader';
import InsightCard from '@/components/insights/InsightCard';
import { InsightPeriodType } from '@/database/services/insightEngine';
import { Transaction } from '@/database/services/transaction';
import { useInsights } from '@/hooks/useInsights';
import AddTransactionModal from '@/modals/AddTransactionModal';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useUserStore } from '@/store/userStore';

import ScreenHeader from '@/components/common/ScreenHeader';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { formatCurrency } from '@/utils/formatters';

const SCREEN_WIDTH = Dimensions.get('window').width;
/**
 * The usable chart width accounts for the screen padding
 * on both sides plus the card's internal padding.
 */
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2 - SPACING.xl * 2 - 2;

// ─────────────────────────────────────────────────────────
// Period tab config
// ─────────────────────────────────────────────────────────

const PERIOD_TABS: { id: InsightPeriodType; label: string }[] = [
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly',  label: 'Yearly'  },
];

// ─────────────────────────────────────────────────────────
// Date range helpers (same as in useInsights.ts)
// ─────────────────────────────────────────────────────────

function getCurrentPeriodBounds(
  periodType: InsightPeriodType
): { start: string; end: string } {
  const now = new Date();

  switch (periodType) {
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
      };
    }
    case 'monthly': {
      const year = now.getFullYear();
      const month = now.getMonth();
      return {
        start: new Date(year, month, 1).toISOString().split('T')[0],
        end: new Date(year, month + 1, 0).toISOString().split('T')[0],
      };
    }
    case 'yearly':
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      };
  }
}

function filterByDateRange(
  transactions: Transaction[],
  start: string,
  end: string
): Transaction[] {
  return transactions.filter((t) => {
    const d = t.date.split('T')[0];
    return d >= start && d <= end;
  });
}

// ─────────────────────────────────────────────────────────
// Financial score derivation
// ─────────────────────────────────────────────────────────

function deriveFinancialScore(
  totalIncome: number,
  totalExpense: number,
  budgetCount: number,
  exceededBudgetCount: number,
  transactionCount: number
): { score: number; label: string } {
  let score = 0;

  if (totalIncome > 0) {
    const savingsRate = Math.max(
      0,
      (totalIncome - totalExpense) / totalIncome
    );
    score += Math.round(savingsRate * 40);
  }

  if (budgetCount > 0) {
    score += Math.round(
      ((budgetCount - exceededBudgetCount) / budgetCount) * 30
    );
  } else {
    score += 15;
  }

  if (totalIncome > 0) score += 15;

  if (transactionCount >= 5) score += 15;
  else if (transactionCount >= 2) score += 8;
  else if (transactionCount >= 1) score += 4;

  const clamped = Math.min(100, Math.max(0, score));
  const label =
    clamped >= 80 ? 'Excellent' :
    clamped >= 60 ? 'Good' :
    clamped >= 40 ? 'Fair' : 'Needs Work';

  return { score: clamped, label };
}

// ─────────────────────────────────────────────────────────
// Chart data builders
// ─────────────────────────────────────────────────────────

/**
 * CHART 1 — Income vs Expenses grouped bar chart.
 *
 * Weekly:  one bar pair per day (Mon–Sun)
 * Monthly: one bar pair per week (W1–W5)
 * Yearly:  one bar pair per month (Jan–Dec)
 *
 * Each pair is [income bar, expense bar] rendered as a
 * BarChart with stackData so they sit side by side.
 * We use the simple flat data approach with frontColor
 * differentiation since gifted-charts' grouped bar
 * just requires alternating items with spacing.
 */
function buildIncomeExpenseBars(
  transactions: Transaction[],
  periodType: InsightPeriodType,
  start: string
): { label: string; income: number; expense: number }[] {
  const buckets: { label: string; income: number; expense: number }[] = [];

  if (periodType === 'weekly') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((label, i) => {
      const d = new Date(start + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayTx = transactions.filter(
        (t) => t.date.split('T')[0] === key
      );
      buckets.push({
        label,
        income: dayTx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0),
        expense: dayTx
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0),
      });
    });
  } else if (periodType === 'monthly') {
    // Group into weekly buckets (W1 = days 1-7, W2 = 8-14, etc.)
    for (let w = 0; w < 5; w++) {
      const weekStart = w * 7 + 1;
      const weekEnd = Math.min((w + 1) * 7, 31);
      const year = parseInt(start.split('-')[0]);
      const month = parseInt(start.split('-')[1]) - 1;
      const lastDay = new Date(year, month + 1, 0).getDate();
      if (weekStart > lastDay) break;

      const weekTx = transactions.filter((t) => {
        const day = parseInt(t.date.split('T')[0].split('-')[2]);
        return day >= weekStart && day <= Math.min(weekEnd, lastDay);
      });

      buckets.push({
        label: `W${w + 1}`,
        income: weekTx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0),
        expense: weekTx
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0),
      });
    }
  } else {
    // Yearly — one pair per month
    const monthLabels = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec',
    ];
    const year = parseInt(start.split('-')[0]);
    monthLabels.forEach((label, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const monthTx = transactions.filter((t) =>
        t.date.startsWith(`${year}-${monthStr}`)
      );
      buckets.push({
        label,
        income: monthTx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0),
        expense: monthTx
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0),
      });
    });
  }

  return buckets;
}

/**
 * CHART 2 — Daily spending area chart.
 *
 * Shows total expense per day across the period.
 * Weekly: 7 points. Monthly: one per day. Yearly: one per month.
 * For yearly we use the monthly total to avoid too many points.
 */
function buildDailySpendLine(
  transactions: Transaction[],
  periodType: InsightPeriodType,
  start: string,
  end: string
): { value: number; label?: string; dataPointText?: string }[] {
  const expenseTx = transactions.filter((t) => t.type === 'expense');

  if (periodType === 'yearly') {
    // Monthly points for yearly view
    const year = parseInt(start.split('-')[0]);
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const total = expenseTx
        .filter((t) => t.date.startsWith(`${year}-${monthStr}`))
        .reduce((s, t) => s + t.amount, 0);
      const monthLabels = [
        'J','F','M','A','M','J','J','A','S','O','N','D',
      ];
      return { value: total, label: monthLabels[i] };
    });
  }

  // Build a day-by-day map
  const dayMap = new Map<string, number>();
  for (const t of expenseTx) {
    const day = t.date.split('T')[0];
    dayMap.set(day, (dayMap.get(day) ?? 0) + t.amount);
  }

  const points: { value: number; label?: string }[] = [];
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {
    const key = d.toISOString().split('T')[0];
    const dayNum = d.getDate();

    /**
     * For monthly view with 28-31 points, only label
     * every 5th day to avoid crowding the x-axis.
     */
    const showLabel =
      periodType === 'weekly' ||
      dayNum === 1 ||
      dayNum % 5 === 0;

    points.push({
      value: dayMap.get(key) ?? 0,
      label: showLabel
        ? periodType === 'weekly'
          ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][points.length]
          : String(dayNum)
        : '',
    });
  }

  return points;
}

/**
 * CHART 3 — Spending by category donut chart.
 *
 * Aggregates expenses per category.
 * Returns data formatted for gifted-charts PieChart.
 * Also returns a legend array for rendering below the chart.
 */

const DONUT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#F1948A', '#82E0AA', '#85C1E9',
];

function buildCategoryDonut(
  transactions: Transaction[],
  categories: { id: number; name: string; type: string }[]
): {
  pieData: { value: number; color: string; text?: string }[];
  legend: { name: string; color: string; amount: number; pct: number }[];
} {
  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const total = expenseTx.reduce((s, t) => s + t.amount, 0);

  if (total === 0) return { pieData: [], legend: [] };

  // Aggregate by category
  const catMap = new Map<number, number>();
  for (const t of expenseTx) {
    catMap.set(t.categoryId, (catMap.get(t.categoryId) ?? 0) + t.amount);
  }

  // Sort descending and take top 8 to keep donut readable
  const sorted = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const pieData = sorted.map(([, amount], i) => ({
    value: amount,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const legend = sorted.map(([catId, amount], i) => {
    const cat = categories.find((c) => c.id === catId);
    return {
      name: cat?.name ?? 'Unknown',
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      amount,
      pct: Math.round((amount / total) * 100),
    };
  });

  return { pieData, legend };
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const { user } = useUserStore();
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { budgets } = useBudgetStore();

  const {
    insights,
    isLoading,
    error,
    activePeriod,
    setActivePeriod,
    refresh,
  } = useInsights();

  // ── Period-scoped transaction slice ───────────────────

  /**
   * All charts and the summary card use this slice.
   * It follows the active period tab so switching from
   * Monthly to Weekly instantly updates all three charts.
   */
  const periodBounds = useMemo(
    () => getCurrentPeriodBounds(activePeriod),
    [activePeriod]
  );

  const periodTransactions = useMemo(
    () =>
      filterByDateRange(
        transactions,
        periodBounds.start,
        periodBounds.end
      ),
    [transactions, periodBounds]
  );

  const totalIncome = useMemo(
    () =>
      periodTransactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
    [periodTransactions]
  );

  const totalSpent = useMemo(
    () =>
      periodTransactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
    [periodTransactions]
  );

  const netSavings = totalIncome - totalSpent;

  // ── Budget adherence for score ─────────────────────────

  const monthlySpendPerCategory = useMemo(() => {
    const map: Record<number, number> = {};
    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
      });
    return map;
  }, [periodTransactions]);

  const exceededBudgetCount = useMemo(
    () =>
      budgets.filter(
        (b) => (monthlySpendPerCategory[b.categoryId] ?? 0) > b.amount
      ).length,
    [budgets, monthlySpendPerCategory]
  );

  const { score, label: scoreLabel } = useMemo(
    () =>
      deriveFinancialScore(
        totalIncome,
        totalSpent,
        budgets.length,
        exceededBudgetCount,
        periodTransactions.length
      ),
    [totalIncome, totalSpent, budgets.length, exceededBudgetCount, periodTransactions.length]
  );

  // ── Chart data ─────────────────────────────────────────

  const incomeExpenseBuckets = useMemo(
    () =>
      buildIncomeExpenseBars(
        periodTransactions,
        activePeriod,
        periodBounds.start
      ),
    [periodTransactions, activePeriod, periodBounds.start]
  );

  const dailySpendPoints = useMemo(
    () =>
      buildDailySpendLine(
        periodTransactions,
        activePeriod,
        periodBounds.start,
        periodBounds.end
      ),
    [periodTransactions, activePeriod, periodBounds]
  );

  const { pieData, legend } = useMemo(
    () => buildCategoryDonut(periodTransactions, categories),
    [periodTransactions, categories]
  );

  // ── Flattened bar data for gifted-charts ───────────────
  /**
   * gifted-charts BarChart expects a flat array where grouped
   * bars are indicated by spacing. We alternate income/expense
   * bars within each bucket and add extra spacing between groups.
   */
  const barData = useMemo(() => {
    const data: {
      value: number;
      frontColor: string;
      label?: string;
      spacing?: number;
      labelWidth?: number;
      labelTextStyle?: object;
    }[] = [];

    incomeExpenseBuckets.forEach((bucket, i) => {
      data.push({
        value: Math.round(bucket.income),
        frontColor: COLORS.primary,
        label: bucket.label,
        labelWidth: 28,
        labelTextStyle: {
          color: COLORS.textMuted,
          fontSize: 9,
          textAlign: 'center',
        },
        spacing: 2,
      });
      data.push({
        value: Math.round(bucket.expense),
        frontColor: COLORS.expense,
        spacing: i < incomeExpenseBuckets.length - 1 ? 12 : 0,
      });
    });

    return data;
  }, [incomeExpenseBuckets]);

  // ── Max values for chart scaling ───────────────────────

  const barMaxValue = useMemo(() => {
    const max = Math.max(
      ...incomeExpenseBuckets.map((b) => Math.max(b.income, b.expense))
    );
    // Round up to a nice number so the grid lines are clean
    if (max === 0) return 1000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [incomeExpenseBuckets]);

  const lineMaxValue = useMemo(() => {
    const max = Math.max(...dailySpendPoints.map((p) => p.value));
    if (max === 0) return 1000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [dailySpendPoints]);

  // ── Currency symbol ────────────────────────────────────

  const sym = useMemo(() => {
    const map: Record<string, string> = {
      NGN: '₦', USD: '$', GBP: '£', EUR: '€',
      GHS: '₵', KES: 'KSh ', ZAR: 'R',
    };
    return map[user?.currency ?? 'NGN'] ?? '₦';
  }, [user?.currency]);

  const hasData = periodTransactions.length > 0;

  // ── Render ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <ScreenHeader
        title="ZeeFi AI"
        subtitle="Financial Insights"
      />
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
              ? 'Room for improvement. Review your budgets and spending.'
              : 'Your finances need attention. Start by logging all transactions and setting budgets.'}
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

        {/* ════════════════════════════════════════
            CHART 1 — Income vs Expenses Bar Chart
            ════════════════════════════════════════ */}
        <View style={styles.chartCard}>
          <SectionHeader title="Income vs Expenses" />

          {/* Legend */}
          <View style={styles.chartLegendRow}>
            <View style={styles.chartLegendItem}>
              <View
                style={[
                  styles.chartLegendDot,
                  { backgroundColor: COLORS.primary },
                ]}
              />
              <Text style={styles.chartLegendText}>Income</Text>
            </View>
            <View style={styles.chartLegendItem}>
              <View
                style={[
                  styles.chartLegendDot,
                  { backgroundColor: COLORS.expense },
                ]}
              />
              <Text style={styles.chartLegendText}>Expenses</Text>
            </View>
          </View>

          {!hasData ? (
            <ChartEmptyState message="No transactions this period." />
          ) : (
            <View style={styles.chartWrapper}>
              <BarChart
                data={barData}
                width={CHART_WIDTH}
                height={180}
                barWidth={activePeriod === 'yearly' ? 7 : 14}
                noOfSections={4}
                maxValue={barMaxValue}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                hideRules={false}
                rulesColor={COLORS.border}
                rulesType="solid"
                yAxisColor="transparent"
                xAxisColor={COLORS.border}
                /**
                 * formatYLabel formats the y-axis numbers into
                 * compact notation so ₦200000 becomes 200K.
                 */
                formatYLabel={(val) => {
                  const n = parseFloat(val);
                  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
                  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(0)}K`;
                  return `${sym}${n}`;
                }}
                isAnimated
                animationDuration={600}
              />
            </View>
          )}

          {/* Period totals summary below the chart */}
          {hasData && (
            <View style={styles.chartSummaryRow}>
              <View style={styles.chartSummaryItem}>
                <Text style={styles.chartSummaryLabel}>Total Income</Text>
                <Text
                  style={[
                    styles.chartSummaryValue,
                    { color: COLORS.income },
                  ]}
                >
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={styles.chartSummaryDivider} />
              <View style={styles.chartSummaryItem}>
                <Text style={styles.chartSummaryLabel}>Total Spent</Text>
                <Text
                  style={[
                    styles.chartSummaryValue,
                    { color: COLORS.expense },
                  ]}
                >
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
              <View style={styles.chartSummaryDivider} />
              <View style={styles.chartSummaryItem}>
                <Text style={styles.chartSummaryLabel}>Net</Text>
                <Text
                  style={[
                    styles.chartSummaryValue,
                    {
                      color:
                        netSavings >= 0 ? COLORS.income : COLORS.expense,
                    },
                  ]}
                >
                  {netSavings >= 0 ? '+' : ''}
                  {formatCurrency(netSavings)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════
            CHART 2 — Daily Spending Area Chart
            ════════════════════════════════════════ */}
        <View style={styles.chartCard}>
          <SectionHeader
            title="Spending Trend"
            actionLabel={
              totalSpent > 0
                ? `Avg ${formatCurrency(
                    totalSpent /
                      Math.max(
                        1,
                        dailySpendPoints.filter((p) => p.value > 0).length
                      )
                  )}/day`
                : undefined
            }
          />

          {!hasData || dailySpendPoints.every((p) => p.value === 0) ? (
            <ChartEmptyState message="No expense data this period." />
          ) : (
            <View style={styles.chartWrapper}>
              <LineChart
                data={dailySpendPoints}
                width={CHART_WIDTH}
                height={160}
                /**
                 * areaChart fills the area under the line with
                 * a gradient from the line colour to transparent.
                 * Much easier to read than a bare line.
                 */
                areaChart
                color={COLORS.primary}
                startFillColor={COLORS.primary}
                endFillColor="transparent"
                startOpacity={0.3}
                endOpacity={0.02}
                thickness={2}
                noOfSections={4}
                maxValue={lineMaxValue}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                hideRules={false}
                rulesColor={COLORS.border}
                rulesType="solid"
                yAxisColor="transparent"
                xAxisColor={COLORS.border}
                formatYLabel={(val) => {
                  const n = parseFloat(val);
                  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
                  return String(n);
                }}
                /**
                 * hideDataPoints keeps the line clean when there
                 * are many points (e.g. 30 days in a monthly view).
                 * For weekly (7 points) we show them.
                 */
                hideDataPoints={activePeriod !== 'weekly'}
                dataPointsColor={COLORS.primary}
                dataPointsRadius={4}
                isAnimated
                animationDuration={600}
                curved
              />
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════
            CHART 3 — Spending by Category Donut
            ════════════════════════════════════════ */}
        <View style={styles.chartCard}>
          <SectionHeader title="Spending by Category" />

          {!hasData || pieData.length === 0 ? (
            <ChartEmptyState message="No expense categories this period." />
          ) : (
            <View style={styles.donutSection}>
              {/* Donut chart centred */}
              <View style={styles.donutWrapper}>
                <PieChart
                  data={pieData}
                  donut
                  radius={80}
                  innerRadius={52}
                  /**
                   * The center label shows total expenses
                   * so the donut has a useful focal point.
                   */
                  centerLabelComponent={() => (
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutCenterLabel}>Total</Text>
                      <Text style={styles.donutCenterValue}>
                        {totalSpent >= 1_000_000
                          ? `${sym}${(totalSpent / 1_000_000).toFixed(1)}M`
                          : totalSpent >= 1_000
                          ? `${sym}${(totalSpent / 1_000).toFixed(0)}K`
                          : `${sym}${Math.round(totalSpent)}`}
                      </Text>
                    </View>
                  )}
                  isAnimated
                  animationDuration={700}
                  strokeColor={COLORS.surface}
                  strokeWidth={2}
                />
              </View>

              {/* Legend below the donut */}
              <View style={styles.donutLegend}>
                {legend.map((item) => (
                  <View key={item.name} style={styles.donutLegendRow}>
                    <View
                      style={[
                        styles.donutLegendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text
                      style={styles.donutLegendName}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.donutLegendPct}>
                      {item.pct}%
                    </Text>
                    <Text style={styles.donutLegendAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════
            AI Insight cards
            ════════════════════════════════════════ */}
        <SectionHeader
          title={`${PERIOD_TABS.find((t) => t.id === activePeriod)?.label} Insights`}
          actionLabel="Refresh"
          onActionPress={refresh}
        />

        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Analysing your financial data...
            </Text>
          </View>
        )}

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
          </View>
        )}

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
        {hasData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Period Summary
            </Text>

            <View style={styles.summaryTopRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>INCOME</Text>
                <Text style={styles.summaryItemValue}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>SPENT</Text>
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
                    {
                      color:
                        netSavings >= 0 ? COLORS.income : COLORS.expense,
                    },
                  ]}
                >
                  {formatCurrency(Math.abs(netSavings))}
                </Text>
                <Text style={styles.savingsSubtext}>
                  {netSavings >= 0
                    ? `${
                        totalIncome > 0
                          ? Math.round((netSavings / totalIncome) * 100)
                          : 0
                      }% saved`
                    : 'deficit'}
                </Text>
              </View>

              <View style={styles.summaryBottomItem}>
                <Text style={styles.summaryItemLabel}>TRANSACTIONS</Text>
                <Text
                  style={[
                    styles.summaryBottomValue,
                    { color: COLORS.primary },
                  ]}
                >
                  {periodTransactions.length}
                </Text>
                <Text style={styles.savingsSubtext}>this period</Text>
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
// ChartEmptyState — shown inside a chart card when there
// is no data to display for the current period.
// ─────────────────────────────────────────────────────────

function ChartEmptyState({ message }: { message: string }) {
  return (
    <View style={styles.chartEmptyState}>
      <Ionicons
        name="bar-chart-outline"
        size={32}
        color={COLORS.textMuted}
      />
      <Text style={styles.chartEmptyText}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.lg },

  // ── Page title ────────────────────────────────────────
  pageTitleSection: { gap: SPACING.xs },
  pageTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  pageSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },

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
  scoreCircleLabel: { fontSize: FONT_SIZE.xs, color: COLORS.primaryLight },
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
  periodTabActive: { backgroundColor: COLORS.primary },
  periodTabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  periodTabTextActive: {
    color: COLORS.textOnPrimary,
    fontWeight: FONT_WEIGHT.semiBold,
  },

  // ── Chart cards ───────────────────────────────────────
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },

  /**
   * Negative horizontal margin compensates for the card padding
   * so the chart can render edge-to-edge within the card while
   * the title and legend still have normal padding.
   * Without this the chart clips on the right side.
   */
  chartWrapper: {
    marginHorizontal: -SPACING.sm,
    overflow: 'hidden',
  },

  axisText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },

  // Chart legend (bar chart)
  chartLegendRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },

  // Totals below the bar chart
  chartSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chartSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  chartSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  chartSummaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  chartSummaryValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Donut chart ───────────────────────────────────────
  donutSection: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  donutCenterValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  donutLegend: {
    width: '100%',
    gap: SPACING.sm,
  },
  donutLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  donutLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  donutLegendName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  donutLegendPct: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
    width: 36,
    textAlign: 'right',
  },
  donutLegendAmount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    width: 80,
    textAlign: 'right',
  },

  // ── Chart empty state ─────────────────────────────────
  chartEmptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    gap: SPACING.sm,
  },
  chartEmptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },

  // ── Insight cards ─────────────────────────────────────
  insightsList: { gap: SPACING.sm },

  loadingState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },

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

  // ── Summary card ──────────────────────────────────────
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
  summaryTopRow: { flexDirection: 'row', gap: SPACING.xl },
  summaryItem: { flex: 1, gap: SPACING.xs },
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
  summaryDivider: { height: 1, backgroundColor: COLORS.border },
  summaryBottomRow: { flexDirection: 'row', gap: SPACING.xl },
  summaryBottomItem: { flex: 1, gap: SPACING.xs },
  summaryBottomValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  savingsSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },

  bottomPadding: { height: 80 },
});