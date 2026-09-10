/**
 * Financial Insights Screen
 *
 * A full stack screen pushed from the Dashboard showing
 * AI-powered analysis of the user's financial behavior.
 *
 * This screen is intentionally NOT a tab. It is accessed
 * by tapping a dedicated button or link on the Dashboard,
 * which means it gets a native back button at the top
 * automatically from the root Stack navigator.
 *
 * Sections (top to bottom):
 *  1. Financial Score Card — score out of 100 with bar
 *  2. AI Insight Cards — scrollable list of insights
 *  3. Income vs Expenses Bar Chart (placeholder)
 *  4. Daily Spending Trend Line Chart (placeholder)
 *  5. Top Spending Categories Donut Chart (placeholder)
 *  6. Personalized For You — Smart Savings and Debt cards
 *  7. August Summary — income, spent, savings, budget goal
 *  8. Full Monthly Report CTA button
 *
 * The native header from the root Stack navigator shows
 * "Financial Insights" as the title with a back arrow.
 * We therefore do NOT render a ScreenHeader here to avoid
 * a double header.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import SectionHeader from '@/components/common/SectionHeader';
import ChartPlaceholder from '@/components/insights/ChartPlaceholder';
import InsightCard from '@/components/insights/InsightCard';
import AddTransactionModal from '@/modals/AddTransactionModal';

import {
    mockBarChartData,
    mockDonutData,
    mockInsights,
    mockMonthlySummary
} from '@/data/mockInsights';

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { formatCurrency } from '@/utils/formatters';

export default function InsightsScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Title ──────────────────────────── */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Financial Insights</Text>
          <Text style={styles.pageSubtitle}>
            AI-powered analysis of your growth.
          </Text>
        </View>

        {/* ── Financial Score Card ─────────────────── */}
        {/*
         * The score card shows a health score out of 100
         * derived from savings rate, budget adherence,
         * and spending patterns.
         *
         * TODO: Calculate real score from user data in
         * the insight engine phase.
         */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCardTop}>
            {/* Left: score number and label */}
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreLabel}>
                YOUR FINANCIAL SCORE
              </Text>
              <View style={styles.scoreNumberRow}>
                <Text style={styles.scoreNumber}>
                  {mockMonthlySummary.financialScore}
                </Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreBadgeText}>
                  {mockMonthlySummary.scoreLabel}
                </Text>
              </View>
            </View>

            {/* Right: circular score indicator */}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreCircleNumber}>
                {mockMonthlySummary.financialScore}
              </Text>
              <Text style={styles.scoreCircleLabel}>Score</Text>
            </View>
          </View>

          {/* Score progress bar */}
          <View style={styles.scoreBarSection}>
            <ProgressBar
              percent={mockMonthlySummary.financialScore}
              height={10}
              overrideColor={COLORS.primaryLight}
            />
            <View style={styles.scoreBarLabels}>
              <Text style={styles.scoreBarMin}>0</Text>
              <Text style={styles.scoreBarMax}>100</Text>
            </View>
          </View>

          {/* Score description */}
          <Text style={styles.scoreDescription}>
            Your savings rate is in the top 21% of users with
            similar income. Keep going!
          </Text>
        </View>

        {/* ── AI Insight Cards ─────────────────────── */}
        <SectionHeader title="AI Insights" />

        {mockInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onCtaPress={() => {
              // TODO: Navigate to relevant screen based on
              // insight.ctaRoute when defined
              console.log('CTA tapped:', insight.ctaLabel);
            }}
          />
        ))}

        {/* ── Income vs Expenses Bar Chart ─────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
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
          </View>

          <ChartPlaceholder
            type="bar"
            height={180}
            barData={mockBarChartData}
          />
        </View>

        {/* ── Daily Spending Trend ─────────────────── */}
        <View style={styles.chartCard}>
          <SectionHeader
            title="Daily Spending Trend"
            actionLabel={`Avg: ₦${(
              mockMonthlySummary.totalSpent / 30
            ).toFixed(0)}/day`}
          />
          <ChartPlaceholder
            type="line"
            height={160}
          />
        </View>

        {/* ── Top Spending Categories ──────────────── */}
        <View style={styles.chartCard}>
          <SectionHeader title="Top Spending Categories" />
          <ChartPlaceholder
            type="donut"
            donutData={mockDonutData}
          />
        </View>

        {/* ── Personalized For You ─────────────────── */}
        <View>
          <SectionHeader
            title="Personalized For You"
            actionLabel="Explore All"
            onActionPress={() => {
              // TODO: Navigate to full recommendations screen
            }}
          />

          {/*
           * Two horizontal recommendation cards side by side.
           * These match the "Smart Savings Plan" and
           * "Debt Snowball" cards shown in the PDF.
           */}
          <View style={styles.recommendationRow}>
            <PersonalizedCard
              title="Smart Savings Plan"
              description="Automate your savings and earn more monthly basis."
              ctaLabel="Set Up Auto-Save"
              accentColor={COLORS.primary}
            />
            <PersonalizedCard
              title="Debt Snowball"
              description="Strategy to pay off debt on a monthly basis."
              ctaLabel="View Debt"
              accentColor={COLORS.warning}
            />
          </View>
        </View>

        {/* ── August Summary ───────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {mockMonthlySummary.month} Summary
          </Text>

          {/* Income and Spent row */}
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>TOTAL INCOME</Text>
              <Text style={styles.summaryItemValue}>
                {formatCurrency(mockMonthlySummary.totalIncome)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>TOTAL SPENT</Text>
              <Text style={styles.summaryItemValue}>
                {formatCurrency(mockMonthlySummary.totalSpent)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider} />

          {/* Savings and Budget Goal row */}
          <View style={styles.summaryBottomRow}>
            <View style={styles.summaryBottomItem}>
              <Text style={styles.summaryItemLabel}>NET SAVINGS</Text>
              <Text
                style={[
                  styles.summaryBottomValue,
                  { color: COLORS.income },
                ]}
              >
                {formatCurrency(mockMonthlySummary.netSavings)}
              </Text>
              <Text style={styles.savingsPercent}>
                {Math.round(
                  (mockMonthlySummary.netSavings /
                    mockMonthlySummary.totalIncome) *
                    100
                )}
                % saved
              </Text>
            </View>

            <View style={styles.summaryBottomItem}>
              <Text style={styles.summaryItemLabel}>BUDGET GOAL</Text>
              <Text
                style={[
                  styles.summaryBottomValue,
                  { color: COLORS.primary },
                ]}
              >
                On Track
              </Text>
              <Text style={styles.goalPercent}>
                ↑ {mockMonthlySummary.budgetGoalPercent}% achieved
              </Text>
            </View>
          </View>

          {/* Motivational illustration area */}
          <View style={styles.motivationSection}>
            <View style={styles.motivationIllustration}>
              {/*
               * APPROX: The PDF shows a small character illustration
               * here. We use an emoji as a lightweight placeholder.
               * TODO: Replace with a real illustration asset.
               */}
              <Text style={styles.motivationEmoji}>🌱</Text>
            </View>
            <Text style={styles.motivationTitle}>
              You're growing!
            </Text>
            <Text style={styles.motivationText}>
              Your net worth has grown by 8.4% this month. This is
              your best month this year!
            </Text>
          </View>

          {/* Full Monthly Report CTA */}
          <TouchableOpacity
            style={styles.reportButton}
            activeOpacity={0.85}
            onPress={() => {
              // TODO: Generate and show full monthly report
              console.log('TODO: Generate monthly report');
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={COLORS.textOnPrimary}
            />
            <Text style={styles.reportButtonText}>
              Full Monthly Report
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ── Floating Action Button ───────────────── */}
      <FloatingActionButton onPress={() => setModalVisible(true)} />

      {/* ── Add Transaction Modal ────────────────── */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-component: PersonalizedCard
// ─────────────────────────────────────────────────────────

/**
 * PersonalizedCard
 *
 * A small recommendation card shown in the "Personalized
 * For You" section. Two of these sit side by side in a row.
 *
 * Defined in this file rather than a separate component
 * file because it is only used here and is small enough
 * to keep local without adding unnecessary complexity.
 */
interface PersonalizedCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  accentColor: string;
}

function PersonalizedCard({
  title,
  description,
  ctaLabel,
  accentColor,
}: PersonalizedCardProps) {
  return (
    <View style={personalizedStyles.card}>
      {/* Colored accent top strip */}
      <View
        style={[
          personalizedStyles.accentStrip,
          { backgroundColor: accentColor },
        ]}
      />

      <View style={personalizedStyles.content}>
        <Text style={personalizedStyles.title}>{title}</Text>
        <Text style={personalizedStyles.description}>{description}</Text>

        <TouchableOpacity
          style={[
            personalizedStyles.ctaButton,
            { backgroundColor: accentColor },
          ]}
          activeOpacity={0.85}
          onPress={() => {
            // TODO: Navigate to relevant feature
          }}
        >
          <Text style={personalizedStyles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const personalizedStyles = StyleSheet.create({
  /**
   * flex: 1 makes each card take equal width in the row.
   * The parent recommendationRow uses flexDirection: 'row'
   * and gap for spacing between the two cards.
   */
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },

  accentStrip: {
    height: 6,
  },

  content: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  description: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.xs * 1.6,
  },

  ctaButton: {
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },

  ctaText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },
});

// ─────────────────────────────────────────────────────────
// Main Styles
// ─────────────────────────────────────────────────────────

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
    gap: SPACING.lg,
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

  // ── Score Card ──────────────────────────────────
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.lg,
    ...SHADOWS.md,
  },

  scoreCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  scoreLeft: {
    gap: SPACING.sm,
  },

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

  /**
   * Large circular score indicator on the right side
   * of the score card. Approximated from PDF.
   */
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 4,
    borderColor: COLORS.primaryLight,
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

  scoreBarSection: {
    gap: SPACING.xs,
  },

  scoreBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  scoreBarMin: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  scoreBarMax: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  scoreDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  // ── Chart Cards ─────────────────────────────────
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },

  chartCardHeader: {
    gap: SPACING.sm,
  },

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

  // ── Personalized Cards ──────────────────────────
  recommendationRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  // ── Summary Card ────────────────────────────────
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

  savingsPercent: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },

  goalPercent: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Motivation Section ──────────────────────────
  motivationSection: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },

  motivationIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  motivationEmoji: {
    fontSize: 36,
  },

  motivationTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  motivationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  // ── Report Button ───────────────────────────────
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },

  reportButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },

  bottomPadding: {
    height: 80,
  },
});