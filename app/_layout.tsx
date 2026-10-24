import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/constants';
import { initializeDatabase } from '@/database/schema';
import { Stack } from 'expo-router';
import { deleteDatabaseAsync, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [databaseReady, setDatabaseReady] = useState(true);
  
    useEffect(() => {
      async function resetDatabase() {
        console.log("Deleting database")
        await deleteDatabaseAsync('zeefi.db');
        setDatabaseReady(true);
        console.log("All deleted and ready")
      }
      try{
        //resetDatabase();
      }catch(error){
        console.log(error)
      }
      
    }, []);
  
    if (!databaseReady) {
      console.log("database ready")
      return null;
    }

  return (
  <SQLiteProvider 
    databaseName='zeefi.db'
    onInit={initializeDatabase}
  >
      <SafeAreaProvider>
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
          <Stack.Screen name="index" options={{headerShown:false}}/>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

  
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="profile"
            options={{
              title:"Profile",
              headerShown:false,
            }}
          />
          <Stack.Screen
            name="categories"
            options={{
              title: 'Manage Categories',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="sync-account"
            options={{
              title: 'Sync Account',
              headerShown: true,
            }}
          />
        </Stack>
      </SafeAreaProvider>
  </SQLiteProvider>
  );
}
