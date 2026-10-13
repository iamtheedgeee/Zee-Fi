

import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import FilterTabs from '@/components/common/FilterTabs';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import SearchBar from '@/components/common/SearchBar';

import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import {
  Category,
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/database/services/category';
import { useBudgetStore, useCategoryStore, useUserStore } from '@/store';
const FILTER_TABS = ['All', 'Expense', 'Income'];

/**
 * Icon options the user can pick for their category.
 * Each entry is an Ionicons name paired with a display label.
 * Kept deliberately short — users can always just use the
 * default if they do not care about the icon.
 */


/**
 * Background/icon color pairs the user can assign.
 * Stored as the background color — icon color is derived.
 */

export default function CategoriesScreen() {
  const db = useSQLiteContext();
  const { user } = useUserStore();
  const {
    categories,
    addCategory,
    updateCategory: updateCategoryInStore,
    removeCategory,
  } = useCategoryStore();
  const {setBudgets}=useBudgetStore()
  // ── List state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // ── Add/Edit modal state ────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  /**
   * If editingCategory is set, the modal is in edit mode.
   * If null, the modal is in add mode.
   */
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICON_OPTIONS[0].name);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLOR_OPTIONS[0]);

  // Form errors
  const [nameError, setNameError] = useState('');

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Derived filtered list ───────────────────────────────
  const filteredCategories = categories.filter((c) => {
    const matchesType =
      activeFilter === 'All' ||
      (activeFilter === 'Expense' && c.type === 'expense') ||
      (activeFilter === 'Income' && c.type === 'income');

    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  // ── Modal helpers ───────────────────────────────────────
  function openAddModal() {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setSelectedIcon(CATEGORY_ICON_OPTIONS[0].name);
    setSelectedColor(CATEGORY_COLOR_OPTIONS[0]);
    setNameError('');
    setModalVisible(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setSelectedIcon(
      category.iconName ?? CATEGORY_ICON_OPTIONS[0].name
    );
    const savedColor = CATEGORY_COLOR_OPTIONS.find(
      (c) => c.label === category.iconColor
    );
    setSelectedColor(savedColor ?? CATEGORY_COLOR_OPTIONS[0]);
    setNameError('');
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCategory(null);
    setName('');
    setNameError('');
  }

  function validate(): boolean {
    if (!name.trim()) {
      setNameError('Please enter a category name.');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      return false;
    }
    // Check for duplicate names within the same type
    const duplicate = categories.find(
      (c) =>
        c.name.toLowerCase() === name.trim().toLowerCase() &&
        c.type === type &&
        c.id !== editingCategory?.id
    );
    if (duplicate) {
      setNameError(
        `You already have a ${type} category called "${name.trim()}".`
      );
      return false;
    }
    setNameError('');
    return true;
  }

  // ── Save handler (add or edit) ──────────────────────────
  async function handleSave() {
    if (!user || !validate()) return;
    setIsSaving(true);

    try {
      if (editingCategory) {
        // Editting
        const updated = await updateCategory(db, editingCategory.id, {
          name: name.trim(), 
          iconName: selectedIcon,
          iconColor: selectedColor.label,       
        });
        updateCategoryInStore(updated)
        await setBudgets(db,user.id)
        
      } else {
        // Adding
        const newCategory = await createCategory(db, {
          userId: user.id,
          name: name.trim(),
          type,
          iconName:selectedIcon,
          iconColor:selectedColor.label

        });
        addCategory(newCategory);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      setNameError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Delete handler ──────────────────────────────────────
  async function handleDelete(category: Category) {
    /**
     * Warn the user before deleting because the schema uses
     * ON DELETE RESTRICT on transactions and budgets.
     * If any transactions reference this category the delete
     * will fail — we catch that and show a clear message.
     */
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? This cannot be undone.\n\nIf any transactions or budgets use this category, the deletion will fail.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(category.id);
            try {
              await deleteCategory(db, category.id);
              removeCategory(category.id);
              await setBudgets(db,user!.id)
            } catch (error: any) {
              /**
               * SQLite RESTRICT violation message contains "FOREIGN KEY"
               * so we can give the user a meaningful explanation.
               */
              const isForeignKey =
                error?.message?.includes('FOREIGN KEY') ||
                error?.message?.includes('constraint');

              Alert.alert(
                'Cannot Delete',
                isForeignKey
                  ? `"${category.name}" is used by existing transactions or budgets. Remove those first, then delete the category.`
                  : 'Something went wrong. Please try again.'
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Organise your transactions with personalised labels
          to track where your money goes.
        </Text>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search categories..."
        />

        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />

        {/* Count row */}
        <View style={styles.countRow}>
          <Text style={styles.countLabel}>
            {activeFilter === 'All' ? 'ALL CATEGORIES' : activeFilter.toUpperCase()}
          </Text>
          <Text style={styles.countValue}>
            {filteredCategories.length} ITEMS
          </Text>
        </View>

        {/* Empty state */}
        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="folder-open-outline"
              size={48}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? 'No categories match your search.'
                : `No ${activeFilter === 'All' ? '' : activeFilter.toLowerCase() + ' '}categories yet.`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term.'
                : 'Tap the + button to create your first category.'}
            </Text>
          </View>
        )}

        {/* Category list */}
        {filteredCategories.length > 0 && (
          <View style={styles.categoriesList}>
            {filteredCategories.map((category, index) => (
              <CategoryRow
                key={category.id}
                category={category}
                showDivider={index < filteredCategories.length - 1}
                isDeleting={deletingId === category.id}
                onEdit={() => openEditModal(category)}
                onDelete={() => handleDelete(category)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FloatingActionButton onPress={openAddModal} />

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        statusBarTranslucent={true}
        transparent
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* ── Preview ─────────────────────────────── */}
              {/**
               * Live preview of how the category icon will
               * look in the transaction list, using the
               * currently selected icon and color.
               */}
              <View style={styles.previewRow}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: selectedColor.bg },
                  ]}
                >
                  <Ionicons
                    name={selectedIcon as any}
                    size={26}
                    color={selectedColor.icon}
                  />
                </View>
                <View style={styles.previewTextBlock}>
                  <Text style={styles.previewName}>
                    {name.trim() || 'Category Name'}
                  </Text>
                  <View
                    style={[
                      styles.typePill,
                      type === 'income'
                        ? styles.typePillIncome
                        : styles.typePillExpense,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        type === 'income'
                          ? styles.typePillTextIncome
                          : styles.typePillTextExpense,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Name input ──────────────────────────── */}
              <Text style={styles.fieldLabel}>Category Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  nameError ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    setNameError('');
                  }}
                  placeholder="e.g. Groceries, Salary..."
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                />
                {name.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setName('')}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}

              {/* ── Type selector
                UNAVAILABLE WHEN EDITTING
              ───────────────────────── */}
              {!editingCategory &&
              <>
              <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
                Typo
              </Text>
              <View style={styles.typeToggleRow}>
                {(['expense', 'income'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      type === t && styles.typeButtonActive,
                    ]}
                    onPress={() => setType(t)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        t === 'expense'
                          ? 'arrow-up-circle-outline'
                          : 'arrow-down-circle-outline'
                      }
                      size={16}
                      color={
                        type === t ? COLORS.textOnPrimary : COLORS.textSecondary
                      }
                    />
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
              </>
              }

              {/* ── Icon picker ─────────────────────────── */}
              <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
                Icon
              </Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICON_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.name}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor:
                          selectedIcon === option.name
                            ? selectedColor.bg
                            : COLORS.inputBackground,
                        borderColor:
                          selectedIcon === option.name
                            ? selectedColor.icon
                            : COLORS.border,
                      },
                    ]}
                    onPress={() => setSelectedIcon(option.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.name as any}
                      size={22}
                      color={
                        selectedIcon === option.name
                          ? selectedColor.icon
                          : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.iconLabel,
                        selectedIcon === option.name && {
                          color: selectedColor.icon,
                          fontWeight: FONT_WEIGHT.semiBold,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Color picker ─────────────────────────── */}
              <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
                Color
              </Text>
              <View style={styles.colorRow}>
                {CATEGORY_COLOR_OPTIONS.map((color) => {
                  const isSelected = selectedColor.bg === color.bg;
                  return (
                    <TouchableOpacity
                      key={color.bg}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color.icon },
                        isSelected && styles.colorDotSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#fff"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Save button ─────────────────────────── */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.textOnPrimary}
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Category Row sub-component
// ─────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category;
  showDivider: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryRow({
  category,
  showDivider,
  isDeleting,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isIncome = category.type === 'income';
  const iconColor=CATEGORY_COLOR_OPTIONS.find((c)=>c.label===category.iconColor)?.icon
  const iconBackground=CATEGORY_COLOR_OPTIONS.find((c)=>c.label===category.iconColor)?.bg
  return (
    <View
      style={[
        styles.categoryRow,
        showDivider && styles.categoryRowDivider,
      ]}
    >
      {/* Icon circle */}
      <View
        style={[
          styles.categoryIcon,
          {
            backgroundColor:
              iconBackground ?? COLORS.primaryMuted,
          },
        ]}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons
            name={(category.iconName ?? 'ellipse-outline') as any}
            size={20}
            color={iconColor ?? COLORS.primary}
          />
        )}
      </View>

      {/* Name and type badge */}
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <View
          style={[
            styles.typePill,
            isIncome ? styles.typePillIncome : styles.typePillExpense,
          ]}
        >
          <Text
            style={[
              styles.typePillText,
              isIncome
                ? styles.typePillTextIncome
                : styles.typePillTextExpense,
            ]}
          >
            {isIncome ? 'Income' : 'Expense'}
          </Text>
        </View>
      </View>

      {/* Three-dot menu */}
      <View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuOpen((p) => !p)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        {/* Inline dropdown menu */}
        {menuOpen && (
          <View style={styles.rowMenu}>
            <TouchableOpacity
              style={styles.rowMenuItem}
              onPress={() => {
                setMenuOpen(false);
                onEdit();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pencil-outline"
                size={16}
                color={COLORS.textPrimary}
              />
              <Text style={styles.rowMenuItemText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.rowMenuDivider} />

            <TouchableOpacity
              style={styles.rowMenuItem}
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={COLORS.danger}
              />
              <Text style={[styles.rowMenuItemText, { color: COLORS.danger }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.md },

  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  // ── Count row ─────────────────────────────────────────
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  countLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  countValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // ── Empty state ───────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  // ── Category list card ────────────────────────────────
  categoriesList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },

  // ── Category row ──────────────────────────────────────
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  categoryRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryInfo: { flex: 1, gap: 4 },
  categoryName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  // ── Type pill ─────────────────────────────────────────
  typePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  typePillIncome: { backgroundColor: COLORS.primaryMuted },
  typePillExpense: { backgroundColor: COLORS.inputBackground },
  typePillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  typePillTextIncome: { color: COLORS.primary },
  typePillTextExpense: { color: COLORS.textSecondary },

  // ── Row three-dot menu ────────────────────────────────
  menuButton: {
    padding: SPACING.xs,
  },
  rowMenu: {
    position: 'absolute',
    right: 0,
    top: 32,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 120,
    zIndex: 10,
    ...SHADOWS.md,
  },
  rowMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  rowMenuItemText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  rowMenuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  bottomPadding: { height: 80 },

  // ── Modal ─────────────────────────────────────────────
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
    maxHeight: '92%',
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

  // ── Preview ───────────────────────────────────────────
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewTextBlock: { gap: SPACING.xs },
  previewName: {
    fontSize: FONT_SIZE.base,
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
  inputWrapper: {
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
  inputWrapperError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },

  // ── Type toggle ───────────────────────────────────────
  typeToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
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

  // ── Icon grid ─────────────────────────────────────────
  /**
   * 5-column grid of icon options. Each cell shows
   * the icon above its label so they are easy to scan.
   */
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconOption: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: SPACING.xs,
  },
  iconLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // ── Color row ─────────────────────────────────────────
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
  },

  // ── Save button ───────────────────────────────────────
  saveButton: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.sm,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },
});