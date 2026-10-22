import { create } from 'zustand';

import { getItem, setItem, StorageKeys } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  themePreference: ThemePreference;
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
  hydrate: () => Promise<void>;
  setThemePreference: (pref: ThemePreference) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
};

/** Non-sensitive user preferences. Dark is the default, matching the web app. */
export const useSettingsStore = create<SettingsState>()((set) => ({
  themePreference: 'dark',
  biometricsEnabled: false,
  notificationsEnabled: true,

  hydrate: async () => {
    const [storedTheme, storedBio, storedNotif] = await Promise.all([
      getItem(StorageKeys.themePreference),
      getItem(StorageKeys.biometrics),
      getItem(StorageKeys.notifications),
    ]);

    if (storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark') {
      set({ themePreference: storedTheme });
    }
    if (storedBio !== null) {
      set({ biometricsEnabled: storedBio === 'true' });
    }
    if (storedNotif !== null) {
      set({ notificationsEnabled: storedNotif === 'true' });
    }
  },

  setThemePreference: (pref) => {
    set({ themePreference: pref });
    void setItem(StorageKeys.themePreference, pref);
  },

  setBiometricsEnabled: (enabled) => {
    set({ biometricsEnabled: enabled });
    void setItem(StorageKeys.biometrics, String(enabled));
  },

  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    void setItem(StorageKeys.notifications, String(enabled));
  },
}));
