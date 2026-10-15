import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Key/value storage. Native uses the Keychain / Keystore via expo-secure-store,
 * so the JWT never sits in plain AsyncStorage. Web (dev preview only) falls
 * back to localStorage, which SecureStore does not support.
 */
export const StorageKeys = {
  token: 'bullseye_token',
  themePreference: 'bullseye_theme',
} as const;

const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  try {
    if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (isWeb) globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing stored; nothing to remove.
  }
}
