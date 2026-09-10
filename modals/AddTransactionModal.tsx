/**
 * AddTransactionModal
 *
 * The primary modal for adding a new income or expense
 * transaction. Triggered by the FloatingActionButton on
 * the Dashboard, Budget, History, and Insights screens.
 *
 * The modal has several sections:
 *  1. Amount input — large centered number input
 *  2. Type toggle — Expense / Income tabs
 *  3. Category selector — dropdown to pick a category
 *  4. More Details — collapsible section with:
 *       - Account selector
 *       - Date picker (stubbed as text for now)
 *       - Note input
 *  5. Cancel / Save buttons
 *
 * State managed locally here since no persistence layer
 * exists yet. All form state is reset when the modal closes.
 *
 * TODO: Connect Save button to SQLite in a later phase.
 * TODO: Replace date display with a real DateTimePicker.
 * TODO: Replace account selector with real account data.
 */

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { mockCategories } from '@/data/mockCategories';
import { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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

interface AddTransactionModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;
  /** Called when the user taps Cancel or closes the modal */
  onClose: () => void;
  /**
   * Called when the user taps Save with valid form data.
   * TODO: Replace the any type with a proper NewTransaction
   * type when the database layer is implemented.
   */
  onSave?: (data: any) => void;
}

export default function AddTransactionModal({
  visible,
  onClose,
  onSave,
}: AddTransactionModalProps) {
  // ── Form State ───────────────────────────────────────────

  /**
   * The raw amount string as the user types it.
   * Stored as a string because TextInput values are always
   * strings — we parse to a number only on save.
   */
  const [amountText, setAmountText] = useState('0.00');

  /** Whether the user is adding an expense or income */
  const [transactionType, setTransactionType] =
    useState<TransactionType>('expense');

  /** ID of the selected category. Null means none selected yet. */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  /** The note field in the More Details section */
  const [note, setNote] = useState('');

  /** Selected account name */
  const [account, setAccount] = useState('Main Savings');

  // ── UI State ────────────────────────────────────────────

  /** Whether the category dropdown is expanded */
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  /** Whether the More Details section is expanded */
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);

  /** Whether the account selector dropdown is open */
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // ── Derived Values ───────────────────────────────────────

  /**
   * Filter categories to match the current transaction type
   * so the user only sees relevant options.
   */
  const filteredCategories = mockCategories.filter(
    (c) => c.type === transactionType
  );

  const selectedCategory = mockCategories.find(
    (c) => c.id === selectedCategoryId
  );

  // ── Handlers ────────────────────────────────────────────

  /**
   * Resets all form fields back to their defaults.
   * Called after a successful save or when the modal closes.
   */
  function resetForm() {
    setAmountText('0.00');
    setTransactionType('expense');
    setSelectedCategoryId(null);
    setNote('');
    setAccount('Main Savings');
    setCategoryDropdownOpen(false);
    setMoreDetailsOpen(false);
    setAccountDropdownOpen(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSave() {
    /**
     * TODO: Add proper validation here when connecting
     * to the database. For now just log and close.
     */
    const newTransaction = {
      amount: parseFloat(amountText) || 0,
      type: transactionType,
      categoryId: selectedCategoryId,
      note,
      account,
      date: new Date().toISOString(),
    };

    console.log('TODO: Save transaction:', newTransaction);

    if (onSave) {
      onSave(newTransaction);
    }

    resetForm();
    onClose();
  }

  /**
   * When the user switches between Expense and Income,
   * clear the selected category because categories are
   * type-specific and the previous selection is no longer valid.
   */
  function handleTypeChange(type: TransactionType) {
    setTransactionType(type);
    setSelectedCategoryId(null);
    setCategoryDropdownOpen(false);
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/*
       * TouchableWithoutFeedback on the backdrop allows the
       * user to dismiss the modal by tapping outside of it.
       */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          {/*
           * Stop touch events from propagating through the
           * modal sheet to the backdrop dismissal handler.
           */}
          <TouchableWithoutFeedback>
            {/*
             * KeyboardAvoidingView pushes the modal up when
             * the keyboard appears so the amount input is
             * never hidden behind the keyboard.
             */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.sheet}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* ── Header ──────────────────────────── */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Add Transaction</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* ── Amount Input ─────────────────────── */}
                <View style={styles.amountSection}>
                  <Text style={styles.currencySymbol}>₦</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amountText}
                    onChangeText={setAmountText}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                {/* ── Expense / Income Toggle ──────────── */}
                <View style={styles.typeToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      transactionType === 'expense' &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() => handleTypeChange('expense')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        transactionType === 'expense' &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Expense
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      transactionType === 'income' &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() => handleTypeChange('income')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        transactionType === 'income' &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ── Category Selector ────────────────── */}
                <View style={styles.field}>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() =>
                      setCategoryDropdownOpen((prev) => !prev)
                    }
                    activeOpacity={0.7}
                  >
                    {selectedCategory ? (
                      <View style={styles.selectedCategoryRow}>
                        <View
                          style={[
                            styles.categoryIconSmall,
                            {
                              backgroundColor:
                                selectedCategory.iconBackground,
                            },
                          ]}
                        >
                          <Ionicons
                            name={selectedCategory.iconName as any}
                            size={14}
                            color={selectedCategory.iconColor}
                          />
                        </View>
                        <Text style={styles.selectedCategoryText}>
                          {selectedCategory.name}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.selectorPlaceholder}>
                        Select Category
                      </Text>
                    )}
                    <Ionicons
                      name={
                        categoryDropdownOpen
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Category dropdown list */}
                  {categoryDropdownOpen && (
                    <View style={styles.dropdown}>
                      {filteredCategories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.dropdownItem,
                            selectedCategoryId === category.id &&
                              styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setSelectedCategoryId(category.id);
                            setCategoryDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.categoryIconSmall,
                              {
                                backgroundColor: category.iconBackground,
                              },
                            ]}
                          >
                            <Ionicons
                              name={category.iconName as any}
                              size={14}
                              color={category.iconColor}
                            />
                          </View>
                          <Text style={styles.dropdownItemText}>
                            {category.name}
                          </Text>
                          {selectedCategoryId === category.id && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={COLORS.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* ── More Details (collapsible) ────────── */}
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setMoreDetailsOpen((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandableHeaderText}>
                    More Details
                  </Text>
                  <Ionicons
                    name={moreDetailsOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {moreDetailsOpen && (
                  <View style={styles.expandableContent}>
                    {/* Account Selector */}
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() =>
                        setAccountDropdownOpen((prev) => !prev)
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectorWithIcon}>
                        <Ionicons
                          name="wallet-outline"
                          size={18}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.selectorText}>{account}</Text>
                      </View>
                      <Ionicons
                        name={
                          accountDropdownOpen
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={18}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Account dropdown */}
                    {accountDropdownOpen && (
                      <View style={styles.dropdown}>
                        {['Main Savings', 'Current Account', 'Cash'].map(
                          (acc) => (
                            <TouchableOpacity
                              key={acc}
                              style={[
                                styles.dropdownItem,
                                account === acc &&
                                  styles.dropdownItemActive,
                              ]}
                              onPress={() => {
                                setAccount(acc);
                                setAccountDropdownOpen(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.dropdownItemText}>
                                {acc}
                              </Text>
                              {account === acc && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color={COLORS.primary}
                                />
                              )}
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    )}

                    {/* Date field — stubbed as today's date */}
                    {/*
                     * TODO: Replace with a real DateTimePicker
                     * component when implementing full functionality.
                     * expo-datetime-picker is the recommended package.
                     */}
                    <View style={styles.selector}>
                      <View style={styles.selectorWithIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.selectorText}>
                          Today
                        </Text>
                      </View>
                      <Text style={styles.selectorSubText}>
                        {new Date().toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    {/* Note input */}
                    <View style={styles.noteInputContainer}>
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={COLORS.textSecondary}
                        style={styles.noteIcon}
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

                {/* ── Cancel / Save Buttons ────────────── */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /**
   * Semi-transparent backdrop that covers the full screen
   * behind the modal sheet.
   */
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },

  /**
   * The white sheet that slides up from the bottom.
   * maxHeight ensures it never takes over the full screen
   * so the backdrop is still partially visible behind it.
   */
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '90%',
    paddingBottom: SPACING['4xl'],
    ...SHADOWS.lg,
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

  /**
   * The amount section shows a large centered currency
   * input. This is the focal point of the modal.
   */
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
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

  /**
   * The Expense/Income toggle is a row of two full-width
   * buttons that fill the row equally using flex: 1.
   */
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

  /**
   * The selector is used for both the category dropdown
   * and the account selector. It looks like a form input
   * but opens a custom dropdown below it when tapped.
   */
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },

  selectorPlaceholder: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },

  selectorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },

  selectorSubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  selectorWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  selectedCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  selectedCategoryText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },

  categoryIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * The dropdown list appears directly below the selector
   * button. It has a shadow to visually lift it above the
   * other content and indicate it is an overlay.
   */
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xl,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    overflow: 'hidden',
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dropdownItemActive: {
    backgroundColor: COLORS.primaryMuted,
  },

  dropdownItemText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },

  /**
   * The More Details expandable section header looks like
   * a subtle link row rather than a full button.
   */
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

  /** Note input styled to look like the other selectors */
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
  },

  noteIcon: {
    marginTop: 2,
  },

  noteInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },

  /**
   * Cancel and Save sit side by side at the bottom of the
   * modal. Each takes equal space with flex: 1.
   */
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

  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },
});