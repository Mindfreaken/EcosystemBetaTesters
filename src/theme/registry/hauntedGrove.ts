import type { Theme } from './types';

// Dark version of the Haunted Grove theme
const hauntedGroveDark: Theme = {
  id: 'hauntedGrove-dark', // Unique identifier for the dark theme
  name: 'Haunted Grove Dark', // Display name for the dark theme
  colors: {
    background: '#0c1415',
    foreground: '#d0e8dc',
    primary: '#2e4d30',
    primaryForeground: '#ffffff',
    secondary: '#5a3e66',
    secondaryForeground: '#ffffff',
    accent: '#121d1a',
    accentForeground: '#d0e8dc',
    card: '#121d1a',
    cardForeground: '#d0e8dc',
    popover: '#121d1a',
    popoverForeground: '#d0e8dc',
    muted: '#1a2926',
    mutedForeground: '#8c9b92',
    destructive: '#a83232',
    destructiveForeground: '#ffffff',
    border: '#1d2a27',
    input: '#121d1a',
    ring: '#2e4d30',
    chart1: '#2e4d30',
    chart2: '#5a3e66',
    chart3: '#3cff8a',
    chart4: '#d08800',
    chart5: '#6c47ff',
    sidebar: '#080e0f',
    sidebarForeground: '#d0e8dc',
    sidebarPrimary: '#2e4d30',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#121d1a',
    sidebarAccentForeground: '#d0e8dc',
    sidebarBorder: '#1d2a27',
    sidebarRing: '#2e4d30',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

// Light version of the Haunted Grove theme
const hauntedGroveLight: Theme = {
  id: 'hauntedGrove-light', // Unique identifier for the light theme
  name: 'Haunted Grove Light', // Display name for the light theme
  colors: {
    background: '#e8ecea',
    foreground: '#3d493d',
    primary: '#5d7c62',
    primaryForeground: '#ffffff',
    secondary: '#8d6b7d',
    secondaryForeground: '#ffffff',
    accent: '#dfe3e1',
    accentForeground: '#3d493d',
    card: '#ffffff',
    cardForeground: '#3d493d',
    popover: '#ffffff',
    popoverForeground: '#3d493d',
    muted: '#dfe3e1',
    mutedForeground: '#7c8e7c',
    destructive: '#a83232',
    destructiveForeground: '#ffffff',
    border: '#b0bdb7',
    input: '#ffffff',
    ring: '#5d7c62',
    chart1: '#5d7c62',
    chart2: '#8d6b7d',
    chart3: '#44ff92',
    chart4: '#d08800',
    chart5: '#6c47ff',
    sidebar: '#c8d0ce',
    sidebarForeground: '#3d493d',
    sidebarPrimary: '#5d7c62',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#dfe3e1',
    sidebarAccentForeground: '#3d493d',
    sidebarBorder: '#b0bdb7',
    sidebarRing: '#5d7c62',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

export { hauntedGroveDark, hauntedGroveLight };


