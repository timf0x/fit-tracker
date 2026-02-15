import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { syncOnLogin, setupAutoSync, stopAutoSync } from '@/lib/sync';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { useBadgeStore } from '@/stores/badgeStore';

interface AuthStoreState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  needsProfileSetup: boolean;
  hasSeenOnboarding: boolean;
  pendingUsername: string | null;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  setNeedsProfileSetup: (value: boolean) => void;
  markOnboardingSeen: () => void;
  setPendingUsername: (username: string | null) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      needsProfileSetup: false,
      hasSeenOnboarding: false,
      pendingUsername: null,

      initialize: async () => {
        try {
          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            set({ user: session.user, session, isInitialized: true });
            // Sync data on startup if authenticated
            syncOnLogin(session.user.id).catch(console.warn);
            setupAutoSync(session.user.id);
          } else {
            set({ isInitialized: true });
          }

          // Listen for auth changes (token refresh, sign-in/out)
          supabase.auth.onAuthStateChange((_event, session) => {
            const prev = get().session;
            set({
              user: session?.user ?? null,
              session: session ?? null,
            });

            if (session && !prev) {
              // New sign-in → sync
              syncOnLogin(session.user.id).catch(console.warn);
              setupAutoSync(session.user.id);
            } else if (!session && prev) {
              // Signed out → stop sync
              stopAutoSync();
            }
          });
        } catch (e) {
          console.warn('[Auth] initialize error:', e);
          set({ isInitialized: true });
        }
      },

      signUp: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          set({ isLoading: false });
          if (!error && data.session) {
            set({
              user: data.session.user,
              session: data.session,
            });
          }
          return { error };
        } catch (e: any) {
          console.error('[Auth] signUp exception:', e);
          set({ isLoading: false });
          return { error: { message: e.message } as AuthError };
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        set({ isLoading: false });
        if (!error && data.session) {
          set({
            user: data.session.user,
            session: data.session,
          });
        }
        return { error };
      },

      signInWithApple: async () => {
        if (Platform.OS !== 'ios') {
          return { error: { message: 'Apple Sign-In is only available on iOS' } as AuthError };
        }

        set({ isLoading: true });
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (!credential.identityToken) {
            set({ isLoading: false });
            return { error: { message: 'No identity token from Apple' } as AuthError };
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          });

          set({ isLoading: false });
          if (!error && data.session) {
            set({
              user: data.session.user,
              session: data.session,
            });
          }
          return { error };
        } catch (e: any) {
          set({ isLoading: false });
          // User cancelled Apple dialog
          if (e.code === 'ERR_REQUEST_CANCELED') {
            return { error: null };
          }
          return { error: { message: e.message || 'Apple Sign-In failed' } as AuthError };
        }
      },

      signOut: async () => {
        stopAutoSync();
        await supabase.auth.signOut();
        // Clear all user-scoped stores so next account starts fresh
        useWorkoutStore.getState().resetAll();
        useProgramStore.getState().clearProfile();
        useBadgeStore.getState().resetAll();
        set({ user: null, session: null, needsProfileSetup: false });
      },

      resetPassword: async (email) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        set({ isLoading: false });
        return { error };
      },

      setNeedsProfileSetup: (value) => {
        set({ needsProfileSetup: value });
      },

      markOnboardingSeen: () => {
        set({ hasSeenOnboarding: true });
      },

      setPendingUsername: (username) => {
        set({ pendingUsername: username });
      },
    }),
    {
      name: 'onset-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        needsProfileSetup: state.needsProfileSetup,
        hasSeenOnboarding: state.hasSeenOnboarding,
        pendingUsername: state.pendingUsername,
      }),
    },
  ),
);
