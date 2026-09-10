/**
 * My Budgets Screen
 *
 * Shows the user's monthly budget summary and a list of
 * per-category budgets with progress bars.
 *
 * Sections:
 *  1. ScreenHeader
 *  2. Overall budget card — total budget vs total spent
 *  3. Category count label
 *  4. List of BudgetCategoryItem components
 *  5. FloatingActionButton — add new budget
 */

import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import BudgetCategoryItem from '@/components/budget/BudgetCategoryItem';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import ScreenHeader from '@/components/common/ScreenHeader';
import AddTransactionModal from '@/modals/AddTransactionModal';

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { mockBudgets, mockOverallBudget } from '@/data/mockBudgets';
import { formatCurrency } from '@/utils/formatters';

export default function BudgetScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────── */}
      <ScreenHeader
        title="ZeeFi AI"
        subtitle="My Budgets"
      />

      {/* ── Scrollable Content ───────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Title ──────────────────────────── */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>My Budgets</Text>
          <Text style={styles.pageSubtitle}>
            Stay on track with your monthly goals.
          </Text>
        </View>

        {/* ── Overall Budget Card ──────────────────── */}
        {/*
         * The large green card at the top showing overall
         * budget health. Matches the prominent green card
         * in the PDF.
         */}
        <View style={styles.overallCard}>
          <View style={styles.overallCardTop}>
            <View>
              <Text style={styles.overallLabel}>
                OVERALL MONTHLY BUDGET
              </Text>
              <Text style={styles.overallAmount}>
                {formatCurrency(mockOverallBudget.totalBudget)}
              </Text>
            </View>
            <View style={styles.overallPercentBadge}>
              <Text style={styles.overallPercentText}>
                {mockOverallBudget.percentUsed}%
              </Text>
            </View>
          </View>

          {/* Progress bar on the green card uses white override */}
          <ProgressBar
            percent={mockOverallBudget.percentUsed}
            height={8}
            overrideColor="rgba(255,255,255,0.9)"
          />

          <Text style={styles.overallSubText}>
            You've spent {mockOverallBudget.percentUsed}% of your total
            budget. In: {formatCurrency(mockOverallBudget.totalBudget)}{' '}
            | Spent: {formatCurrency(mockOverallBudget.totalSpent)}
          </Text>
        </View>

        {/* ── Categories Section ───────────────────── */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>CATEGORIES</Text>
            <Text style={styles.categoriesCount}>
              {mockBudgets.length} ACTIVE
            </Text>
          </View>

          {/* Budget category items list */}
          {mockBudgets.map((budget) => (
            <BudgetCategoryItem
              key={budget.id}
              budget={budget}
              onPress={() => {
                // TODO: Navigate to budget detail screen
              }}
            />
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ── Floating Action Button ───────────────── */}
      {/*
       * On the Budget screen the FAB adds a new budget
       * category rather than a transaction.
       * TODO: Create an AddBudgetModal in a later phase.
       */}
      <FloatingActionButton
        onPress={() => {
          // TODO: Open Add Budget modal
          console.log('TODO: Open Add Budget modal');
        }}
      />

      {/* Add Transaction Modal kept here for consistency */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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

  // ── Overall Budget Card ─────────────────────────
  overallCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.md,
  },

  overallCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  overallLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },

  overallAmount: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  overallPercentBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },

  overallPercentText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  overallSubText: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: FONT_SIZE.xs * 1.6,
  },

  // ── Categories Section ──────────────────────────
  categoriesSection: {
    gap: SPACING.sm,
  },

  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  categoriesTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },

  categoriesCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  bottomPadding: {
    height: 80,
  },
});