import { Target } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Shared frame for login/signup: brand mark, title, form slot. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
              <Target color={colors.primary} size={28} />
            </View>
            <Text variant="heading">
              Bulls<Text variant="heading" tone="primary">eye</Text>
            </Text>
            <Text variant="small" tone="muted" align="center">
              AI-powered investing for Indian markets
            </Text>
          </View>
          <View style={styles.form}>
            <View style={styles.titles}>
              <Text variant="title">{title}</Text>
              <Text variant="small" tone="muted">
                {subtitle}
              </Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  form: { gap: spacing.lg },
  titles: { gap: spacing.xs },
});
