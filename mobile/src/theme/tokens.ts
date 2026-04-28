import { Platform } from 'react-native';

export const BRAND = {
  accent: '#2E9F5C',
  accentDark: '#5BC98A',
  dangerIos: '#FF3B30',
  dangerIosDark: '#FF453A',
  dangerMd: '#B3261E',
  dangerMdDark: '#F2B8B5',
  editBlue: '#3478F6',
} as const;

export interface Tokens {
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  accent: string;
  accentOnAccent: string;
  danger: string;
}

export const LIGHT: Tokens = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F7',
  text: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  separator: 'rgba(60,60,67,0.18)',
  accent: BRAND.accent,
  accentOnAccent: '#FFFFFF',
  danger: Platform.OS === 'ios' ? BRAND.dangerIos : BRAND.dangerMd,
};

export const DARK: Tokens = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceMuted: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  separator: 'rgba(84,84,88,0.4)',
  accent: BRAND.accentDark,
  accentOnAccent: '#000000',
  danger: Platform.OS === 'ios' ? BRAND.dangerIosDark : BRAND.dangerMdDark,
};
