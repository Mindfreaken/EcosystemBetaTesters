import type { Theme } from './types';

// --- Void Dark Green Theme ---
// A dark theme using near-black backgrounds with vibrant green accents
const voidDarkGreenTheme: Theme = {
  id: 'voidDarkGreen',
  name: 'Void Dark Green',
  colors: {
    // --- Primary Accent Colors (Green) ---
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    primaryHover: '#10b98199',
    primaryActive: '#047857',

    // --- Secondary Accent Colors ---
    secondary: '#6366f1',
    secondaryDark: '#4f46e5',
    secondaryLight: '#818cf8',
    secondaryHover: '#6366f199',
    secondaryActive: '#4338ca',

    // --- Background Colors (Dark) ---
    background: '#000000',
    backgroundAlt: '#080808',
    backgroundLight: '#101010',
    backgroundDark: '#030303',

    // --- Card Colors ---
    card: '#080808',
    cardHover: '#101010',
    cardActive: '#181818',

    // --- Border Colors ---
    border: '#1f1f1f',
    borderLight: '#282828',
    borderDark: '#101010',

    // --- Text Colors ---
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
    link: '#34d399',
    linkHover: '#10b981',
    linkActive: '#059669',

    buttonPrimary: '#10b981',
    buttonPrimaryHover: '#059669',
    buttonPrimaryActive: '#047857',

    buttonSecondary: '#6366f1',
    buttonSecondaryHover: '#4f46e5',
    buttonSecondaryActive: '#4338ca',

    // --- Miscellaneous Colors ---
    shadow: '#00000099',
    highlight: '#ffffff1a',
    overlay: '#000000cc',
    disabled: '#333333'
  }
};

export { voidDarkGreenTheme }; 
