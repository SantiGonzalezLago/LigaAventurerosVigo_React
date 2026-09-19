import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';

function isValidTheme(theme: string | null): theme is ThemeMode {
  return theme === 'system' || theme === 'light' || theme === 'dark';
}

function applyTheme(theme: ThemeMode, mediaQuery: MediaQueryList) {
  const useDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
  document.documentElement.classList.toggle('theme-dark', useDark);
}

export const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Por defecto del sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const ThemeContext = createContext<{
  currentTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mediaQuery = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : 'system';
  });

  useEffect(() => {
    applyTheme(currentTheme, mediaQuery);

    const listener = () => {
      if (currentTheme === 'system') applyTheme('system', mediaQuery);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [currentTheme, mediaQuery]);

  const setTheme = (theme: ThemeMode) => {
    const validTheme = isValidTheme(theme) ? theme : 'system';
    if (validTheme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, validTheme);
    setCurrentTheme(validTheme);
  };

  return <ThemeContext.Provider value={{ currentTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
}
