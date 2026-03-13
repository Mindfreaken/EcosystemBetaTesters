import type { Theme } from './types';

// Dark version of the Miami Vice theme
const miamiViceDark: Theme = {
  id: 'miamiVice-dark', // Unique identifier for the dark Miami Vice theme
  name: 'Miami Vice Dark', // Display name for the dark theme
  colors: {
    background: '#0a0015',
    foreground: '#e5e7eb',
    primary: '#ff66cc',
    primaryForeground: '#ffffff',
    secondary: '#33ffdd',
    secondaryForeground: '#0a0015',
    accent: '#0d1b2a',
    accentForeground: '#e5e7eb',
    card: '#1e293b',
    cardForeground: '#e5e7eb',
    popover: '#1e293b',
    popoverForeground: '#e5e7eb',
    muted: '#1e243a',
    mutedForeground: '#6b7280',
    destructive: '#ff3355',
    destructiveForeground: '#ffffff',
    border: '#374151',
    input: '#1e293b',
    ring: '#ff66cc',
    chart1: '#ff66cc',
    chart2: '#33ffdd',
    chart3: '#33ff99',
    chart4: '#ffcc33',
    chart5: '#6c47ff',
    sidebar: '#050010',
    sidebarForeground: '#e5e7eb',
    sidebarPrimary: '#ff66cc',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#0d1b2a',
    sidebarAccentForeground: '#e5e7eb',
    sidebarBorder: '#374151',
    sidebarRing: '#ff66cc',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

// Light version of the Miami Vice theme
const miamiViceLight: Theme = {
  id: 'miamiVice-light', // Unique identifier for the light Miami Vice theme
  name: 'Miami Vice Light', // Display name for the light theme
  colors: {
    background: '#ffb3e0', // Much deeper pink
    foreground: '#111111',
    primary: '#ff66cc',
    primaryForeground: '#ffffff',
    secondary: '#33ffdd',
    secondaryForeground: '#ffffff',
    accent: '#ff80bf',
    accentForeground: '#111111',
    card: '#ffd1ed', // Saturated pink card
    cardForeground: '#111111',
    popover: '#ffd1ed',
    popoverForeground: '#111111',
    muted: '#ff80bf',
    mutedForeground: '#555555',
    destructive: '#ff3355',
    destructiveForeground: '#ffffff',
    border: '#ff99d6',
    input: '#ffffff',
    ring: '#ff66cc',
    chart1: '#ff66cc',
    chart2: '#33ffdd',
    chart3: '#33ff99',
    chart4: '#ffcc33',
    chart5: '#6c47ff',
    sidebar: '#ff99cc', // Vibrant pink sidebar
    sidebarForeground: '#111111',
    sidebarPrimary: '#ff66cc',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#ffa6d6',
    sidebarAccentForeground: '#111111',
    sidebarBorder: '#ff99d6',
    sidebarRing: '#ff66cc',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

export { miamiViceDark, miamiViceLight };


