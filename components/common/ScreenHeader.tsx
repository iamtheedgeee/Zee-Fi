/**
 * ScreenHeader
 *
 * The top header bar used across all main screens in ZeeFi.
 * Shows the app logo/name on the left and action icons
 * (notification bell and user avatar) on the right.
 *
 * This is extracted as a reusable component because the same
 * header structure appears on Dashboard, Insights, Budget,
 * and History screens with only minor content differences.
 *
 * Props:
 *  - title: the screen title or app name shown on the left
 *  - subtitle: optional smaller text below the title
 *  - showNotification: whether to show the bell icon (default true)
 *  - showAvatar: whether to show the user avatar (default true)
 *  - onNotificationPress: callback for bell icon tap
 *  - onAvatarPress: callback for avatar tap
 */
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS, SPACING } from '@/constants';
import { useUserStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showNotification?: boolean;
  showAvatar?: boolean;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  /** Optional: initials to display inside the avatar circle */
  avatarInitials?: string;
}

export default function ScreenHeader({
  title,
  subtitle,
  showNotification = true,
  showAvatar = true,
  onNotificationPress,
  onAvatarPress=(()=>router.push('/profile')),
}: ScreenHeaderProps) {
  // Derive avatar initials
  const {user}=useUserStore()
  const avatarInitials = user?.name
   .split(' ')
   .map((n:string) => n[0])
   .join('') ?? '?';
   const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      {/* Left side: app logo mark and title/subtitle */}
      <TouchableOpacity
        onPress={()=>router.push('/(tabs)')}
        activeOpacity={0.7}
        >
      <View style={styles.leftSection}>
        {/* Small green logo mark — approximated from PDF */}
        <View style={styles.logoMark}>
          <Ionicons name="leaf" size={14} color={COLORS.textOnPrimary} />
        </View>
        
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>
        
      </View>
      </TouchableOpacity>

      {/* Right side: notification bell and avatar */}
      <View style={styles.rightSection}>
        {showNotification && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.textSecondary}
            />
            {/* Notification badge dot */}
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        )}

        {showAvatar && (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onAvatarPress}
            activeOpacity={0.7}
          >
            {/*
             * No real image asset yet — showing initials inside
             * a colored circle as a fallback.
             * TODO: Replace with <Image> when real avatar is available.
             */}
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  /** Small square green logo mark in the top left */
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleBlock: {
    flexDirection: 'column',
  },

  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  /** Wrapper for the notification bell icon */
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  /**
   * Small red dot overlaid on the bell icon to indicate
   * unread notifications. Positioned absolutely in the
   * top-right corner of the icon button.
   */
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },

  /** Circular avatar button showing user initials */
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },
});