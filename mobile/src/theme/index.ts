// Tema visual do Surfyng — dark mode, paleta oceânica
import { Platform } from 'react-native';

export const fonts = {
  bold:         'GothamRounded-Bold',
  boldItalic:   'GothamRounded-BoldItalic',
  book:         'GothamRounded-Book',
  bookItalic:   'GothamRounded-BookItalic',
  light:        'GothamRounded-Light',
  lightItalic:  'GothamRounded-LightItalic',
  medium:       'GothamRounded-Medium',
  mediumItalic: 'GothamRounded-MediumItalic',
};

export const colors = {
  // Backgrounds
  bg:           '#023246',
  bgCard:       '#073D56',
  bgCardAlt:    '#0A4F6E',

  // Marca
  primary:  '#0A4F6E',
  accent:   '#00D4FF',

  // Semânticas
  success:  '#059669',
  warning:  '#D97706',
  danger:   '#DC2626',

  // Texto
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted:     'rgba(255,255,255,0.35)',

  // Bordas
  border:      'rgba(10,79,110,0.35)',
  borderLight: 'rgba(0,212,255,0.15)',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
};

export const typography = {
  h1:    { fontSize: 28, fontFamily: fonts.bold,   color: colors.textPrimary },
  h2:    { fontSize: 22, fontFamily: fonts.bold,   color: colors.textPrimary },
  h3:    { fontSize: 18, fontFamily: fonts.medium, color: colors.textPrimary },
  body:  { fontSize: 15, fontFamily: fonts.book,   color: colors.textPrimary },
  small: { fontSize: 13, fontFamily: fonts.light,  color: colors.textSecondary },
  tiny:  { fontSize: 11, fontFamily: fonts.light,  color: colors.textMuted },
  mono:  { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', color: colors.textPrimary },
};

// Shadow glassmorphism
export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
  }),
};

// Score → cor semântica
export function scoreColor(score: number): string {
  if (score >= 8) return colors.success;
  if (score >= 5) return colors.warning;
  return colors.danger;
}

// Score → rótulo textual
export function scoreLabel(score: number): string {
  if (score >= 9) return 'Excelente';
  if (score >= 7) return 'Ótima';
  if (score >= 5) return 'Boa';
  if (score >= 3) return 'Regular';
  return 'Ruim';
}
