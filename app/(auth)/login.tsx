/**
 * Login Screen
 *
 * Stub screen for the login flow.
 *
 * The full UI design for auth screens was not included
 * in the PDF wireframes so this is a minimal placeholder
 * that allows navigation to work correctly.
 *
 * TODO: Design and implement the full login UI.
 * TODO: Connect to Supabase auth in a later phase.
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      {/* App logo area */}
      <View style={styles.logoSection}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.appName}>ZeeFi</Text>
        <Text style={styles.tagline}>Your intelligent finance companion</Text>
      </View>

      {/*
       * Skip auth button for development purposes.
       * Navigates directly to the main app without
       * requiring real credentials.
       *
       * TODO: Remove this button and replace with real
       * email/password form when auth is implemented.
       */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace('/')}
        activeOpacity={0.85}
      >
        <Text style={styles.skipButtonText}>
          Enter App (Dev Mode — Skip Login)
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Authentication UI will be implemented in a later phase.
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
    gap: SPACING.xl,
  },

  logoSection: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING['2xl'],
  },

  logoMark: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  appName: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  tagline: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  skipButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  skipButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },

  note: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});