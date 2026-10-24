import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { createUser } from '@/database/services/user';
import { useCategoryStore, useUserStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────
// Supported currencies the user can select from.
// Add more as needed — the id is what gets stored,
// the label is what the user sees.
// ─────────────────────────────────────────────────────────
const CURRENCIES = [
  { id: 'NGN', label: '₦  Nigerian Naira (NGN)' },
  { id: 'USD', label: '$  US Dollar (USD)' },
  { id: 'GBP', label: '£  British Pound (GBP)' },
  { id: 'EUR', label: '€  Euro (EUR)' },
  { id: 'GHS', label: '₵  Ghanaian Cedi (GHS)' },
  { id: 'KES', label: 'KSh  Kenyan Shilling (KES)' },
  { id: 'ZAR', label: 'R  South African Rand (ZAR)' },
];

// ─────────────────────────────────────────────────────────
// Form field state shape
// ─────────────────────────────────────────────────────────
interface RegisterForm {
  name: string;
  email: string;
  balance: string;
  currencyId: string;
}

// ─────────────────────────────────────────────────────────
// Validation errors shape — mirrors the form fields.
// A field's error is an empty string when valid.
// ─────────────────────────────────────────────────────────
interface FormErrors {
  name: string;
  email: string;
  balance:string;
  currencyId: string;
}

export default function RegisterScreen() {
  const db= useSQLiteContext()
  const insets = useSafeAreaInsets();
  const { setUser,setSummary } = useUserStore();
  const { seedDefaultCategories } = useCategoryStore()

  // ── Form state ──────────────────────────────────────────
  const [form, setForm] = useState<RegisterForm>({
    name: 'Raymond',
    email: 'raymondanyanwu17@gmail.com',
    balance: '0',
    currencyId: 'NGN', 
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    email: '',
    balance:'',
    currencyId: '',
  });

  // ── UI state ────────────────────────────────────────────
  // Controls whether the currency dropdown is open
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  // Controls whether we are waiting for an async operation
  // (e.g. a future network call to Supabase)
  const [isLoading, setIsLoading] = useState(false);

  // ── Derived values ──────────────────────────────────────
  // Find the full currency object for the currently selected id
  const selectedCurrency = CURRENCIES.find((c) => c.id === form.currencyId);

  // ── Helpers ─────────────────────────────────────────────

  /**
   * Updates a single field in the form state.
   * Also clears the error for that field as soon as
   * the user starts typing — gives immediate positive feedback.
   */
  function updateField(field: keyof RegisterForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  /**
   * Validates all form fields and populates the errors state.
   * Returns true if the form is valid, false otherwise.
   * Called before attempting registration.
   */
  function validate(): boolean {
    const newErrors: FormErrors = { name: '', email: '', currencyId: '', balance:'' };
    let isValid = true;

    // Name: must not be empty and must be at least 2 characters
    if (!form.name.trim()) {
      newErrors.name = 'Please enter your full name.';
      isValid = false;
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
      isValid = false;
    }

    // Email: must not be empty and must match basic email pattern
    if (!form.email.trim()) {
      newErrors.email = 'Please enter your email address.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }
    const parsed=parseFloat(form.balance.trim())
    if (isNaN(parsed) || parsed < 0) {
      newErrors.balance='Please enter a valid  amount.'
      isValid = false;
    } 
    // Currency: should always be set since we have a default,
    // but guard against it just in case
    if (!form.currencyId) {
      newErrors.currencyId = 'Please select a currency.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  async function handleRegister() {
    Keyboard.dismiss();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const user= await createUser(db,
        form.name.trim(),
        form.email.trim(),
        parseFloat(form.balance.trim()),
        form.currencyId
      );
      await seedDefaultCategories(db, user.id);
      setUser(user);
      await setSummary(db)

      router.replace('/(tabs)');

    } catch (error) {
      // TODO: Display the actual error message from Supabase/auth here
      console.error('Registration error:', error);
      setErrors((prev) => ({
        ...prev,
        email: 'Something went wrong. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/*
       * Tapping outside any input dismisses the keyboard
       * and closes the currency dropdown.
       */}
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setCurrencyDropdownOpen(false);
        }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo and heading ──────────────────────── */}
          <View style={styles.headerSection}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>Z</Text>
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Start taking control of your finances today.
            </Text>
          </View>

          {/* ── Form card ────────────────────────────── */}
          <View style={styles.formCard}>

            {/* ── Full Name ──────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.name ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={errors.name ? COLORS.danger : COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(v) => updateField('name', v)}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* ── Email ─────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={errors.email ? COLORS.danger : COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => updateField('email', v)}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/*----Balance ------------------- */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Balance</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="dice"
                  size={18}
                  color={errors.email ? COLORS.danger : COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={form.balance}
                  onChangeText={(v) => updateField('balance', v)}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>
              {errors.balance ? (
                <Text style={styles.errorText}>{errors.balance}</Text>
              ) : null}
            </View>

            {/* ── Currency ──────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Primary Currency</Text>
              <Text style={styles.fieldHint}>
                Used for displaying all your financial data.
              </Text>

              {/*
               * Tapping the selector opens the dropdown list below.
               * stopPropagation prevents the TouchableWithoutFeedback
               * on the ScrollView from immediately closing it.
               */}
              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  styles.selectorWrapper,
                  errors.currencyId ? styles.inputWrapperError : null,
                  currencyDropdownOpen ? styles.inputWrapperFocused : null,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  Keyboard.dismiss();
                  setCurrencyDropdownOpen((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.selectorText,
                    !selectedCurrency && styles.selectorPlaceholder,
                  ]}
                >
                  {selectedCurrency?.label ?? 'Select a currency'}
                </Text>
                <Ionicons
                  name={currencyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {/* Currency dropdown list */}
              {currencyDropdownOpen && (
                <View style={styles.dropdown}>
                  {CURRENCIES.map((currency, index) => {
                    const isSelected = currency.id === form.currencyId;
                    const isLast = index === CURRENCIES.length - 1;
                    return (
                      <TouchableOpacity
                        key={currency.id}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                          isLast && styles.dropdownItemLast,
                        ]}
                        onPress={() => {
                          updateField('currencyId', currency.id);
                          setCurrencyDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {currency.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {errors.currencyId ? (
                <Text style={styles.errorText}>{errors.currencyId}</Text>
              ) : null}
            </View>

          </View>

          {/* ── Register button ───────────────────────── */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              isLoading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.registerButtonText}>Creating account...</Text>
            ) : (
              <>
                <Text style={styles.registerButtonText}>Create Account</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.textOnPrimary}
                />
              </>
            )}
          </TouchableOpacity>

          {/* ── Login link ────────────────────────────── */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom safe area padding */}
          <View style={{ height: insets.bottom + SPACING.xl }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },

  // ── Header ────────────────────────────────────────────
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
    gap: SPACING.sm,
  },

  logoMark: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },

  logoText: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ── Form card ─────────────────────────────────────────
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
    ...SHADOWS.sm,
  },

  // ── Field group ───────────────────────────────────────
  /**
   * Wraps label + input + error message for one field.
   * Using a gap inside the card rather than margin on
   * individual elements keeps spacing consistent.
   */
  fieldGroup: {
    gap: SPACING.xs,
  },

  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  fieldHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: -2,
  },

  // ── Input wrapper ─────────────────────────────────────
  /**
   * The outer container for each input. Applies the
   * border and background. The border color changes
   * when there is a validation error.
   */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 50,
  },

  inputWrapperError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
  },

  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },

  inputIcon: {
    marginRight: SPACING.sm,
    flexShrink: 0,
  },

  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    height: '100%',
  },

  // ── Currency selector ─────────────────────────────────
  selectorWrapper: {
    justifyContent: 'space-between',
  },

  selectorText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },

  selectorPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.regular,
  },

  // ── Dropdown ──────────────────────────────────────────
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: SPACING.xs,
    ...SHADOWS.md,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dropdownItemLast: {
    borderBottomWidth: 0,
  },

  dropdownItemSelected: {
    backgroundColor: COLORS.primaryMuted,
  },

  dropdownItemText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },

  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semiBold,
  },

  // ── Error text ────────────────────────────────────────
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginTop: 2,
  },

  // ── Register button ───────────────────────────────────
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },

  registerButtonDisabled: {
    opacity: 0.6,
  },

  registerButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },

  // ── Login link row ────────────────────────────────────
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },

  loginText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  loginLink: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
  },
});