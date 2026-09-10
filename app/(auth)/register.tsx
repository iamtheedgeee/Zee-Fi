/**
 * Register Screen
 *
 * Stub screen for the registration flow.
 *
 * TODO: Design and implement the full registration UI.
 * TODO: Connect to Supabase auth in a later phase.
 */

import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Register Screen</Text>
      <Text style={styles.note}>
        TODO: Implement registration UI in a later phase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.md,
  },

  text: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
  },

  note: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});