import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Locale, Theme } from '@/shared/types/common';

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },
      locale: 'fr',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'talent-lens-app',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Apply theme on store initialization
const stored = useAppStore.getState();
applyTheme(stored.theme);
