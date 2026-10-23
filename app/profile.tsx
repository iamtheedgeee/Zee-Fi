//Profile screen
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from 'react-native';

import { importTransactionsFromCsv } from '@/database/services/importTransactions';
import { useBudgetStore, useCategoryStore, useInsightStore, useTransactionStore } from '@/store';

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const {user}=useUserStore() 
  const db = useSQLiteContext();
  const {setTransactions} = useTransactionStore()
  const {reset:resetBudget}=useBudgetStore()
  const {reset:resetCategory}=useCategoryStore()
  const {reset:resetTransaction}=useTransactionStore()
  const {reset:resetInsight}=useInsightStore()
  const {clearUser:resetUser}=useUserStore()
  const {setBalance,setSummary} = useUserStore()

  const resetAll=()=>{
    resetBudget()
    resetCategory()
    resetInsight()
    resetTransaction()
    resetUser(db)
  }
  
  const handleImportTransactions = async () => {
    if (!user) {
      Alert.alert('Error', 'No user is currently logged in.');
      return;
    }

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'public.comma-separated-values-text',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled) return;

      const file = picked.assets[0];

      if (!file.name.toLowerCase().endsWith('.csv')) {
        Alert.alert('Invalid file', 'Please select a CSV file.');
        return;
      }

      setIsImporting(true);

      // Give React Native time to render the modal before processing.
      await new Promise<void>(resolve => setTimeout(resolve, 100));

      let result;

      try {
        const csvContent = await FileSystem.readAsStringAsync(file.uri);

        result = await importTransactionsFromCsv(
          db,
          user.id,
          csvContent,
        );

        // Refresh Zustand only after the import service finishes.
        await setTransactions(db, user.id);

        const userRow = await db.getFirstAsync<{ balance: number }>(
          'SELECT balance FROM users WHERE id = ?;',
          user.id,
        );

        if (userRow) {
          setBalance(userRow.balance);
        }

        await setSummary(db);
      } finally {
        setIsImporting(false);
      }

      const errorPreview = result.errors
        .slice(0, 5)
        .map(error => `Row ${error.row}: ${error.message}`)
        .join('\n');

      const remainingErrors = result.errors.length - 5;

      const errorText = result.errors.length
        ? `\n\nIssues:\n${errorPreview}${
            remainingErrors > 0
              ? `\n...and ${remainingErrors} more.`
              : ''
          }`
        : '';

      Alert.alert(
        'Import complete',
        `Imported: ${result.imported}\nSkipped: ${result.skipped}${errorText}`,
      );
    } catch (error) {
      setIsImporting(false);

      Alert.alert(
        'Import failed',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.',
      );
    }
};

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

            }}
          />      
          <ProfileMenuItem
            iconName="document-attach-outline"
            iconBackground={COLORS.primaryMuted}
            iconColor={COLORS.primary}
            label="Import Transactions"
            onPress={handleImportTransactions}
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
              //show about screen
            }}
          />

          <ProfileMenuItem
            iconName="log-out-outline"
            iconBackground="#FFE4E4"
            iconColor={COLORS.danger}
            label="Logout"
            destructive
            onPress={() => {
              resetAll()
              router.replace('/(auth)/register');
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
      <Modal
        visible={isImporting}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <View style={styles.importOverlay}>
          <View style={styles.importCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />

            <Text style={styles.importTitle}>
              Importing transactions
            </Text>

            <Text style={styles.importDescription}>
              Please wait while your transactions are being
              processed. This may take a moment.
            </Text>
          </View>
        </View>
      </Modal>
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
  importOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: SPACING.lg,
},
importCard: {
  width: '100%',
  maxWidth: 320,
  backgroundColor: COLORS.background,
  borderRadius: RADIUS.lg,
  padding: SPACING.xl,
  alignItems: 'center',
  gap: SPACING.md,
},

importTitle: {
  fontSize: FONT_SIZE.lg,
  fontWeight: FONT_WEIGHT.semiBold,
  textAlign: 'center',
},

importDescription: {
  fontSize: FONT_SIZE.sm,
  color: COLORS.textSecondary,
  textAlign: 'center',
  lineHeight: 21,
},
});