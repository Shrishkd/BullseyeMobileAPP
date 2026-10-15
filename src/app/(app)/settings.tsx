import Constants from 'expo-constants';
import { Alert } from 'react-native';

import { Button, Card, Disclaimer, Screen, SectionHeader, Segmented, Text } from '@/components/ui';
import { API_BASE_URL, WS_BASE_URL } from '@/config/env';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore, type ThemePreference } from '@/stores/settings';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const theme = useSettingsStore((s) => s.themePreference);
  const setTheme = useSettingsStore((s) => s.setThemePreference);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      <Card>
        <SectionHeader title="Appearance" />
        <Segmented options={THEMES} value={theme} onChange={setTheme} />
      </Card>

      <Card>
        <SectionHeader title="Server" />
        <Text variant="small" tone="muted">
          API: {API_BASE_URL}
        </Text>
        <Text variant="small" tone="muted">
          Live prices: {WS_BASE_URL}
        </Text>
        <Text variant="caption" tone="muted">
          Set EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_WS_BASE_URL in .env.local to change.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Account" />
        <Button
          title="Sign out"
          variant="danger"
          onPress={() =>
            Alert.alert('Sign out', 'Sign out of Bullseye on this device?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
            ])
          }
        />
      </Card>

      <Disclaimer text="Bullseye provides market data, analytics and AI-generated commentary for educational purposes only. It is not a SEBI-registered investment adviser and nothing in the app is a recommendation to buy or sell securities." />
      <Text variant="caption" tone="muted" align="center">
        Bullseye v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}
