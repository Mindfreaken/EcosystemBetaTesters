import type { Theme } from './types';

// Dark version of the Miami Vice theme
const miamiViceDark: Theme = {
  id: 'miamiVice-dark', // Unique identifier for the dark Miami Vice theme
  name: 'Miami Vice Dark', // Display name for the dark theme
  colors: {
    primary: '#ff66cc', // Neon magenta: signature Vice City pink
    primaryDark: '#cc5599', // Darker neon magenta for depth
    primaryLight: '#ff99dd', // Lighter neon magenta for highlights
    primaryHover: '#ff66cc80', // Semi-transparent hover effect
    primaryActive: '#bb33aa', // Strong active neon magenta

    secondary: '#33ffdd', // Neon aqua: vibrant teal accent
    secondaryDark: '#28cca8', // Darker neon aqua for emphasis
    secondaryLight: '#66ffe6', // Lighter neon aqua for highlights
    secondaryHover: '#33ffdd80', // Semi-transparent hover for secondary
    secondaryActive: '#25cca5', // Deep secondary accent

    background: '#0a0015', // Page background: darkest night tone, for deep contrast
    backgroundAlt: '#0d1b2a', // Nav/sidebar background: deep midnight blue
    backgroundLight: '#1e293b', // Card background: dark slate blue
    backgroundDark: '#050010', // Panel/edge accents: nearly black for framing

    card: '#1e293b', // Card base: dark slate blue
    cardHover: '#334155', // Card hover: slightly lighter slate
    cardActive: '#475569', // Card active: medium slate accent

    border: '#374151', // Dark grey border for contrast
    borderLight: '#4b5563', // Lighter grey border accent
    borderDark: '#1f2937', // Very dark grey for defined edges

    text: '#e5e7eb', // Light grey text for readability
    textPrimary: '#ffffff', // Pure white primary text
    textLight: '#f3f4f6', // Very light grey text for emphasis
    textDark: '#9ca3af', // Medium grey text for hierarchy
    textMuted: '#6b7280', // Muted grey for secondary text
    textSecondary: '#d1d5db', // Secondary light grey for supporting text

    success: '#33ff99', // Vibrant mint for success
    successDark: '#28cc7a', // Dark mint for emphasis
    successLight: '#66ffb2', // Light mint for highlights

    danger: '#ff3355', // Hot red-pink for danger
    dangerDark: '#cc2a44', // Darker red-pink for emphasis
    dangerLight: '#ff6688', // Lighter pink for soft alerts

    warning: '#ffcc33', // Neon yellow for warnings
    warningDark: '#cca62a', // Dark neon yellow for emphasis
    warningLight: '#ffe066', // Light neon yellow for highlights

    info: '#3399ff', // Bright neon blue for info
    infoDark: '#267acc', // Dark neon blue for emphasis
    infoLight: '#66b2ff', // Light neon blue for highlights

    link: '#ff66cc', // Link color matching primary
    linkHover: '#ff99dd', // Hover state for links
    linkActive: '#bb33aa', // Active state for links

    buttonPrimary: '#ff66cc', // Button primary: neon magenta
    buttonPrimaryHover: '#cc5599', // Button hover: darker neon magenta
    buttonPrimaryActive: '#bb33aa', // Button active: deep magenta

    buttonSecondary: '#33ffdd', // Button secondary: neon aqua
    buttonSecondaryHover: '#28cca8', // Button hover: darker neon aqua
    buttonSecondaryActive: '#25cca5', // Button active: deep neon aqua

    shadow: '#00000080', // Semi-transparent black shadow for depth
    highlight: '#ff66cc40', // Subtle neon magenta glow for accents

    overlay: '#0d1b2acc', // Dark blue overlay for modals (based on backgroundAlt)
    disabled: '#6b7280' // Muted grey for disabled elements (matches textMuted)
  }
};

// Light version of the Miami Vice theme
const miamiViceLight: Theme = {
  id: 'miamiVice-light', // Unique identifier for the light Miami Vice theme
  name: 'Miami Vice Light', // Display name for the light theme
  colors: {
    primary: '#ff66cc', // Neon magenta: signature Vice City pink
    primaryDark: '#cc5599', // Darker neon magenta for depth
    primaryLight: '#ff99dd', // Lighter neon magenta for highlights
    primaryHover: '#ff66cc80', // Semi-transparent hover effect
    primaryActive: '#bb33aa', // Strong active neon magenta

    secondary: '#33ffdd', // Neon aqua: vibrant teal accent
    secondaryDark: '#28cca8', // Darker neon aqua for emphasis
    secondaryLight: '#66ffe6', // Lighter neon aqua for highlights
    secondaryHover: '#33ffdd80', // Semi-transparent hover for secondary
    secondaryActive: '#25cca5', // Deep secondary accent

    background: '#ffeaff', // Page background: soft neon pink
    backgroundAlt: '#ffd4e6', // Nav/sidebar background: pastel pink for subtle nav
    backgroundLight: '#ffffff', // Card background: clean white for readability
    backgroundDark: '#fff0f5', // Panel accents: very light pink for hover/edges

    card: '#ffffff', // Card base: white for strong contrast on page
    cardHover: '#fff0f5', // Card hover: very light pink accent
    cardActive: '#ffeaff', // Card active: soft neon pink accent

    border: '#ffb3d9', // Pink border for separation
    borderLight: '#ffdaee', // Lighter pink border accent
    borderDark: '#ff80b3', // Darker pink border

    text: '#111111', // Dark text for readability
    textPrimary: '#111111', // Primary text
    textLight: '#333333', // Secondary text
    textDark: '#000000', // Emphasis text
    textMuted: '#777777', // Muted text
    textSecondary: '#555555', // Supporting text

    success: '#33ff99', // Vibrant mint for success
    successDark: '#28cc7a', // Dark mint for emphasis
    successLight: '#66ffb2', // Light mint for highlights

    danger: '#ff3355', // Hot red-pink for danger
    dangerDark: '#cc2a44', // Darker red-pink for emphasis
    dangerLight: '#ff6688', // Lighter pink for soft alerts

    warning: '#ffcc33', // Neon yellow for warnings
    warningDark: '#cca62a', // Dark neon yellow for emphasis
    warningLight: '#ffe066', // Light neon yellow for highlights

    info: '#3399ff', // Bright neon blue for info
    infoDark: '#267acc', // Dark neon blue for emphasis
    infoLight: '#66b2ff', // Light neon blue for highlights

    link: '#ff66cc', // Link color matching primary
    linkHover: '#ff99dd', // Hover state for links
    linkActive: '#bb33aa', // Active state for links

    buttonPrimary: '#ff66cc', // Button primary: neon magenta
    buttonPrimaryHover: '#cc5599', // Button hover: darker neon magenta
    buttonPrimaryActive: '#bb33aa', // Button active: deep magenta

    buttonSecondary: '#33ffdd', // Button secondary: neon aqua
    buttonSecondaryHover: '#28cca8', // Button hover: darker neon aqua
    buttonSecondaryActive: '#25cca5', // Button active: deep neon aqua

    shadow: '#0000001a', // Subtle shadow for depth in light mode
    highlight: '#ff66cc25', // Neon magenta highlight

    overlay: '#ffffff88', // Semi-transparent white overlay
    disabled: '#cccccc' // Muted grey for disabled elements
  }
};

export { miamiViceDark, miamiViceLight };
