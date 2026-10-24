
import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { syncUserData } from '@/database/services/sync';
import { supabase } from '@/database/supabase';

import { useUserStore } from '@/store';

import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
} from '@/constants';

export default function SyncAccountScreen() {
  const db = useSQLiteContext();

  const { user, setUser } = useUserStore();

  const [email, setEmail] = useState(user?.email ?? '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword]=useState('');

  const [loading, setLoading] = useState(false);

  const handleSyncAccount = async () => {
    if (!user) {
      Alert.alert(
        'No active user',
        'Please log in to your local account first.'
      );

      return;
    }

    if (user.supabaseUserId) {
      Alert.alert(
        'Account already linked',
        'This local profile already has an online account.'
      );

      return;
    }

    if (!email.trim() || !password) {
      Alert.alert(
        'Missing fields',
        'Enter your email and password.'
      );

      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Weak password',
        'Your password must contain at least 8 characters.'
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please confirm your password.'
      );

      return;
    }

    try {
      setLoading(true);

      // Create Supabase Auth account.
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              name: user.name,
            },
          },
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error(
          'Could not create your online account.'
        );
      }

      // Email confirmation may be required.
      if (!data.session) {
        Alert.alert(
          'Check your email',
          'Your online account has been created. ' +
          'Please confirm your email, then log in ' +
          'to complete synchronization.'
        );

        return;
      }

      // Link local user to Supabase Auth user.
      const linkedUser = {
        ...user,
        supabaseUserId: data.user.id,
        email: email.trim().toLowerCase(),
      };

      // Upload all existing financial data.
      await syncUserData(
        db,
        linkedUser,
        data.user.id,
        email.trim().toLowerCase()
      );

      await db.runAsync(
        `UPDATE users
         SET supabaseUserId = ?,
             email = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        data.user.id,
        email.trim().toLowerCase(),
        user.id
      );

      setUser(linkedUser);


      Alert.alert(
        'Account synchronized',
        'Your ZeeFi account is now connected to Supabase.',
        [
          {
            text: 'Continue',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Synchronization failed',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Connect your ZeeFi account
        </Text>

        <Text style={styles.description}>
          Create an online account to back up your
          financial data and access it on other devices.
          Your existing local data will be preserved.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleSyncAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            Create Account & Sync
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        Your financial data will remain available
        offline on this device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING['2xl'],
    gap: SPACING.lg,
  },

  header: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  input: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    color: COLORS.textPrimary,
  },

  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },

  footer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
