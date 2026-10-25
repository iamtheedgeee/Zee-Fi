
import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { restoreOnlineData } from '@/database/services/sync';
import { supabase } from '@/database/supabase';

import {
  useBudgetStore,
  useCategoryStore,
  useTransactionStore,
  useUserStore,
} from '@/store';

import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
} from '@/constants';
import { setLoggedIn } from '@/database/services/auth';

export default function LoginScreen() {
  const db = useSQLiteContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setSummary } = useUserStore();

  const { setTransactions } =
    useTransactionStore();

  const { setCategories } =
    useCategoryStore();

  const { setBudgets } =
    useBudgetStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing fields',
        'Enter your email and password.'
      );

      return;
    }

    try {
      setLoading(true);

      // 1. Authenticate with Supabase.
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error(
          'Could not authenticate user.'
        );
      }

      // 2. Restore remote data into SQLite.
      const user = await restoreOnlineData(
        db,
        data.user.id
      );
      await setLoggedIn(db,user.id,true)
      // 3. Load Zustand stores.
      await Promise.all([
        setTransactions(db, user.id),
        setCategories(db, user.id),
        setBudgets(db, user.id),
      ]);

      setUser(user);

      await setSummary(db);

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Login failed',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
            }}
    >
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>Z</Text>
        </View>

        <Text style={styles.appName}>
          ZeeFi
        </Text>

        <Text style={styles.tagline}>
          Your intelligent finance companion
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

      <TouchableOpacity
        style={[
          styles.loginButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/(auth)/register')
        }
      >
        <Text style={styles.registerText}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
  
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.lg,
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

  input: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    color: COLORS.textPrimary,
  },

  loginButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },

  registerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
