import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';

// ─── Error Boundary ───
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('[Onset] Uncaught error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0C0C0C', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Please restart the app. If the problem persists, try clearing the app data.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

SplashScreen.preventAutoHideAsync();

const OnsetDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF6B35',
    background: '#0C0C0C',
    card: '#1A1A1A',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.05)',
    notification: '#FF6B35',
  },
};

// ─── Protected Route Hook ───
function useProtectedRoute(isInitialized: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const needsProfileSetup = useAuthStore((s) => s.needsProfileSetup);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthenticated = !!user;

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated → show intro slides if first time, else welcome
      if (!hasSeenOnboarding) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(auth)/welcome');
      }
    } else if (isAuthenticated && inAuthGroup && !needsProfileSetup) {
      // Authenticated, no pending onboarding, still on auth screens → go to tabs
      router.replace('/(tabs)');
    } else if (isAuthenticated && needsProfileSetup && !inAuthGroup) {
      // Authenticated but needs onboarding → allow calendar routes
      const inCalendarGroup = segments[0] === 'calendar';
      if (!inCalendarGroup) {
        router.replace('/(auth)/profile-setup');
      }
    }
  }, [isInitialized, user, needsProfileSetup, hasSeenOnboarding, segments]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const [settingsReady, setSettingsReady] = useState(false);
  const authInitialized = useAuthStore((s) => s.isInitialized);

  // Initialize auth store
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Wait for auth hydration from persisted store
  useEffect(() => {
    if (authInitialized) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      // Hydration complete — auth initialize() handles the rest
    });
    return unsub;
  }, [authInitialized]);

  useEffect(() => {
    if (fontsLoaded) {
      const unsub = useSettingsStore.persist.onFinishHydration(() => {
        useSettingsStore.getState().applyAudioSettings();
        setSettingsReady(true);
      });
      if (useSettingsStore.persist.hasHydrated()) {
        useSettingsStore.getState().applyAudioSettings();
        setSettingsReady(true);
      }
      // Safety timeout: if hydration never completes (corrupted storage), proceed anyway
      const timeout = setTimeout(() => {
        if (!useSettingsStore.persist.hasHydrated()) {
          console.warn('[Onset] Settings hydration timed out, proceeding with defaults');
          setSettingsReady(true);
        }
      }, 3000);
      return () => { unsub(); clearTimeout(timeout); };
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && settingsReady && authInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, settingsReady, authInitialized]);

  // Protected route redirect
  useProtectedRoute(fontsLoaded && settingsReady && authInitialized);

  // Subscribe to language + unit so the entire tree re-renders on change
  const language = useSettingsStore((s) => s.language);
  const weightUnit = useSettingsStore((s) => s.weightUnit);

  // ─── Transition overlay ───
  const settingsKey = `${language}-${weightUnit}`;
  const prevKeyRef = useRef(settingsKey);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (!settingsReady) return;
    if (prevKeyRef.current !== settingsKey) {
      prevKeyRef.current = settingsKey;
      // Flash overlay: fade in, wait for remount, fade out
      setShowOverlay(true);
      overlayOpacity.value = 1;
      overlayOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      }, () => {
        runOnJS(setShowOverlay)(false);
      });
    }
  }, [settingsKey, settingsReady]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!fontsLoaded || !settingsReady || !authInitialized) {
    return null;
  }

  return (
    <ErrorBoundary>
    <View style={styles.root}>
      <GestureHandlerRootView style={styles.root} key={settingsKey}>
        <ThemeProvider value={OnsetDarkTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recovery" />
            <Stack.Screen name="steps" />
            <Stack.Screen name="workout" options={{ gestureEnabled: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="trophies" />
            <Stack.Screen name="stats" />
            <Stack.Screen name="volume" />
            <Stack.Screen name="exercise" />
            <Stack.Screen name="program" />
            <Stack.Screen name="calendar" />
            <Stack.Screen name="settings" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>

      {/* Transition overlay — lives outside the keyed tree so it survives remount */}
      {showOverlay && (
        <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
      )}
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0C0C0C',
    zIndex: 999,
  },
});
