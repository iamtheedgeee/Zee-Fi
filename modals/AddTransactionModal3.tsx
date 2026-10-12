import {
  CATEGORY_COLOR_OPTIONS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { getCategorySpending } from '@/database/services/analyses';
import { getBudgetByCategory } from '@/database/services/budget';
import { createTransaction } from '@/database/services/transaction';
import {
  useBudgetStore,
  useCategoryStore,
  useTransactionStore,
  useUserStore,
} from '@/store';
import { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional callback after a successful save */
  onSaved?: () => void;
}
//FORMAT AMOUNT INPUT
function formatAmountInput(value: string): string {
  // Remove everything except digits and decimal points
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Keep only the first decimal point
  const firstDecimalIndex = cleaned.indexOf('.');

  if (firstDecimalIndex !== -1) {
    cleaned =
      cleaned.slice(0, firstDecimalIndex + 1) +
      cleaned.slice(firstDecimalIndex + 1).replace(/\./g, '');
  }

  // Split integer and decimal parts
  let [integerPart, decimalPart] = cleaned.split('.');

  // Limit decimal part to 2 digits
  if (decimalPart !== undefined) {
    decimalPart = decimalPart.slice(0, 2);
  }

  // Add commas to the integer part
  integerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  );

  // Preserve decimal point if the user entered one
  if (decimalPart !== undefined) {
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
}export default function AddTransactionModal({
  visible,
  onClose,
  onSaved,
}: AddTransactionModalProps) {
  const db = useSQLiteContext();

  // ── Store access ────────────────────────────────────────
  const { user, setBalance, setSummary } = useUserStore();
  const { addTransaction } = useTransactionStore();
  const {updateBudgetProgress}=useBudgetStore();
  const { categories } = useCategoryStore();

  // ── Form state ──────────────────────────────────────────
  const [amountText, setAmountText] = useState('0');
  const [transactionType, setTransactionType] =
    useState<TransactionType>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [note, setNote] = useState('');
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );

  // ── UI state ────────────────────────────────────────────
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // ── Derived ─────────────────────────────────────────────
  const filteredCategories = categories.filter(
    (c) => c.type === transactionType
  );

  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId
  );
  useEffect(()=>{
    console.log(amountText)
  },[amountText])
  // ── Handlers ────────────────────────────────────────────
  function resetForm() {
    setAmountText('');
    setTransactionType('expense');
    setSelectedCategoryId(null);
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryDropdownOpen(false);
    setMoreDetailsOpen(false);
    setAmountError('');
    setCategoryError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleTypeChange(type: TransactionType) {
    setTransactionType(type);

    // Clearing the selected category when switching types because categories are type-specific.
    setSelectedCategoryId(null);
    setCategoryDropdownOpen(false);
    setCategoryError('');
  }

  function validate(): boolean {
    let valid = true;
    const parsedAmount = parseFloat(amountText.replace(/,/g, ''));

    if (!amountText || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      valid = false;
    } else {
      setAmountError('');
    }

    if (!selectedCategoryId) {
      setCategoryError('Please select a category.');
      valid = false;
    } else {
      setCategoryError('');
    }

    return valid;
  }
  async function refreshBudgetForCategory(categoryId: number) {
    const budget = await getBudgetByCategory(db,user!.id,categoryId);

    if (!budget) return;

    const spent = await getCategorySpending(
      db,
      user!.id,
      categoryId,
      budget.startDate,
      budget.endDate
    );

    updateBudgetProgress(budget.id, spent);
  }
  async function handleSave() {
    if (!user) return;
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { transaction, newBalance } = await createTransaction(db, {
        userId: user.id,
        categoryId: selectedCategoryId!,
        amount: parseFloat(amountText.replace(/,/g, '')),
        type: transactionType,
        date:`${date}T${new Date().toTimeString().slice(0, 8)}`,
        notes: note.trim() || undefined,
      });
      addTransaction(transaction);
      setBalance(newBalance);
      refreshBudgetForCategory(transaction.categoryId)
      resetForm();
      onClose();
      onSaved?.();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setAmountError('Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={styles.sheet}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* ── Header ──────────────────────────── */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Log Transaction</Text>

                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* ── Amount ──────────────────────────── */}
                <View style={styles.amountSection}>
                  <Text style={styles.currencySymbol}>₦</Text>

                  <TextInput
                    style={styles.amountInput}
                    value={amountText}
                    onChangeText={(v) => {
                      setAmountText(formatAmountInput(v));
                      setAmountError('');
                    }}
                    maxLength={15}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    selectTextOnFocus
                  />
                </View>

                {amountError ? (
                  <Text style={styles.errorText}>{amountError}</Text>
                ) : null}

                {/* ── Type toggle ──────────────────────── */}
                <View style={styles.typeToggleRow}>
                  {(['expense', 'income'] as TransactionType[]).map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          transactionType === type &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() => handleTypeChange(type)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            transactionType === type &&
                              styles.typeButtonTextActive,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {/* ── Category selector ────────────────── */}
                <View style={styles.field}>
                  <TouchableOpacity
                    style={[
                      styles.selector,
                      categoryError ? styles.selectorError : null,
                    ]}
                    onPress={() => setCategoryDropdownOpen((p) => !p)}
                    activeOpacity={0.7}
                  >
                    {selectedCategory ? (
                      <View style={styles.selectedCategoryRow}>
                        {/* Category icon */}
                        <View
                          style={[
                            styles.categoryIconSmall,
                            {
                              backgroundColor:CATEGORY_COLOR_OPTIONS.find((c)=>c.label===selectedCategory?.iconColor)?.bg
                            },
                          ]}
                        >
                          <Ionicons
                            name={selectedCategory.iconName as any}
                            size={14}
                            color={CATEGORY_COLOR_OPTIONS.find((c)=>c.label===selectedCategory?.iconColor)?.icon}
                          />
                        </View>

                        <Text style={styles.selectorText}>
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

                  {categoryError ? (
                    <Text style={styles.errorText}>{categoryError}</Text>
                  ) : null}

                  {/* Category dropdown */}
                  {categoryDropdownOpen && (
                    <View style={styles.dropdown}>
                      {filteredCategories.length === 0 ? (
                        <View style={styles.dropdownEmpty}>
                          <Text style={styles.dropdownEmptyText}>
                            No {transactionType} categories yet.
                          </Text>
                        </View>
                      ) : (
                        filteredCategories.map((category) => (
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
                              setCategoryError('');
                            }}
                            activeOpacity={0.7}
                          >
                            {/* Category icon */}
                            <View
                              style={[
                                styles.categoryIconSmall,
                                {
                                  backgroundColor:
                                    CATEGORY_COLOR_OPTIONS.find((c)=>c.label===category.iconColor)?.bg,
                                },
                              ]}
                            >
                              <Ionicons
                                name={category.iconName as any}
                                size={14}
                                color={CATEGORY_COLOR_OPTIONS.find((c)=>c.label===category.iconColor)?.icon}
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
                        ))
                      )}
                    </View>
                  )}
                </View>

                {/* ── More details ─────────────────────── */}
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setMoreDetailsOpen((p) => !p)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandableHeaderText}>
                    More Details
                  </Text>

                  <Ionicons
                    name={
                      moreDetailsOpen ? 'chevron-up' : 'chevron-down'
                    }
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {moreDetailsOpen && (
                  <View style={styles.expandableContent}>
                    {/* Date input */}
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

                {/* ── Buttons ──────────────────────────── */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isLoading && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.textOnPrimary}
                      />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },

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

  selectorPlaceholder: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },

  selectorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },

  selectedCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  categoryIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...SHADOWS.md,
    overflow: 'hidden',
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

  noteIcon: {
    marginTop: 2,
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