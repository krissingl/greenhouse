import type { TextStyle } from 'react-native';

export interface ThemeColors {
  primary: string;
  primaryContainer: string;
  secondary: string;
  tertiary: string;

  background: string;
  surface: string;
  surfaceVariant: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;

  border: string;
  divider: string;

  success: string;
  warning: string;
  error: string;
  info: string;

  disabled: string;
  disabledText: string;

  overlay: string;
  shadow: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface ThemeRadius {
  sm: number;
  md: number;
  lg: number;
  pill: number;
}

export interface TypographyStyle {
  size: number;
  weight: NonNullable<TextStyle['fontWeight']>;
  lineHeight: number;
}

export interface ThemeTypography {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  title: TypographyStyle;
  body: TypographyStyle;
  bodySmall: TypographyStyle;
  caption: TypographyStyle;
}

export interface ElevationStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export interface ThemeElevation {
  card: ElevationStyle;
  modal: ElevationStyle;
}

export interface ThemeAnimation {
  fast: number;
  normal: number;
  slow: number;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  typography: ThemeTypography;
  elevation: ThemeElevation;
  animation: ThemeAnimation;
}
