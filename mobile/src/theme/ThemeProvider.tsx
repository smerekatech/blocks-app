import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, type Tokens } from './tokens';
import { PALETTE_BY_ID, type ResolvedSwatch, type SwatchId } from './palette.generated';

interface ThemeValue {
  scheme: 'light' | 'dark';
  tokens: Tokens;
  swatch(id: SwatchId): ResolvedSwatch;
  swatchColors(id: SwatchId): {
    bg: string;
    border: string;
    surface: string;
    text: string;
    dot: string;
  };
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tokens = scheme === 'dark' ? DARK : LIGHT;

  const value: ThemeValue = {
    scheme,
    tokens,
    swatch: (id) => PALETTE_BY_ID[id] ?? PALETTE_BY_ID.slate,
    swatchColors(id) {
      const s = PALETTE_BY_ID[id] ?? PALETTE_BY_ID.slate;
      return scheme === 'dark'
        ? { bg: s.bgDark, border: s.borderDark, surface: s.surfaceDark, text: s.textDark, dot: s.dotDark }
        : { bg: s.bg, border: s.border, surface: s.surface, text: s.text, dot: s.dot };
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme called outside ThemeProvider');
  return v;
}
