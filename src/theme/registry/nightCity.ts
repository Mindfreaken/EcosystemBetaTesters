import type { Theme } from './types';

// Define the dark variant of the Night City theme
const nightCityDark: Theme = {
  id: 'nightCity-dark',
  name: 'Night City Dark',
  colors: {
    background: '#121212',
    foreground: '#e6e6e6',
    primary: '#ff2d55',
    primaryForeground: '#ffffff',
    secondary: '#0096ff',
    secondaryForeground: '#ffffff',
    accent: '#1e1e1e',
    accentForeground: '#e6e6e6',
    card: '#1e1e1e',
    cardForeground: '#e6e6e6',
    popover: '#1e1e1e',
    popoverForeground: '#e6e6e6',
    muted: '#2a2a2a',
    mutedForeground: '#9ca3af',
    destructive: '#ff2d55',
    destructiveForeground: '#ffffff',
    border: '#333333',
    input: '#1e1e1e',
    ring: '#ff2d55',
    chart1: '#ff2d55',
    chart2: '#0096ff',
    chart3: '#36d399',
    chart4: '#ffb400',
    chart5: '#6c47ff',
    sidebar: '#0a0a0a',
    sidebarForeground: '#e6e6e6',
    sidebarPrimary: '#ff2d55',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#1e1e1e',
    sidebarAccentForeground: '#e6e6e6',
    sidebarBorder: '#333333',
    sidebarRing: '#ff2d55',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

const nightCityLight: Theme = {
  id: 'nightCity-light',
  name: 'Night City Light',
  colors: {
    background: '#ffcbd1', // Vibrant pinkish-red background
    foreground: '#333333',
    primary: '#ff2d55',
    primaryForeground: '#ffffff',
    secondary: '#0096ff',
    secondaryForeground: '#ffffff',
    accent: '#ff99ac',
    accentForeground: '#333333',
    card: '#ffb3c1', // Saturated pink card
    cardForeground: '#222222',
    popover: '#ffffff',
    popoverForeground: '#222222',
    muted: '#ff99ac',
    mutedForeground: '#444444',
    destructive: '#ff2d55',
    destructiveForeground: '#ffffff',
    border: '#ffb3c1',
    input: '#ffffff',
    ring: '#ff2d55',
    chart1: '#ff2d55',
    chart2: '#0096ff',
    chart3: '#36d399',
    chart4: '#ffb400',
    chart5: '#6c47ff',
    sidebar: '#ffccd5',
    sidebarForeground: '#222222',
    sidebarPrimary: '#ff2d55',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#ffd9e1',
    sidebarAccentForeground: '#222222',
    sidebarBorder: '#ffb3c1',
    sidebarRing: '#ff2d55',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

export { nightCityDark, nightCityLight };


