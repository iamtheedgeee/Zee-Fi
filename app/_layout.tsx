/**
 * Root Layout
 *
 * This is the entry point for the entire Expo Router
 * navigation tree. Every screen in the app is a descendant
 * of this layout.
 *
 * Responsibilities:
 *  1. Import global CSS (NativeWind) — NOT applicable here
 *     since we are using StyleSheet only.
 *  2. Set up the root Stack navigator that contains both
 *     the auth screens and the main tab screens.
 *  3. Configure the status bar appearance globally.
 *  4. Set default Stack screen options that apply to any
 *     screen pushed on top of the tab navigator, such as
 *     the Insights screen and Categories screen.
 *
 * The Stack here does NOT show a visible header on the
 * tab screens because each tab screen manages its own
 * header via the ScreenHeader component. The Stack header
 * is only shown on screens pushed on top of the tabs
 * like Insights and Categories.
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      {/*
       * StatusBar set to dark content so icons and time
       * are visible against the light app background.
       */}
      <StatusBar style="dark" backgroundColor={COLORS.surface} />

      <Stack
        screenOptions={{
          /**
           * Default header style for screens pushed on top
           * of the tab navigator (Insights, Categories).
           * Tab screens override headerShown to false
           * individually since they use custom ScreenHeader.
           */
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: {
            fontSize: FONT_SIZE.base,
            fontWeight: FONT_WEIGHT.semiBold,
          },
          /**
           * Removes the shadow/border line under the
           * native header bar.
           */
          headerShadowVisible: false,
          /**
           * Slides screens in from the right on Android
           * which matches standard mobile navigation patterns.
           */
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {/*
         * The (tabs) group contains all bottom tab screens.
         * headerShown: false here because the tabs layout
         * manages its own header and each screen has a
         * custom ScreenHeader component.
         */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        {/*
         * The (auth) group contains login and register screens.
         * headerShown: false because auth screens have their
         * own custom headers.
         */}
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false }}
        />

        {/*
         * Insights is pushed on top of the tab navigator
         * as a full screen, not a tab itself.
         * The native back button appears automatically.
         */}
        <Stack.Screen
          name="insights"
          options={{
            title: 'Financial Insights',
            headerShown: true,
          }}
        />

        {/*
         * Categories is pushed from the Profile screen.
         */}
        <Stack.Screen
          name="categories"
          options={{
            title: 'Manage Categories',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}