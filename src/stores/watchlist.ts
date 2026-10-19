import { create } from 'zustand';

import { getItem, setItem, StorageKeys } from '@/lib/storage';

type WatchlistState = {
  symbols: string[];
  hydrate: () => Promise<void>;
  has: (symbol: string) => boolean;
  toggle: (symbol: string) => void;
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
};

const DEFAULT_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  symbols: DEFAULT_SYMBOLS,

  hydrate: async () => {
    const raw = await getItem(StorageKeys.watchlist);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        set({ symbols: parsed });
      }
    } catch {
      // Keep defaults if parse fails
    }
  },

  has: (symbol: string) => {
    const norm = symbol.trim().toUpperCase();
    return get().symbols.includes(norm);
  },

  toggle: (symbol: string) => {
    const norm = symbol.trim().toUpperCase();
    const current = get().symbols;
    const next = current.includes(norm) ? current.filter((s) => s !== norm) : [...current, norm];
    set({ symbols: next });
    void setItem(StorageKeys.watchlist, JSON.stringify(next));
  },

  add: (symbol: string) => {
    const norm = symbol.trim().toUpperCase();
    const current = get().symbols;
    if (!current.includes(norm)) {
      const next = [...current, norm];
      set({ symbols: next });
      void setItem(StorageKeys.watchlist, JSON.stringify(next));
    }
  },

  remove: (symbol: string) => {
    const norm = symbol.trim().toUpperCase();
    const current = get().symbols;
    const next = current.filter((s) => s !== norm);
    set({ symbols: next });
    void setItem(StorageKeys.watchlist, JSON.stringify(next));
  },
}));
