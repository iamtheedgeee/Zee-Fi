/**
 * FloatingActionButton (FAB)
 *
 * The circular green plus button that floats above the screen
 * content at the bottom right. Used on Dashboard, Budget,
 * History, and Insights screens to trigger the Add Transaction
 * modal.
 *
 * It is positioned absolutely so the parent screen must have
 * position: 'relative' and enough bottom padding on its
 * ScrollView so content is not hidden behind the FAB.
 *
 * Props:
 *  - onPress: called when the button is tapped
 *  - bottom: distance from the bottom of the screen (default 24)
 *  - right: distance from the right edge (default 20)
 */

import { COLORS, SHADOWS, SPACING } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  bottom?: number;
  right?: number;
}

export default function FloatingActionButton({
  onPress,
  bottom = 24,
  right = SPACING.xl,
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { bottom, right }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={28} color={COLORS.textOnPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    /**
     * Absolutely positioned so it floats over the ScrollView
     * content regardless of scroll position.
     */
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});