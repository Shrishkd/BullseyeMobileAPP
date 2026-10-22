import Constants from 'expo-constants';
import { Bell, Fingerprint } from 'lucide-react-native';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { Button, Card, Disclaimer, Screen, SectionHeader, Segmented, Text } from '@/components/ui';
import { API_BASE_URL, WS_BASE_URL } from '@/config/env';
import { checkBiometricSupport, promptBiometricAuth } from '@/lib/biometrics';
import { requestNotificationPermissions, sendLocalNotification } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore, type ThemePreference } from '@/stores/settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const theme = useSettingsStore((s) => s.themePreference);
  const setTheme = useSettingsStore((s) => s.setThemePreference);
  const biometricsEnabled = useSettingsStore((s) => s.biometricsEnabled);
  const setBiometrics = useSettingsStore((s) => s.setBiometricsEnabled);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotifications = useSettingsStore((s) => s.setNotificationsEnabled);
  const logout = useAuthStore((s) => s.logout);

  const onToggleBiometrics = async (value: boolean) => {
    if (value) {
      const support = await checkBiometricSupport();
      if (!support.hasHardware || !support.isEnrolled) {
        Alert.alert('Not Supported', 'No biometric hardware or enrolled fingerprint/face found on this device.');
        return;
      }
      const success = await promptBiometricAuth('Verify your identity to enable biometric lock');
      if (success) {
        setBiometrics(true);
      }
    } else {
      setBiometrics(false);
    }
  };

  const onToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please enable notifications for Bullseye in your device settings.');
        return;
      }
      setNotifications(true);
      void sendLocalNotification('Notifications Active', 'You will receive price and market alert notifications.');
    } else {
      setNotifications(false);
    }
  };

  return (
    <Screen>
      <Card>
        <SectionHeader title="Appearance" />
        <Segmented options={THEMES} value={theme} onChange={setTheme} />
      </Card>

      <Card>
        <SectionHeader title="Security" icon={<Fingerprint color={colors.primary} size={18} />} />
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text variant="body" weight="600">
              Biometric App Lock
            </Text>
            <Text variant="caption" tone="muted">
              Require Fingerprint or Face ID when opening Bullseye
            </Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={onToggleBiometrics}
            thumbColor={colors.primary}
            trackColor={{ false: colors.muted, true: colors.primarySoft }}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Notifications" icon={<Bell color={colors.primary} size={18} />} />
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text variant="body" weight="600">
              Price & Market Alerts
            </Text>
            <Text variant="caption" tone="muted">
              Notify when your watched stock triggers price or RSI thresholds
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            thumbColor={colors.primary}
            trackColor={{ false: colors.muted, true: colors.primarySoft }}
          />
        </View>
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

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  flex: {
    flex: 1,
    paddingRight: spacing.md,
  },
});
