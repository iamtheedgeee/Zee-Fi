/**
 * Manage Categories Screen
 *
 * Pushed from the Profile screen via the "Manage Categories"
 * menu item. Allows users to view, search, and filter their
 * transaction categories.
 *
 * The native Stack header shows "Manage Categories" with a
 * back arrow automatically from the root layout configuration.
 * We do NOT render a ScreenHeader here.
 *
 * Sections:
 *  1. Page subtitle
 *  2. Search bar
 *  3. All / Expense / Income filter tabs
 *  4. Category count label
 *  5. Category list
 *  6. FloatingActionButton — add new category
 *
 * Each category row shows:
 *  - Icon circle
 *  - Category name
 *  - Type badge (Expense/Income)
 *  - Three-dot menu button (stub)
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import FilterTabs from '@/components/common/FilterTabs';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import SearchBar from '@/components/common/SearchBar';

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { mockCategories } from '@/data/mockCategories';
import { Category } from '@/types';

const FILTER_TABS = ['All', 'Expense', 'Income'];

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  /**
   * Filter categories based on search query and type filter.
   * Same pattern as the History screen transaction filtering.
   */
  const filteredCategories = useMemo(() => {
    let filtered = mockCategories;

    if (activeFilter === 'Expense') {
      filtered = filtered.filter((c) => c.type === 'expense');
    } else if (activeFilter === 'Income') {
      filtered = filtered.filter((c) => c.type === 'income');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, activeFilter]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page Subtitle ────────────────────────── */}
        <Text style={styles.subtitle}>
          Organize your transactions with personalized labels
          to track where your money goes.
        </Text>

        {/* ── Search Bar ──────────────────────────── */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search categories..."
        />

        {/* ── Filter Tabs ─────────────────────────── */}
        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />

        {/* ── Category Count ───────────────────────── */}
        <View style={styles.countRow}>
          <Text style={styles.countLabel}>ALL CATEGORIES</Text>
          <Text style={styles.countValue}>
            {filteredCategories.length} ITEMS
          </Text>
        </View>

        {/* ── Category List ────────────────────────── */}
        <View style={styles.categoriesList}>
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No categories found.
              </Text>
            </View>
          ) : (
            filteredCategories.map((category, index) => (
              <CategoryRow
                key={category.id}
                category={category}
                showDivider={index < filteredCategories.length - 1}
              />
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ── Floating Action Button ───────────────── */}
      <FloatingActionButton
        onPress={() => {
          // TODO: Open Add Category modal/sheet
          console.log('TODO: Open Add Category modal');
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-component: CategoryRow
// ─────────────────────────────────────────────────────────

/**
 * CategoryRow
 *
 * A single row in the categories list showing the category
 * icon, name, type badge, and a three-dot options menu.
 *
 * Defined locally because it is only used in this screen
 * and does not need to be shared across the app.
 *
 * Props:
 *  - category: the Category object to display
 *  - showDivider: whether to render a bottom divider line
 */
interface CategoryRowProps {
  category: Category;
  showDivider: boolean;
}

function CategoryRow({ category, showDivider }: CategoryRowProps) {
  const isIncome = category.type === 'income';

  return (
    <View
      style={[
        styles.categoryRow,
        showDivider && styles.categoryRowDivider,
      ]}
    >
      {/* Category icon circle */}
      <View
        style={[
          styles.categoryIcon,
          { backgroundColor: category.iconBackground },
        ]}
      >
        <Ionicons
          name={category.iconName as any}
          size={20}
          color={category.iconColor}
        />
      </View>

      {/* Category name and type badge */}
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isIncome
                ? COLORS.primaryMuted
                : COLORS.inputBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              {
                color: isIncome
                  ? COLORS.primary
                  : COLORS.textSecondary,
              },
            ]}
          >
            {isIncome ? 'Income' : 'Expense'}
          </Text>
        </View>
      </View>

      {/* Three-dot menu button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          // TODO: Show options menu (Edit, Delete)
          console.log('TODO: Show options for', category.name);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  // ── Subtitle ────────────────────────────────────
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  // ── Count Row ───────────────────────────────────
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

  // ── Categories List Card ─────────────────────────
  categoriesList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },

  // ── Category Row ────────────────────────────────
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

  categoryInfo: {
    flex: 1,
    gap: 4,
  },

  categoryName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },

  typeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },

  menuButton: {
    flexShrink: 0,
    padding: SPACING.xs,
  },

  // ── Empty State ─────────────────────────────────
  emptyState: {
    padding: SPACING['3xl'],
    alignItems: 'center',
  },

  emptyStateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },

  bottomPadding: {
    height: 80,
  },
});