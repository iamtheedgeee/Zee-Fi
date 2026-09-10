/**
 * SectionHeader
 *
 * A row containing a bold section title on the left and an
 * optional tappable action link on the right (e.g. "View All",
 * "Explore All").
 *
 * Used throughout the Dashboard and Insights screens to
 * introduce each content section.
 *
 * Props:
 *  - title: the section heading text
 *  - actionLabel: text for the right-side link (optional)
 *  - onActionPress: callback when the right-side link is tapped
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export default function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {actionLabel ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  actionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },
});