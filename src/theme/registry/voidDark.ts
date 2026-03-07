import type { Theme } from './types';

// --- Void Dark Theme (Enhanced Darkness) ---
// An intensely dark theme using near-black and black backgrounds with high-contrast white text.
const voidDarkTheme: Theme = {
  id: 'voidDark',
  name: 'Void Dark',
  colors: {
    // --- Primary Accent Colors ---
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    primaryHover: '#6366f199',
    primaryActive: '#4338ca',

    // --- Secondary Accent Colors ---
    secondary: '#10b981',
    secondaryDark: '#059669',
    secondaryLight: '#34d399',
    secondaryHover: '#10b98199',
    secondaryActive: '#047857',

    // --- Background Colors (Even Darker) ---
    background: '#000000',
    backgroundAlt: '#080808',
    backgroundLight: '#101010',
    backgroundDark: '#030303',

    // --- Card Colors (Even Darker) ---
    card: '#080808',
    cardHover: '#101010',
    cardActive: '#181818',

    // --- Border Colors (Even Darker) ---
    border: '#1f1f1f',
    borderLight: '#282828',
    borderDark: '#101010',

    // --- Text Colors (Maintain High Contrast) ---
    text: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textLight: '#FFFFFF',
    textDark: '#E0E0E0',
    textMuted: '#888888',
    textSecondary: '#aaaaaa',

    // --- Semantic Colors ---
    success: '#10b981',
    successDark: '#059669',
    successLight: '#34d399',

    danger: '#ef4444',
    dangerDark: '#dc2626',
    dangerLight: '#f87171',

    warning: '#f59e0b',
    warningDark: '#d97706',
    warningLight: '#fbbf24',

    info: '#6366f1',
    infoDark: '#4f46e5',
    infoLight: '#818cf8',

    // --- Interactive Element Colors ---
    link: '#818cf8',
    linkHover: '#6366f1',
    linkActive: '#4f46e5',

    buttonPrimary: '#6366f1',
    buttonPrimaryHover: '#4f46e5',
    buttonPrimaryActive: '#4338ca',

    buttonSecondary: '#10b981',
    buttonSecondaryHover: '#059669',
    buttonSecondaryActive: '#047857',

    // --- Miscellaneous Colors ---
    shadow: '#00000099',
    highlight: '#ffffff1a',
    overlay: '#000000cc',
    disabled: '#333333'
  }
};

// --- Void Light Theme (Enhanced Brightness) ---
// An intensely light theme using pure white backgrounds with high-contrast black text.
const voidLightTheme: Theme = {
  id: 'voidLight',
  name: 'Void Light',
  colors: {
    // --- Primary Accent Colors ---
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    primaryHover: '#6366f180',
    primaryActive: '#4338ca',

    // --- Secondary Accent Colors ---
    secondary: '#10b981',
    secondaryDark: '#059669',
    secondaryLight: '#34d399',
    secondaryHover: '#10b98180',
    secondaryActive: '#047857',

    // --- Background Colors (Enhanced Light) ---
    background: '#FFFFFF',
    backgroundAlt: '#F9F9F9',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#F0F0F0',

    // --- Card Colors (Enhanced Light) ---
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
    cardActive: '#F5F5F5',

    // --- Border Colors (Enhanced Light) ---
    border: '#EEEEEE',
    borderLight: '#F5F5F5',
    borderDark: '#DCDCDC',

    // --- Text Colors (Enhanced Contrast) ---
    text: '#000000',
    textPrimary: '#000000',
    textLight: '#222222',
    textDark: '#000000',
    textMuted: '#666666',
    textSecondary: '#444444',

    // --- Semantic Colors ---
    success: '#10b981',
    successDark: '#059669',
    successLight: '#34d399',

    danger: '#ef4444',
    dangerDark: '#dc2626',
    dangerLight: '#f87171',

    warning: '#f59e0b',
    warningDark: '#d97706',
    warningLight: '#fbbf24',

    info: '#6366f1',
    infoDark: '#4f46e5',
    infoLight: '#818cf8',

    // --- Interactive Element Colors ---
    link: '#4f46e5',
    linkHover: '#6366f1',
    linkActive: '#4338ca',

    buttonPrimary: '#6366f1',
    buttonPrimaryHover: '#4f46e5',
    buttonPrimaryActive: '#4338ca',

    buttonSecondary: '#10b981',
    buttonSecondaryHover: '#059669',
    buttonSecondaryActive: '#047857',

    // --- Miscellaneous Colors ---
    shadow: '#00000014',
    highlight: '#00000008',
    overlay: '#FFFFFFcc',
    disabled: '#BBBBBB'
  }
};

export { voidDarkTheme, voidLightTheme };
