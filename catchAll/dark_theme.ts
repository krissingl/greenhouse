import { Theme } from "./types";

export const darkTheme: Theme = {
  dark: true,

  colors: {
    // Brand
    primary: "#88B58A",
    primaryContainer: "#355438",
    secondary: "#D39A85",
    tertiary: "#8AB6E3",

    // Backgrounds
    background: "#1C1F1D",
    surface: "#252927",
    surfaceVariant: "#2E322F",

    // Text
    text: "#F5F4F1",
    textSecondary: "#D0D0CB",
    textTertiary: "#A5A59E",
    textOnPrimary: "#1C1F1D",

    // Borders
    border: "#3A3F3C",
    divider: "#3A3F3C",

    // States
    success: "#77B67B",
    warning: "#E1B85A",
    error: "#E07A7A",
    info: "#84B8F5",

    // Interaction
    disabled: "#555854",
    disabledText: "#8A8C88",

    overlay: "rgba(0,0,0,0.6)",

    shadow: "#000000",
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
      weight: "700",
      lineHeight: 48,
    },
    h1: {
      size: 32,
      weight: "700",
      lineHeight: 40,
    },
    h2: {
      size: 26,
      weight: "600",
      lineHeight: 34,
    },
    h3: {
      size: 22,
      weight: "600",
      lineHeight: 30,
    },
    title: {
      size: 18,
      weight: "500",
      lineHeight: 26,
    },
    body: {
      size: 16,
      weight: "400",
      lineHeight: 24,
    },
    bodySmall: {
      size: 14,
      weight: "400",
      lineHeight: 20,
    },
    caption: {
      size: 12,
      weight: "500",
      lineHeight: 16,
    },
  },

  elevation: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },

    modal: {
      shadowColor: "#000",
      shadowOpacity: 0.35,
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