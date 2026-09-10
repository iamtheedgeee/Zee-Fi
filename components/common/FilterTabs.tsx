/**
 * FilterTabs
 *
 * A horizontal row of pill-shaped tab buttons used to filter
 * a list between All, Income, and Expense views.
 *
 * Used on:
 *  - Transaction History screen
 *  - Manage Categories screen
 *
 * The active tab gets a filled green background while
 * inactive tabs are plain with grey text.
 *
 * Props:
 *  - tabs: array of tab labels to display
 *  - activeTab: the currently selected tab label
 *  - onTabPress: called with the label when a tab is tapped
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function FilterTabs({
  tabs,
  activeTab,
  onTabPress,
}: FilterTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabPress(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.full,
    padding: 4,
    alignSelf: 'flex-start',
  },

  tab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },

  /** Active tab gets a solid green background */
  activeTab: {
    backgroundColor: COLORS.primary,
  },

  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },

  activeTabText: {
    color: COLORS.textOnPrimary,
  },
});