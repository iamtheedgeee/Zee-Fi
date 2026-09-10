/**
 * ProfileSectionHeader
 *
 * A small uppercase section label used to group related
 * menu items in the Profile screen.
 *
 * Examples from the PDF:
 *  - ACCOUNT MANAGEMENT
 *  - APP PREFERENCES
 *  - SUPPORT & LEGAL
 *
 * Props:
 *  - title: the section group label text
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface ProfileSectionHeaderProps {
  title: string;
}

export default function ProfileSectionHeader({
  title,
}: ProfileSectionHeaderProps) {
  return <Text style={styles.text}>{title}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textMuted,
    /**
     * letterSpacing adds visual breathing room between
     * letters which is a common convention for uppercase
     * section labels in mobile UI.
     */
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
});