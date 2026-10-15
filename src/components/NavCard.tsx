import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type NavCardProps = { href: Href; title: string; description: string; icon: ReactNode; tint?: string };

export function NavCard({ href, title, description, icon, tint }: NavCardProps) {
  const { colors } = useTheme();
  return (
    <Card onPress={() => router.push(href)} accessibilityLabel={title}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: tint ?? colors.primarySoft }]}>{icon}</View>
        <View style={styles.flex}>
          <Text variant="title">{title}</Text>
          <Text variant="small" tone="muted">
            {description}
          </Text>
        </View>
        <ChevronRight color={colors.textMuted} size={20} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
