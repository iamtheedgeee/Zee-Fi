import ProgressBar from '@/components/common/ProgressBar';
import { CATEGORY_COLOR_OPTIONS, COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { useCategoryStore } from '@/store';
import { InStateBudget } from '@/store/budgetStore';
import { getDaysRemaining } from '@/utils/date';
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
  budget: InStateBudget;
  onPress?: () => void;
}

export default function BudgetCategoryItem({
  budget,
  onPress,
}: BudgetCategoryItemProps) {
  const {categories}=useCategoryStore()
  const category=categories.find((c) => c.id === budget.categoryId)
  
  const iconBackground=CATEGORY_COLOR_OPTIONS.find((C)=>C.label===category?.iconColor)?.bg
  const iconColor=CATEGORY_COLOR_OPTIONS.find((C)=>C.label===category?.iconColor)?.icon
  const iconName=category?.iconName
  //Calculate the following values from transactions
  const spent=budget.spent
  const daysRemaining=getDaysRemaining(budget.endDate)
  const percentUsed = Math.min(
    100,
    Math.round((spent / budget.amount) * 100)
  );
  const remaining = Math.max(0, budget.amount - spent);

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
            { backgroundColor: iconBackground },
          ]}
        >
          <Ionicons
            name={iconName as any}
            size={20}
            color={iconColor}
          />
        </View>

        {/* Category name and spent amount */}
        <View style={styles.nameSection}>
          <Text style={styles.categoryName}>{category?.name}</Text>
          <Text style={styles.spentText}>
            {formatCurrency(spent)} spent
          </Text>
        </View>

        {/* Right side: budget limit and chevron */}
        <View style={styles.rightSection}>
          <Text style={styles.limitText}>{formatCurrency(budget.amount)}</Text>
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
          {daysRemaining} days left
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