import type { Theme } from './types'; // Import the Theme type from the types module

// Dark version of the Valorant theme (Gamer)
const valorantDark: Theme = {
  id: 'valorant-dark',
  name: 'Gamer Dark',
  colors: {
    background: '#0F1923',
    foreground: '#FFFFFF',
    primary: '#FF4655',
    primaryForeground: '#FFFFFF',
    secondary: '#00E1FF',
    secondaryForeground: '#FFFFFF',
    accent: '#1F2731',
    accentForeground: '#FFFFFF',
    card: '#1F2731',
    cardForeground: '#FFFFFF',
    popover: '#1F2731',
    popoverForeground: '#FFFFFF',
    muted: '#2B333D',
    mutedForeground: '#7B8B9D',
    destructive: '#FF4655',
    destructiveForeground: '#FFFFFF',
    border: '#364966',
    input: '#1F2731',
    ring: '#FF4655',
    chart1: '#FF4655',
    chart2: '#00E1FF',
    chart3: '#1ABF2B',
    chart4: '#FFA500',
    chart5: '#6c47ff',
    sidebar: '#09111A',
    sidebarForeground: '#FFFFFF',
    sidebarPrimary: '#FF4655',
    sidebarPrimaryForeground: '#FFFFFF',
    sidebarAccent: '#1F2731',
    sidebarAccentForeground: '#FFFFFF',
    sidebarBorder: '#364966',
    sidebarRing: '#FF4655',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

const valorantLight: Theme = {
  id: 'valorant-light',
  name: 'Gamer Light',
  colors: {
    background: '#ffb5a7', // Vibrant warm background
    foreground: '#0F1923',
    primary: '#FF4655',
    primaryForeground: '#FFFFFF',
    secondary: '#00E1FF',
    secondaryForeground: '#FFFFFF',
    accent: '#fbc4ab',
    accentForeground: '#0F1923',
    card: '#fcd5ce', // Saturated warm card
    cardForeground: '#0F1923',
    popover: '#FFFFFF',
    popoverForeground: '#0F1923',
    muted: '#fbc4ab',
    mutedForeground: '#4a4e69',
    destructive: '#FF4655',
    destructiveForeground: '#FFFFFF',
    border: '#f08080',
    input: '#FFFFFF',
    ring: '#FF4655',
    chart1: '#FF4655',
    chart2: '#00E1FF',
    chart3: '#1ABF2B',
    chart4: '#FFA500',
    chart5: '#6c47ff',
    sidebar: '#fbc4ab',
    sidebarForeground: '#0F1923',
    sidebarPrimary: '#FF4655',
    sidebarPrimaryForeground: '#FFFFFF',
    sidebarAccent: '#fae1dd',
    sidebarAccentForeground: '#0F1923',
    sidebarBorder: '#f08080',
    sidebarRing: '#FF4655',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

export { valorantDark, valorantLight }; // Export both theme variants for use in the application


