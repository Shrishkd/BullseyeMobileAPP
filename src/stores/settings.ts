import { create } from 'zustand';

import { getItem, setItem, StorageKeys } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  themePreference: ThemePreference;
  hydrate: () => Promise<void>;
  setThemePreference: (pref: ThemePreference) => void;
};

/** Non-sensitive user preferences. Dark is the default, matching the web app. */
export const useSettingsStore = create<SettingsState>()((set) => ({
  themePreference: 'dark',

  hydrate: async () => {
    const stored = await getItem(StorageKeys.themePreference);
    if (stored === 'system' || stored === 'light' || stored === 'dark') set({ themePreference: stored });
  },

  setThemePreference: (pref) => {
    set({ themePreference: pref });
    void setItem(StorageKeys.themePreference, pref);
  },
}));
