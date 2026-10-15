import { create } from 'zustand';

import { registerAuthHandlers } from '@/api/client';
import { authApi } from '@/api/endpoints';
import { queryClient } from '@/api/queryClient';
import { isJwtExpired } from '@/lib/jwt';
import { getItem, removeItem, setItem, StorageKeys } from '@/lib/storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  token: string | null;
  /** Shown on the login screen after a forced logout (expired/invalid token). */
  notice: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: (notice?: string) => Promise<void>;
  /** Called when the app returns to the foreground. */
  checkExpiry: () => void;
};

/**
 * Auth/session state. The JWT lives in SecureStore (Keychain/Keystore) and in
 * memory; it is never written to AsyncStorage or logged.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  token: null,
  notice: null,

  hydrate: async () => {
    const token = await getItem(StorageKeys.token);
    if (token && !isJwtExpired(token)) {
      set({ token, status: 'signedIn' });
    } else {
      if (token) await removeItem(StorageKeys.token);
      set({ token: null, status: 'signedOut' });
    }
  },

  login: async (email, password) => {
    const { access_token } = await authApi.login(email.trim().toLowerCase(), password);
    await setItem(StorageKeys.token, access_token);
    set({ token: access_token, status: 'signedIn', notice: null });
  },

  signup: async (email, password, fullName) => {
    await authApi.signup(email.trim().toLowerCase(), password, fullName?.trim() || undefined);
    await get().login(email, password);
  },

  logout: async (notice) => {
    await removeItem(StorageKeys.token);
    queryClient.clear(); // Never show one user's financial data to the next.
    set({ token: null, status: 'signedOut', notice: notice ?? null });
  },

  checkExpiry: () => {
    const { token, status } = get();
    if (status === 'signedIn' && token && isJwtExpired(token)) {
      void get().logout('Your session expired. Please sign in again.');
    }
  },
}));

registerAuthHandlers({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    if (useAuthStore.getState().status === 'signedIn') {
      void useAuthStore.getState().logout('Your session expired. Please sign in again.');
    }
  },
});
