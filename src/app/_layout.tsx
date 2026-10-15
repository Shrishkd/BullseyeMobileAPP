import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const { scheme } = useTheme();

  useEffect(() => {
    void Promise.all([useSettingsStore.getState().hydrate(), useAuthStore.getState().hydrate()]);
  }, []);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  // React Query: treat app foreground as window focus; re-check token expiry.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
      if (state === 'active') useAuthStore.getState().checkExpiry();
    });
    return () => sub.remove();
  }, []);

  if (status === 'loading') return null;

  const c = palette[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.background, card: c.card, text: c.text, border: c.border },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={status !== 'signedIn'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
