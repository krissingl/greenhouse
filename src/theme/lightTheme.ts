import type { Theme } from './types';

export const lightTheme: Theme = {
  dark: false,

  colors: {
    // Brand
    primary: '#5F8F62',
    primaryContainer: '#DDEDDD',
    secondary: '#C97B63',
    tertiary: '#6E9DC9',

    // Backgrounds
    background: '#F2F8F3',
    surface: '#FFFFFF',
    surfaceVariant: '#FAFAF9',

    // Text
    text: '#262625',
    textSecondary: '#5B5B58',
    textTertiary: '#9D9D99',
    textOnPrimary: '#FFFFFF',

    // Borders
    border: '#E5E5E3',
    divider: '#E5E5E3',

    // States
    success: '#4F8A5B',
    warning: '#D89B3D',
    error: '#C25555',
    info: '#5B8FD9',

    // Interaction
    disabled: '#D8D8D6',
    disabledText: '#9D9D99',

    overlay: 'rgba(0,0,0,0.3)',

    shadow: '#000000',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 999,
  },

  typography: {
    display: {
      size: 40,
      weight: '700',
      lineHeight: 48,
    },
    h1: {
      size: 32,
      weight: '700',
      lineHeight: 40,
    },
    h2: {
      size: 26,
      weight: '600',
      lineHeight: 34,
    },
    h3: {
      size: 22,
      weight: '600',
      lineHeight: 30,
    },
    title: {
      size: 18,
      weight: '500',
      lineHeight: 26,
    },
    body: {
      size: 16,
      weight: '400',
      lineHeight: 24,
    },
    bodySmall: {
      size: 14,
      weight: '400',
      lineHeight: 20,
    },
    caption: {
      size: 12,
      weight: '500',
      lineHeight: 16,
    },
  },

  elevation: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    modal: {
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  },

  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};
