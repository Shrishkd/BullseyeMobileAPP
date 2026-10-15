import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/stores/settings';

import { palette, type ColorScheme, type Colors } from './tokens';

export function useColorSchemeName(): ColorScheme {
  const system = useColorScheme();
  const pref = useSettingsStore((s) => s.themePreference);
  if (pref === 'system') return system === 'light' ? 'light' : 'dark';
  return pref;
}

export function useTheme(): { scheme: ColorScheme; colors: Colors } {
  const scheme = useColorSchemeName();
  return { scheme, colors: palette[scheme] };
}
