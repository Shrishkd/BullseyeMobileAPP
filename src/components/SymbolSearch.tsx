import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip, ChipRow } from '@/components/ui';
import { POPULAR_SYMBOLS } from '@/config/market';
import { normaliseSymbol } from '@/lib/format';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type SymbolSearchProps = {
  onSubmit: (symbol: string) => void;
  initial?: string;
  selected?: string;
  placeholder?: string;
  showPopular?: boolean;
};

/** NSE ticker input + popular-symbol chips. Submits a normalised symbol. */
export function SymbolSearch({
  onSubmit,
  initial = '',
  selected,
  placeholder = 'Search NSE symbol, e.g. RELIANCE',
  showPopular = true,
}: SymbolSearchProps) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initial);

  const submit = (raw: string) => {
    const s = normaliseSymbol(raw);
    if (s) onSubmit(s);
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.box, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Search color={colors.textMuted} size={18} />
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={() => submit(value)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Stock symbol"
          style={[styles.input, { color: colors.text }]}
        />
      </View>
      {showPopular ? (
        <ChipRow>
          {POPULAR_SYMBOLS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={selected === s}
              onPress={() => {
                setValue(s);
                submit(s);
              }}
            />
          ))}
        </ChipRow>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: spacing.sm },
});
