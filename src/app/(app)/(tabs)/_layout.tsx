import { Tabs } from 'expo-router';
import { CandlestickChart, LayoutDashboard, Menu, Sparkles, Wallet } from 'lucide-react-native';

import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="markets"
        options={{ title: 'Markets', tabBarIcon: ({ color, size }) => <CandlestickChart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{ title: 'Portfolio', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="ai"
        options={{ title: 'AI', tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tabs>
  );
}
