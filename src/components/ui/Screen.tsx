import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type ScreenProps = {
  children: ReactNode;
  /** Pull-to-refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Wrap in KeyboardAvoidingView (forms). */
  keyboard?: boolean;
  /** Render children in a plain View (for screens that own a FlatList). */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Standard screen container. Native headers handle the top safe area. */
export function Screen({ children, refreshing = false, onRefresh, keyboard, scroll = true, contentStyle }: ScreenProps) {
  const { colors } = useTheme();

  const body = scroll ? (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { backgroundColor: colors.background }, contentStyle]}>{children}</View>
  );

  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },
});
