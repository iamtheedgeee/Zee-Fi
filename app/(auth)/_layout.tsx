/**
 * Auth Layout
 *
 * A simple Stack navigator wrapping the authentication
 * screens (login and register).
 *
 * Auth screens are kept in a separate route group so
 * that in a later phase we can add logic to redirect
 * authenticated users away from this group and toward
 * the main tabs.
 *
 * TODO: Add authentication guard here in a later phase.
 * When a user is logged in, redirect them to /(tabs)/
 * instead of showing the login screen.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}