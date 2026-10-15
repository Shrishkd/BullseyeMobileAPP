import { Bell, LogOut, Newspaper, Settings, ShieldAlert } from 'lucide-react-native';
import { Alert } from 'react-native';

import { NavCard } from '@/components/NavCard';
import { Button, Screen } from '@/components/ui';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/theme/useTheme';

export default function MoreScreen() {
  const { colors } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  const confirmLogout = () =>
    Alert.alert('Sign out', 'Sign out of Bullseye on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);

  return (
    <Screen>
      <NavCard
        href="/risk"
        title="Risk analysis"
        description="Volatility, beta, Sharpe, VaR, concentration and stress tests."
        icon={<ShieldAlert color={colors.info} size={22} />}
        tint={colors.infoSoft}
      />
      <NavCard
        href="/alerts"
        title="Alerts"
        description="Price, RSI and volume-spike alerts with trigger history."
        icon={<Bell color={colors.warning} size={22} />}
        tint={colors.warningSoft}
      />
      <NavCard
        href="/news"
        title="News & sentiment"
        description="Indian market news scored for sentiment."
        icon={<Newspaper color={colors.primary} size={22} />}
      />
      <NavCard
        href="/settings"
        title="Settings"
        description="Appearance, server and account."
        icon={<Settings color={colors.textMuted} size={22} />}
        tint={colors.muted}
      />
      <Button title="Sign out" variant="danger" icon={<LogOut color={colors.down} size={16} />} onPress={confirmLogout} />
    </Screen>
  );
}
