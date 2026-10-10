import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '@/components/common/ScreenHeader';
import ProfileMenuItem from '@/components/profile/ProfileMenuItem';
import ProfileSectionHeader from '@/components/profile/ProfileSectionHeader';

import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { useUserStore } from '@/store';

export default function ProfileScreen() {
  /**
   * Local state for the notification toggle in the
   * APP PREFERENCES section.
   * TODO: Persist this preference to AsyncStorage or SQLite.
   */
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const {user}=useUserStore()
  /**
   * Format the member since date into a readable string.
   * e.g. "2023-01-15" → "JAN 2023"
   */
  const memberSinceFormatted = new Date(
    user!.createdAt
  ).toLocaleDateString('en-NG', {
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────── */}
      <ScreenHeader
        title="ZeeFi AI"
        subtitle="Profile"
        showNotification={false}
        showAvatar={false}
      />

      {/* ── Scrollable Content ───────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ────────────────────────── */}
        <View style={styles.profileCard}>
          {/* Large avatar circle */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Member since badge */}
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>
              MEMBER SINCE {memberSinceFormatted}
            </Text>
          </View>
        </View>

        {/* ── Account Management Section ───────────── */}
        <View style={styles.menuCard}>
          <ProfileSectionHeader title="Account Management" />

          <ProfileMenuItem
            iconName="person-outline"
            iconBackground={COLORS.primaryMuted}
            iconColor={COLORS.primary}
            label="Edit Profile"
            onPress={() => {
              // TODO: Navigate to Edit Profile screen
            }}
          />

          {/*<ProfileMenuItem
            iconName="shield-outline"
            iconBackground="#EDE9FE"
            iconColor="#7C3AED"
            label="Security & Privacy"
            onPress={() => {
              // TODO: Navigate to Security screen
            }}
          />

          <ProfileMenuItem
            iconName="card-outline"
            iconBackground={COLORS.categoryEntertainment}
            iconColor={COLORS.categoryEntertainmentIcon}
            label="Payment Methods"
            onPress={() => {
              // TODO: Navigate to Payment Methods screen
            }}
          />*/}

          <ProfileMenuItem
            iconName="grid-outline"
            iconBackground={COLORS.categoryGroceries}
            iconColor={COLORS.categoryGroceriesIcon}
            label="Manage Categories"
            onPress={() => router.push("/categories")}
          />

          
        </View>

        {/* ── App Preferences Section ──────────────── */}
        <View style={styles.menuCard}>
          <ProfileSectionHeader title="App Preferences" />

          <ProfileMenuItem
            iconName="color-palette-outline"
            iconBackground={COLORS.categoryShopping}
            iconColor={COLORS.categoryShoppingIcon}
            label="Theme"
            onPress={() => {
              // TODO: Open theme selector
            }}
            rightElement={
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>System Default</Text>
              </View>
            }
          />

          <ProfileMenuItem
            iconName="notifications-outline"
            iconBackground={COLORS.categoryHealth}
            iconColor={COLORS.categoryHealthIcon}
            label="Notification Settings"
            onPress={() => {}}
            rightElement={
              /*
               * The Switch component is used directly as the
               * right element for the notifications row.
               * This matches the toggle shown in the PDF.
               */
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primaryLight,
                }}
                thumbColor={
                  notificationsEnabled ? COLORS.primary : COLORS.textMuted
                }
              />
            }
          />

          <ProfileMenuItem
            iconName="download-outline"
            iconBackground={COLORS.categoryTravel}
            iconColor={COLORS.categoryTravelIcon}
            label="Data Export"
            onPress={() => {
              // TODO: Implement CSV/PDF export
            }}
          />
        </View>

        {/* ── Support & Legal Section ──────────────── */}
        <View style={styles.menuCard}>
          <ProfileSectionHeader title="Support & Legal" />

          <ProfileMenuItem
            iconName="help-circle-outline"
            iconBackground={COLORS.primaryMuted}
            iconColor={COLORS.primary}
            label="Help Center"
            onPress={() => {
              // TODO: Open help center
            }}
          />

          <ProfileMenuItem
            iconName="information-circle-outline"
            iconBackground={COLORS.categoryGroceries}
            iconColor={COLORS.categoryGroceriesIcon}
            label="About ZeeFi AI"
            onPress={() => {
              // TODO: Show about screen
            }}
          />

          <ProfileMenuItem
            iconName="log-out-outline"
            iconBackground="#FFE4E4"
            iconColor={COLORS.danger}
            label="Logout"
            destructive
            onPress={() => {
              // TODO: Clear auth state and navigate to login
              router.replace('/(auth)/login');
            }}
          />
        </View>

        {/* ── Delete Account ───────────────────────── */}
        {/*
         * Destructive action placed at the very bottom
         * and visually separated from other options to
         * reduce the chance of accidental taps.
         */}
        <View style={styles.deleteSection}>
          <ProfileMenuItem
            iconName="trash-outline"
            iconBackground="#FFE4E4"
            iconColor={COLORS.danger}
            label="Delete Account"
            destructive
            onPress={() => {
              // TODO: Show confirmation dialog before deleting
              console.log('TODO: Confirm and delete account');
            }}
          />
          <Text style={styles.deleteSubtext}>
            Deletes your account and all your financial data from ZeeFi.
          </Text>
        </View>

        {/* ── Footer ──────────────────────────────── */}
        <Text style={styles.footer}>
          ZeeFi AI • Version 1.0.0
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

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

  // ── Profile Card ────────────────────────────────
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },

  /**
   * Large avatar circle on the profile screen.
   * Larger than the header avatar (80px vs 36px).
   */
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },

  avatarText: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  userName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  userEmail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  memberBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },

  memberBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // ── Menu Cards ──────────────────────────────────
  /**
   * Each settings section is wrapped in its own white
   * card to visually group related items together.
   */
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.sm,
  },

  // ── Theme Badge ─────────────────────────────────
  themeBadge: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },

  themeBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Delete Section ──────────────────────────────
  deleteSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.sm,
  },

  deleteSubtext: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    paddingBottom: SPACING.sm,
    lineHeight: FONT_SIZE.xs * 1.6,
  },

  // ── Footer ──────────────────────────────────────
  footer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },

  bottomPadding: {
    height: SPACING['2xl'],
  },
});