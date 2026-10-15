import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="stock/[symbol]" options={{ title: '' }} />
      <Stack.Screen name="predict" options={{ title: 'AI Predictions' }} />
      <Stack.Screen name="debate" options={{ title: 'AI Debate' }} />
      <Stack.Screen name="chat" options={{ title: 'AI Chat' }} />
      <Stack.Screen name="risk" options={{ title: 'Risk Analysis' }} />
      <Stack.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Stack.Screen name="news" options={{ title: 'News & Sentiment' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="add-holding" options={{ title: 'Add holding', presentation: 'modal' }} />
    </Stack>
  );
}
