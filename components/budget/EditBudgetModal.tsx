
/**
 * EditBudgetModal
 *
 * Lets the user change the budget amount and period.
 * Category is not editable after creation — if you want
 * a different category, delete this budget and create a new one.
 */
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { Budget, updateBudget } from '@/database/services/budget';
import { useBudgetStore, useCategoryStore, useUserStore } from '@/store';
import { getPeriodRange } from '@/utils/date';
import { formatCurrency } from '@/utils/formatters';

interface EditBudgetModalProps {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
}

export default function EditBudgetModal({
  visible,
  budget,
  onClose,
}: EditBudgetModalProps) {
  const db = useSQLiteContext();
  const { user } = useUserStore();
  const { updateBudget: updateInStore } = useBudgetStore();
  const { categories } = useCategoryStore();

  const [amountText, setAmountText] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>(
    'monthly'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (!budget) return;

    setAmountText(String(budget.amount));
    setPeriod(budget.period);
    setAmountError('');
  }, [budget]);

  const categoryName =
    categories.find((c) => c.id === budget?.categoryId)?.name ?? 'Unknown';

  function validate(): boolean {
    const parsed = parseFloat(amountText);

    if (!amountText || isNaN(parsed) || parsed <= 0) {
      setAmountError('Enter a valid budget amount greater than 0.');
      return false;
    }

    setAmountError('');
    return true;
  }

  async function handleSave() {
    if (!budget || !validate()) return;

    setIsSaving(true);

    try {
      const range = getPeriodRange(new Date(),period);
      const updated = await updateBudget(db, budget.id, {
        amount: parseFloat(amountText),
        period,
        startDate: range.startDate,
        endDate: range.endDate
      });

      updateInStore(db, user!.id, updated);
      Keyboard.dismiss();
      onClose();
    } catch (error) {
      console.error('Failed to update budget:', error);
      setAmountError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!budget) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        Keyboard.dismiss();
      }}
    >
      <View style={styles.backdrop}>
        {/* Tapping outside the sheet dismisses the keyboard */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        {/* Bottom sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Budget</Text>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  onClose();
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Category label — read only */}
            <View style={styles.categoryLabel}>
              <Ionicons
                name="grid-outline"
                size={18}
                color={COLORS.primary}
              />

              <View style={styles.categoryLabelText}>
                <Text style={styles.categoryLabelTitle}>
                  {categoryName}
                </Text>

                <Text style={styles.categoryLabelSub}>
                  Category cannot be changed after creation
                </Text>
              </View>
            </View>

            {/* Current vs new amount */}
            <View style={styles.currentAmountRow}>
              <Text style={styles.currentAmountLabel}>
                Current limit
              </Text>

              <Text style={styles.currentAmountValue}>
                {formatCurrency(budget.amount)}
              </Text>
            </View>

            {/* New amount input */}
            <Text style={styles.fieldLabel}>
              New Budget Amount
            </Text>

            <View
              style={[
                styles.amountInputWrapper,
                amountError ? styles.inputError : null,
              ]}
            >
              <Text style={styles.amountPrefix}>₦</Text>

              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(v) => {
                  setAmountText(v);
                  setAmountError('');
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {amountError ? (
              <Text style={styles.errorText}>
                {amountError}
              </Text>
            ) : null}

            {/* Period selector */}
            <Text
              style={[
                styles.fieldLabel,
                { marginTop: SPACING.lg },
              ]}
            >
              Period
            </Text>

            <View style={styles.periodRow}>
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodButton,
                    period === p && styles.periodButtonActive,
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setPeriod(p);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      period === p && styles.periodButtonTextActive,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  Keyboard.dismiss();
                  onClose();
                }}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.textOnPrimary}
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },

  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    paddingBottom: SPACING['4xl'],
    maxHeight: '85%',
    ...SHADOWS.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },

  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  // ── Category read-only label ──────────────────────────

  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  categoryLabelText: {
    gap: 2,
  },

  categoryLabelTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
  },

  categoryLabelSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryLight,
  },

  // ── Current amount ────────────────────────────────────

  currentAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  currentAmountLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  currentAmountValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  // ── Fields ────────────────────────────────────────────

  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    height: 54,
    marginBottom: SPACING.xs,
  },

  inputError: {
    borderColor: COLORS.danger,
  },

  amountPrefix: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },

  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
  },

  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },

  // ── Period ────────────────────────────────────────────

  periodRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
  },

  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  periodButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },

  periodButtonTextActive: {
    color: COLORS.textOnPrimary,
  },

  // ── Buttons ───────────────────────────────────────────

  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
  },

  saveButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },
});
