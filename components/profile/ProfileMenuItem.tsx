/**
 * ProfileMenuItem
 *
 * A single tappable row in the Profile screen's settings
 * sections. Shows an icon on the left, a label in the middle,
 * and a right chevron arrow indicating it is tappable.
 *
 * Used for items like:
 *  - Edit Profile
 *  - Security & Privacy
 *  - Manage Categories
 *  - Notification Settings
 *  - Help Center
 *  - Logout
 *
 * Props:
 *  - iconName: Ionicons icon name for the left icon
 *  - iconBackground: background color of the icon circle
 *  - iconColor: color of the icon itself
 *  - label: the menu item text
 *  - onPress: called when the row is tapped
 *  - rightElement: optional custom element replacing the chevron
 *  - destructive: if true, label shows in red (used for Logout/Delete)
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProfileMenuItemProps {
  iconName: string;
  iconBackground: string;
  iconColor: string;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

export default function ProfileMenuItem({
  iconName,
  iconBackground,
  iconColor,
  label,
  onPress,
  rightElement,
  destructive = false,
}: ProfileMenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: colored icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
        <Ionicons name={iconName as any} size={18} color={iconColor} />
      </View>

      {/* Middle: label text */}
      <Text
        style={[
          styles.label,
          destructive && { color: COLORS.danger },
        ]}
      >
        {label}
      </Text>

      {/* Right: custom element or default chevron */}
      <View style={styles.rightSlot}>
        {rightElement ?? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textMuted}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  label: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },

  rightSlot: {
    flexShrink: 0,
  },
});