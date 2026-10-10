/**
 * TransactionItem
 *
 * A single row representing one financial transaction.
 * Used in two places:
 *  - Dashboard: "Recent Transactions" section (compact list)
 *  - Transaction History screen: full grouped list
 *
 * This is one of the most important reusable components
 * in the app because transactions appear everywhere.
 * Keeping it in one place means any visual change applies
 * consistently across all screens.
 *
 * Layout:
 *  [Category Icon]  [Title + Category/Time]  [Amount + Delete]
 *
 * Props:
 *  - transaction: the Transaction object to display
 *  - onPress: called when the row is tapped (opens detail)
 *  - onDelete: optional delete action (shown on History screen)
 *  - showDelete: whether to show the delete button (default false)
 */

import { CATEGORY_COLOR_OPTIONS, COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants';
import { Transaction } from '@/database/services/transaction';
import { useCategoryStore } from '@/store';
import { formatCurrency, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function TransactionItem({
  transaction,
  onPress,
  onDelete,
  showDelete = false,
}: TransactionItemProps) {
  
  const {categories}=useCategoryStore()
  const category = categories.find(
    (c) => c.id === transaction.categoryId
  );

  const iconName = category?.iconName ?? 'ellipse-outline';
  const CCO=CATEGORY_COLOR_OPTIONS.find((c)=>c.label===category?.iconColor)
  const iconColor = CCO?.icon ??COLORS.textSecondary;
  const iconBackground =CCO?.bg ?? COLORS.inputBackground;

 
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? COLORS.income : COLORS.expense;
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>

      {/* Middle: title and category + time */}
      <View style={styles.middleSection}>
        <Text style={styles.title} numberOfLines={1}>
          {category?.name}
        </Text>
        <Text style={styles.meta}>
          {formatTime(transaction.date)}
        </Text>
      </View>

      {/* Right: amount and optional delete button */}
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}
          {formatCurrency(transaction.amount)}
        </Text>

        {showDelete && onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },

  /** Circular background behind the category icon */
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /**
   * flex: 1 makes the middle section fill remaining space
   * so the amount column stays pinned to the right edge.
   */
  middleSection: {
    flex: 1,
    gap: 2,
  },

  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  meta: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textSecondary,
  },

  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },

  amount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },

  deleteButton: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFE4E4',
  },

  deleteText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.danger,
  },
});