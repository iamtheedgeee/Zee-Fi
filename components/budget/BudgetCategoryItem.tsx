/**
 * BudgetCategoryItem
 *
 * A single budget row on the My Budgets screen showing:
 *  - Category icon and name
 *  - Amount spent vs budget limit
 *  - A progress bar indicating how much of the budget is used
 *  - Days remaining in the budget period
 *  - A chevron to navigate to the budget detail
 *
 * The progress bar automatically changes color based on
 * how much of the budget has been consumed:
 *  - Under 75%: green (on track)
 *  - 75–90%: amber (approaching limit)
 *  - Over 90%: red (nearly exceeded)
 *
 * Props:
 *  - budget: the Budget object to display
 *  - onPress: called when the row is tapped
 */

import ProgressBar from '@/components/common/ProgressBar';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { Budget } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface BudgetCategoryItemProps {
  budget: Budget;
  onPress?: () => void;
}

export default function BudgetCategoryItem({
  budget,
  onPress,
}: BudgetCategoryItemProps) {
  /**
   * Calculate what percentage of the budget has been spent.
   * Clamped to 100 so the bar never visually overflows.
   */
  const percentUsed = Math.min(
    100,
    Math.round((budget.spent / budget.limit) * 100)
  );

  const remaining = budget.limit - budget.spent;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row: icon, name, amounts, chevron */}
      <View style={styles.topRow}>
        {/* Category icon */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: budget.iconBackground },
          ]}
        >
          <Ionicons
            name={budget.iconName as any}
            size={20}
            color={budget.iconColor}
          />
        </View>

        {/* Category name and spent amount */}
        <View style={styles.nameSection}>
          <Text style={styles.categoryName}>{budget.categoryName}</Text>
          <Text style={styles.spentText}>
            {formatCurrency(budget.spent)} spent
          </Text>
        </View>

        {/* Right side: budget limit and chevron */}
        <View style={styles.rightSection}>
          <Text style={styles.limitText}>{formatCurrency(budget.limit)}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.textMuted}
          />
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <ProgressBar percent={percentUsed} height={8} />
      </View>

      {/* Bottom row: percent used and days remaining */}
      <View style={styles.bottomRow}>
        <Text style={styles.remainingText}>
          {formatCurrency(remaining)} remaining
        </Text>
        <Text style={styles.daysText}>
          {budget.daysRemaining} days left
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /**
   * flex: 1 so the name section fills the space between
   * the icon and the right-side limit/chevron.
   */
  nameSection: {
    flex: 1,
    gap: 2,
  },

  categoryName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  spentText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textSecondary,
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 0,
  },

  limitText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
  },

  progressSection: {
    marginBottom: SPACING.sm,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  remainingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textSecondary,
  },

  daysText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textMuted,
  },
});