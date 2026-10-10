import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
 
import BudgetCategoryItem from '@/components/budget/BudgetCategoryItem';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import ProgressBar from '@/components/common/ProgressBar';
import ScreenHeader from '@/components/common/ScreenHeader';

import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import {
  createBudget,
  deleteBudget
} from '@/database/services/budget';
import {
  useBudgetStore,
  useCategoryStore,
  useUserStore,
} from '@/store';
import { getPeriodRange } from '@/utils/date';
import { formatCurrency } from '@/utils/formatters';

export default function BudgetScreen() {
  const db = useSQLiteContext();

  const { user } = useUserStore();
  const { budgets, isLoading, setBudgets, addBudget, removeBudget } =
    useBudgetStore();
  const { categories } = useCategoryStore();

  // ── Add Budget Modal state ───────────────────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [amountText, setAmountText] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // ── Derived values ──────────────────────────────────────
  /**
   * Only expense categories make sense for budgets.
   * You budget against what you spend, not what you earn.
   */
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId
  );

  /**
   * Overall budget summary for the header card.
   * Sum all budget limits and all spent amounts.
   */
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  //recalculate this value as well
  const totalSpent = budgets.reduce(
    (sum, b) => sum + ((b as any).spent ?? 0),
    0
  );
  const overallPercent =
    totalBudget > 0
      ? Math.min(100, Math.round((totalSpent / totalBudget) * 100))
      : 0;

  // ── Handlers ────────────────────────────────────────────
  function resetAddForm() {
    setSelectedCategoryId(null);
    setAmountText('');
    setPeriod('monthly');
    setCategoryDropdownOpen(false);
    setAmountError('');
    setCategoryError('');
  }

  function validateAddForm(): boolean {
    let valid = true;
    const parsed = parseFloat(amountText);

    if (!amountText || isNaN(parsed) || parsed <= 0) {
      setAmountError('Please enter a valid budget amount.');
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

  async function handleAddBudget() {
    if (!user || !validateAddForm()) return;
    setIsSaving(true);

    try {
      const range = getPeriodRange(new Date(),period);
      const newBudget = await createBudget(db, {
        userId: user.id,
        categoryId: selectedCategoryId!,
        amount: parseFloat(amountText),
        period,
        startDate: range.startDate,
        endDate:range.endDate
      });

      await addBudget(db,user?.id,newBudget);
      resetAddForm();
      setAddModalVisible(false);

    } catch (error) {
      console.error('Failed to create budget:', error);
      setAmountError('Failed to save budget. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteBudget(id: number) {
    try {
      await deleteBudget(db, id);
      removeBudget(id);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScreenHeader title="ZeeFi AI" subtitle="My Budgets" />

      {isLoading && (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading budgets...</Text>
        </View>
      )}

      {!isLoading && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageTitleSection}>
            <Text style={styles.pageTitle}>My Budgets</Text>
            <Text style={styles.pageSubtitle}>
              Stay on track with your monthly goals.
            </Text>
          </View>

          {/* Overall budget card — only show if budgets exist */}
          {budgets.length > 0 && (
            <View style={styles.overallCard}>
              <View style={styles.overallCardTop}>
                <View>
                  <Text style={styles.overallLabel}>OVERALL MONTHLY BUDGET</Text>
                  <Text style={styles.overallAmount}>
                    {formatCurrency(totalBudget)}
                  </Text>
                </View>
                <View style={styles.overallPercentBadge}>
                  <Text style={styles.overallPercentText}>
                    {overallPercent}%
                  </Text>
                </View>
              </View>
              <ProgressBar percent={overallPercent} height={8} overrideColor="rgba(255,255,255,0.9)" />
              <Text style={styles.overallSubText}>
                {formatCurrency(totalSpent)} spent of {formatCurrency(totalBudget)}
              </Text>
            </View>
          )}

          {/* Empty state */}
          {budgets.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="wallet-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>No budgets yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to set spending limits for your categories.
              </Text>
            </View>
          )}

          {/* Budget list */}
          {budgets.length > 0 && (
            <View style={styles.categoriesSection}>
              <View style={styles.categoriesHeader}>
                <Text style={styles.categoriesTitle}>CATEGORIES</Text>
                <Text style={styles.categoriesCount}>
                  {budgets.length} ACTIVE
                </Text>
              </View>

              {budgets.map((budget) => (
                <BudgetCategoryItem
                  key={budget.id}
                  budget={budget}
                  onPress={() => {}}
                  /*onDelete={() => handleDeleteBudget(budget.id)}*/
                />
              ))}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      <FloatingActionButton onPress={() => setAddModalVisible(true)} />

      {/* ── Add Budget Modal ───────────────────────────── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent={true}
        onRequestClose={() => {
          resetAddForm();
          setAddModalVisible(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            resetAddForm();
            setAddModalVisible(false);
          }}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Budget</Text>
              <TouchableOpacity
                onPress={() => {
                  resetAddForm();
                  setAddModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Category selector */}
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                style={[
                  styles.modalSelector,
                  categoryError ? styles.selectorError : null,
                ]}
                onPress={() => setCategoryDropdownOpen((p) => !p)}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    selectedCategory
                      ? styles.selectorText
                      : styles.selectorPlaceholder
                  }
                >
                  {selectedCategory?.name ?? 'Select a category'}
                </Text>
                <Ionicons
                  name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              {categoryError ? (
                <Text style={styles.errorText}>{categoryError}</Text>
              ) : null}

              {categoryDropdownOpen && (
                <View style={styles.dropdown}>
                  {expenseCategories.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        No expense categories available.
                      </Text>
                    </View>
                  ) : (
                    expenseCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.dropdownItem,
                          selectedCategoryId === cat.id &&
                            styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedCategoryId(cat.id);
                          setCategoryDropdownOpen(false);
                          setCategoryError('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>{cat.name}</Text>
                        {selectedCategoryId === cat.id && (
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

              {/* Amount input */}
              <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
                Budget Amount
              </Text>
              <View
                style={[
                  styles.amountInputWrapper,
                  amountError ? styles.selectorError : null,
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
                  maxLength={13}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              {amountError ? (
                <Text style={styles.errorText}>{amountError}</Text>
              ) : null}

              {/* Period selector */}
              <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
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
                    onPress={() => setPeriod(p)}
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

              {/* Save button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleAddBudget}
                activeOpacity={0.85}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Budget</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.lg },
  pageTitleSection: { gap: SPACING.xs },
  pageTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  pageSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
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
  },
  categoriesSection: { gap: SPACING.sm },
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
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  stateText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: FONT_SIZE.sm * 1.6,
  },
  bottomPadding: { height: 80 },
  // ── Modal styles ────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    paddingBottom: SPACING['4xl'],
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  modalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  selectorError: { borderColor: COLORS.danger },
  selectorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  selectorPlaceholder: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  dropdownEmpty: { padding: SPACING.lg, alignItems: 'center' },
  dropdownEmptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: { backgroundColor: COLORS.primaryMuted },
  dropdownItemText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    height: 50,
    marginBottom: SPACING.xs,
  },
  amountPrefix: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
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
  periodButtonTextActive: { color: COLORS.textOnPrimary },
  saveButton: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },
});