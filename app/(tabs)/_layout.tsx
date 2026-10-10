/**
 * Tab Navigator Layout
 *
 * Defines the bottom tab bar and the four main screens
 * of the ZeeFi application:
 *  1. Dashboard (index)
 *  2. Budget
 *  3. History
 *  4. Profile
 *
 * The Insights screen is intentionally NOT a tab.
 * It is pushed as a stack screen from the Dashboard
 * so it gets a back button and does not clutter the
 * tab bar. This keeps the navbar clean at 4 items.
 *
 * Tab icons use Ionicons from @expo/vector-icons which
 * is included in all Expo projects without extra install.
 *
 * The custom tab bar style matches the PDF design:
 *  - White background
 *  - No top border line
 *  - Deep green active color
 *  - Grey inactive color
 *  - Slight shadow above the bar
 */

import { COLORS, SHADOWS, SPACING } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * Helper component that renders a tab bar icon.
 * Separating this keeps the screenOptions callback clean.
 */
function TabIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={name as any} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        /**
         * Hide the default Expo Router header on all tab
         * screens. Each screen uses the custom ScreenHeader
         * component instead.
         */
        headerShown: false,

        /**
         * Tab bar appearance matching the PDF design.
         */
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,

        /**
         * Label styling — small text below each icon.
         */
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* ── Tab 1: Dashboard ───────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'grid' : 'grid-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Tab 2: Budget ──────────────────────── */}
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'wallet' : 'wallet-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Tab 3: History ─────────────────────── */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'time' : 'time-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Tab 4: Profile ─────────────────────── */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'eye' : 'eye-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBarBackground,
    /**
     * Remove the default grey border line above the tab bar
     * that React Navigation adds by default.
     */
    borderTopWidth: 0,
    /**
     * Add a subtle shadow above the tab bar to visually
     * separate it from the screen content.
     */
    ...SHADOWS.md,
    /**
     * Extra bottom padding on iOS to account for the
     * home indicator safe area at the bottom of the screen.
     * On Android this is not needed.
     */
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
    paddingTop: SPACING.sm,
    height: Platform.OS === 'ios' ? 84 : 64,
  },

  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  /**
   * Wrapper around each tab icon. When a tab is active,
   * a subtle green tinted background circle appears
   * behind the icon to highlight the active state.
   * This matches the pill/indicator style in the PDF.
   */
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  iconWrapperActive: {
    backgroundColor: COLORS.primaryMuted,
  },
});