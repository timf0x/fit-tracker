import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const [settingsReady, setSettingsReady] = useState(false);

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
      return () => { unsub(); };
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && settingsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, settingsReady]);

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

  if (!fontsLoaded || !settingsReady) {
    return null;
  }

  return (
    <View style={styles.root}>
      <GestureHandlerRootView style={styles.root} key={settingsKey}>
        <ThemeProvider value={OnsetDarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="recovery" options={{ headerShown: false }} />
            <Stack.Screen name="steps" options={{ headerShown: false }} />
            <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="trophies" options={{ headerShown: false }} />
            <Stack.Screen name="stats" options={{ headerShown: false }} />
            <Stack.Screen name="volume" options={{ headerShown: false }} />
            <Stack.Screen name="exercise" options={{ headerShown: false }} />
            <Stack.Screen name="program" options={{ headerShown: false }} />
            <Stack.Screen name="calendar" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>

      {/* Transition overlay — lives outside the keyed tree so it survives remount */}
      {showOverlay && (
        <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
      )}
    </View>
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
