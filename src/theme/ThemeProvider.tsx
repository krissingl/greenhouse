import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';
import type { Theme } from './types';

const ThemeContext = createContext<Theme | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const colorScheme = useColorScheme();
  const theme = useMemo<Theme>(
    () => (colorScheme === 'dark' ? darkTheme : lightTheme),
    [colorScheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
