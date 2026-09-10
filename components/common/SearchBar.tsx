/**
 * SearchBar
 *
 * A styled text input with a search icon on the left and an
 * optional filter icon button on the right.
 *
 * Used on:
 *  - Transaction History screen
 *  - Manage Categories screen
 *
 * Props:
 *  - value: current text input value
 *  - onChangeText: called when the user types
 *  - placeholder: input placeholder text
 *  - showFilter: whether to show the filter icon button (default false)
 *  - onFilterPress: called when the filter button is tapped
 */

import { COLORS, FONT_SIZE, RADIUS, SHADOWS, SPACING } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilterPress?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  showFilter = false,
  onFilterPress,
}: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      {/* Search input with icon */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Optional filter button to the right of the search bar */}
      {showFilter && (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Row containing the input and optional filter button */
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  /**
   * The input field container. flex: 1 makes it fill
   * available space so the filter button stays on the right.
   */
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    ...SHADOWS.sm,
  },

  searchIcon: {
    marginRight: SPACING.sm,
  },

  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },

  /** Square button to the right of the search input */
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
});