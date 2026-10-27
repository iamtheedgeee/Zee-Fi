/**
 * EditTransactionModal
 *
 * Pre-fills all fields from the existing transaction.
 * On save it calls updateTransaction which atomically
 * adjusts the balance if the amount or type changed.
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
import {
    Transaction,
    updateTransaction,
} from '@/database/services/transaction';
import {
    useCategoryStore,
    useTransactionStore,
    useUserStore,
} from '@/store';
import { TransactionType } from '@/types';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export default function EditTransactionModal({
  visible,
  transaction,
  onClose,
}: EditTransactionModalProps) {
  const db = useSQLiteContext();
  const { setBalance } = useUserStore();
  const { updateTransaction: updateInStore } = useTransactionStore();
  const { categories } = useCategoryStore();

  // Form state
  const [amountText, setAmountText] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');

  // UI state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  /**
   * Track keyboard visibility so Android's back button
   * dismisses the keyboard before closing the modal.
   */
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  /**
   * Pre-fill form fields whenever the transaction changes.
   */
  useEffect(() => {
    if (!transaction) return;

    setAmountText(String(transaction.amount));
    setType(transaction.type);
    setCategoryId(transaction.categoryId);
    setNote(transaction.notes ?? '');
    setDate(transaction.date.split('T')[0]);
    setAmountError('');
    setCategoryError('');
    setDropdownOpen(false);
    setMoreOpen(false);
  }, [transaction]);

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  function handleRequestClose() {
    if (keyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    onClose();
  }

  function handleTypeChange(newType: TransactionType) {
    setType(newType);

    // Clear category if it does not belong to the new type.
    const cat = categories.find((c) => c.id === categoryId);

    if (cat && cat.type !== newType) {
      setCategoryId(null);
    }

    setDropdownOpen(false);
  }

  function validate(): boolean {
    let valid = true;
    const parsed = parseFloat(amountText);

    if (!amountText || isNaN(parsed) || parsed <= 0) {
      setAmountError('Enter a valid amount greater than 0.');
      valid = false;
    } else {
      setAmountError('');
    }

    if (!categoryId) {
      setCategoryError('Please select a category.');
      valid = false;
    } else {
      setCategoryError('');
    }

    return valid;
  }

  async function handleSave() {
    if (!transaction || !validate()) return;

    setIsSaving(true);
    Keyboard.dismiss();

    try {
      const { transaction: updated, newBalance } =
        await updateTransaction(db, transaction.id, transaction, {
          amount: parseFloat(amountText),
          type,
          categoryId: categoryId!,
          date,
          notes: note.trim() || undefined,
        });

      updateInStore(updated);
      setBalance(newBalance);
      onClose();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      setAmountError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.backdrop}>
        {/* Tap outside the sheet to dismiss the keyboard only. */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Transaction</Text>

              <TouchableOpacity
                onPress={handleClose}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.amountSection}>
              <Text style={styles.currencySymbol}>₦</Text>

              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(value) => {
                  setAmountText(value);
                  setAmountError('');
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>

            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}

            {/* Type toggle */}
            <View style={styles.typeToggleRow}>
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeButton,
                    type === t && styles.typeButtonActive,
                  ]}
                  onPress={() => handleTypeChange(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === t && styles.typeButtonTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category selector */}
            <View style={styles.field}>
              <TouchableOpacity
                style={[
                  styles.selector,
                  categoryError ? styles.selectorError : null,
                ]}
                onPress={() => setDropdownOpen((previous) => !previous)}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    selectedCategory
                      ? styles.selectorText
                      : styles.selectorPlaceholder
                  }
                >
                  {selectedCategory?.name ?? 'Select Category'}
                </Text>

                <Ionicons
                  name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {categoryError ? (
                <Text style={styles.errorText}>{categoryError}</Text>
              ) : null}

              {dropdownOpen && (
                <View style={styles.dropdown}>
                  {filteredCategories.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        No {type} categories found.
                      </Text>
                    </View>
                  ) : (
                    filteredCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.dropdownItem,
                          categoryId === cat.id &&
                            styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setCategoryId(cat.id);
                          setDropdownOpen(false);
                          setCategoryError('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>
                          {cat.name}
                        </Text>

                        {categoryId === cat.id && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* More details */}
            <TouchableOpacity
              style={styles.expandableHeader}
              onPress={() => setMoreOpen((previous) => !previous)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandableHeaderText}>More Details</Text>

              <Ionicons
                name={moreOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            {moreOpen && (
              <View style={styles.expandableContent}>
                {/* Date */}
                <View style={styles.selector}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={COLORS.textSecondary}
                    style={{ marginRight: SPACING.sm }}
                  />

                  <TextInput
                    style={styles.inlineInput}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                {/* Note */}
                <View style={styles.noteInputContainer}>
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.textSecondary}
                    style={{ marginTop: 2 }}
                  />

                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add a note..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                  />
                </View>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
    maxHeight: '90%',
    paddingBottom: SPACING['4xl'],
    ...SHADOWS.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
    gap: SPACING.sm,
  },
  currencySymbol: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  amountInput: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginHorizontal: SPACING.xl,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typeToggleRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: COLORS.textOnPrimary,
  },
  field: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xs,
  },
  selectorError: {
    borderColor: COLORS.danger,
  },
  selectorText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  selectorPlaceholder: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  inlineInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: 2,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  dropdownEmpty: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primaryMuted,
  },
  dropdownItemText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  expandableHeaderText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  expandableContent: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  noteInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xl,
    gap: SPACING.sm,
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  noteInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
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