import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { font } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Variant = 'display' | 'heading' | 'title' | 'body' | 'small' | 'caption' | 'label';
type Tone = 'default' | 'muted' | 'primary' | 'up' | 'down' | 'warning' | 'onPrimary';

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Tabular digits so prices don't jitter as they update. */
  numeric?: boolean;
};

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontSize: font.display, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: font.heading, fontWeight: '700', letterSpacing: -0.3 },
  title: { fontSize: font.title, fontWeight: '600' },
  body: { fontSize: font.body, lineHeight: 22 },
  small: { fontSize: font.small, lineHeight: 18 },
  caption: { fontSize: font.caption, lineHeight: 16 },
  label: { fontSize: font.caption, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
};

export function Text({ variant = 'body', tone = 'default', weight, align, numeric, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    up: colors.up,
    down: colors.down,
    warning: colors.warning,
    onPrimary: colors.primaryText,
  }[tone];

  return (
    <RNText
      {...rest}
      style={[
        variantStyle[variant],
        { color },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
