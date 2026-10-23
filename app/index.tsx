import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { useAppInit } from '@/hooks/useAppInit';
import { useUserStore } from '@/store';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Root index screen — shown briefly on every app launch.
 *
 * Responsibilities:
 *  1. Show the ZeeFi logo with a subtle entrance animation
 *  2. Query the local SQLite database to check if a user exists
 *  3. Redirect to the appropriate screen:
 *     - User found   → /(tabs)/   (main app)
 *     - No user      → /(auth)/register
 *
 * This screen should never stay visible for more than ~1.5 seconds.
 * The minimum display time is intentional — it prevents a jarring
 * flash if the DB check resolves instantly.
 *
 * TODO: Replace checkForUser() with your real SQLite query
 * once your database layer is set up.
 */
export default function SplashScreen() {

  // ── Animation values ──────────────────────────────────
  /**
   * logoOpacity: fades the logo in from 0 to 1
   * logoScale: grows the logo from 0.7 to 1 (spring-like feel)
   * taglineOpacity: fades the tagline in slightly after the logo
   * dotsOpacity: pulses the loading dots at the bottom
   */
  /**
   * Kick off the database check and store population.
   * This runs once when the component mounts.
   */
  useAppInit();
  const {user,isLoading}=useUserStore();
  
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // ── Step 1: Animate the logo in ─────────────────────
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ── Step 2: Fade in the tagline after logo lands ──
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    // ── Step 3: Pulse the loading dots continuously ──────
    const pulseDots = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotsOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseDots.start();

   
    return () => {
      pulseDots.stop();
    };
  }, []);
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/register');
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [isLoading, user]);

  return (
    <View style={styles.screen}>

      {/* ── Logo mark ─────────────────────────────────── */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Outer glow ring — purely decorative */}
        <View style={styles.logoGlow} />

        {/* Main logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>Z</Text>
        </View>

        {/* App name below the mark */}
        <Text style={styles.appName}>ZeeFi</Text>
      </Animated.View>

      {/* ── Tagline ───────────────────────────────────── */}
      <Animated.Text
        style={[styles.tagline, { opacity: taglineOpacity }]}
      >
        Your intelligent finance companion
      </Animated.Text>

      {/* ── Loading dots ──────────────────────────────── */}
      <Animated.View
        style={[styles.dotsContainer, { opacity: dotsOpacity }]}
      >
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>

    </View>
  );
}


async function checkForUser(): Promise<boolean> {
  try {
    
    return false;

  } catch (error) {
    console.warn('Auth check failed, defaulting to register:', error);
    return false;
  }
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },

  // ── Logo ──────────────────────────────────────────────
  logoContainer: {
    alignItems: 'center',
    gap: SPACING.md,
  },

  /**
   * The glow ring sits behind the logo mark using
   * negative margin to overlap. It is a larger, more
   * transparent circle that gives the logo a soft
   * illuminated appearance against the green background.
   */
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    // Centers the glow behind the 80px logo mark
    top: -20,
    left: -20,
  },

  logoMark: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },

  logoLetter: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },

  appName: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
    letterSpacing: 1,
  },

  // ── Tagline ───────────────────────────────────────────
  tagline: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Loading dots ──────────────────────────────────────
  /**
   * Three small dots that pulse together to indicate
   * the app is doing something in the background.
   * Positioned near the bottom of the screen.
   */
  dotsContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },

});