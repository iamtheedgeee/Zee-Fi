/**
 
 * Belongs to the history.tsx page
 *
 * Interaction pattern:
 *  - Tap the row → opens the EditTransactionModal
 *  - Long press OR tap the trash icon → confirms delete
 *
 * The delete icon is always visible on the right side
 * so the action is discoverable without requiring swipe
 * gestures which can conflict with ScrollView on Android.
 */
import { CATEGORY_COLOR_OPTIONS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants';
import { Transaction } from '@/database/services/transaction';
import { useCategoryStore } from '@/store';
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

interface TransactionItemProps {
  transaction: Transaction;
  /** Tap the row body to edit */
  onPress: () => void;
  /** Called after delete is confirmed */
  onDelete: () => void;
}

export default function TransactionItem({
  transaction,
  onPress,
  onDelete,
}: TransactionItemProps) {
  const { categories } = useCategoryStore();

  const category = categories.find((c) => c.id === transaction.categoryId);
  const iconName = category?.iconName ?? 'ellipse-outline';
  const CCO=CATEGORY_COLOR_OPTIONS.find((c)=>c.label===category?.iconColor)
  const iconColor = CCO?.icon ??COLORS.textSecondary;
  const iconBackground =CCO?.bg ?? COLORS.inputBackground;
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? COLORS.income : COLORS.expense;
  const amountPrefix = isIncome ? '+' : '-';

  function handleDelete() {
    Alert.alert(
      'Delete Transaction',
      `Delete this ${transaction.type} of ${formatCurrency(transaction.amount)}? This will reverse its effect on your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }

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

      {/* Middle: title and meta */}
      <View style={styles.middleSection}>
        <Text style={styles.title} numberOfLines={1}>
          {category?.name ?? 'Unknown'}
        </Text>
        <Text style={styles.meta}>
          {transaction.date.split('T')[0]}
          {transaction.notes ? `  ·  ${transaction.notes}` : ''}
        </Text>
      </View>

      {/* Right: amount + delete */}
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount)}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteButton}
        >
          <Ionicons
            name="trash-outline"
            size={15}
            color={COLORS.danger}
          />
        </TouchableOpacity>
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
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
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
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  amount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  deleteButton: {
    padding: 2,
  },
});