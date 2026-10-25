import ProgressBar from '@/components/common/ProgressBar';
import { CATEGORY_COLOR_OPTIONS, COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { useCategoryStore } from '@/store';
import { InStateBudget } from '@/store/budgetStore';
import { getDaysRemaining } from '@/utils/date';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BudgetCategoryItemProps {
  budget: InStateBudget;
  onEdit: () => void;
  onDelete: ()=>void;
}

export default function BudgetCategoryItem({
  budget,
  onEdit,
  onDelete
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
  function handleDelete() {
    Alert.alert(
      'Delete Budget',
      `Delete the budget for ${category?.name}? Your transactions in this category will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }
  return (
    <View style={styles.card}>
        {/* Header: Category and actions */}
        <View style={styles.header}>
          <View style={styles.categorySection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: iconBackground },
              ]}
            >
              <Ionicons
                name={iconName as any}
                size={22}
                color={iconColor}
              />
            </View>
    
            <View style={styles.nameSection}>
              <Text
                style={styles.categoryName}
                numberOfLines={1}
              >
                {category?.name}
              </Text>
    
              <Text style={styles.subtitle}>
                Budget overview
              </Text>
            </View>
          </View>
    
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pencil-outline"
                size={17}
                color={COLORS.primary}
              />
            </TouchableOpacity>
    
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={17}
                color={COLORS.danger}
              />
            </TouchableOpacity>
          </View>
        </View>
    
        {/* Spending information */}
        <View style={styles.amountSection}>
          <View>
            <Text style={styles.amountLabel}>
              Spent so far
            </Text>
    
            <Text style={styles.spentAmount}>
              {formatCurrency(spent)}
            </Text>
          </View>
    
          <View style={styles.limitSection}>
            <Text style={styles.amountLabel}>
              Budget limit
            </Text>
    
            <Text style={styles.limitAmount}>
              {formatCurrency(budget.amount)}
            </Text>
          </View>
        </View>
    
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Budget usage
            </Text>
    
            <Text style={styles.percentageText}>
              {Math.round(percentUsed)}%
            </Text>
          </View>
    
          <View style={styles.progressTrack}>
            <ProgressBar
              percent={percentUsed}
              height={8}
            />
          </View>
        </View>
    
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.remainingSection}>
            <Ionicons
              name="wallet-outline"
              size={16}
              color={COLORS.primary}
            />
    
            <View>
              <Text style={styles.footerLabel}>
                Remaining
              </Text>
    
              <Text style={styles.remainingAmount}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>
    
          <View style={styles.daysSection}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.textMuted}
            />
    
            <Text style={styles.daysText}>
              {daysRemaining} days left
            </Text>
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },

  // ── Header ────────────────────────────────────────────

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },

  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
    marginRight: SPACING.sm,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  nameSection: {
    flex: 1,
    gap: 4,
  },

  categoryName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Amounts ──────────────────────────────────────────

  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },

  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  spentAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  limitSection: {
    alignItems: 'flex-end',
  },

  limitAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
  },

  // ── Progress ─────────────────────────────────────────

  progressSection: {
    marginBottom: SPACING.lg,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  progressLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },

  percentageText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  progressTrack: {
    borderRadius: 999,
    overflow: 'hidden',
  },

  // ── Footer ───────────────────────────────────────────

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  remainingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  footerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginBottom: 3,
  },

  remainingAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  daysSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },

  daysText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
