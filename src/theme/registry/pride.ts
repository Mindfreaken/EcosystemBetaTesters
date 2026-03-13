import type { Theme } from './types';

// Dark version of the Pride theme
const prideDark: Theme = {
  id: 'pride-dark',
  name: 'Pride Dark',
  colors: {
    background: '#0f172a',
    foreground: '#f1f5f9',
    primary: '#ff218c',
    primaryForeground: '#ffffff',
    secondary: '#ffb400',
    secondaryForeground: '#0f172a',
    accent: '#1e293b',
    accentForeground: '#f1f5f9',
    card: '#1e293b',
    cardForeground: '#f1f5f9',
    popover: '#1e293b',
    popoverForeground: '#f1f5f9',
    muted: '#273444',
    mutedForeground: '#9ca3af',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#334155',
    input: '#1e293b',
    ring: '#ff218c',
    chart1: '#ff218c',
    chart2: '#ffb400',
    chart3: '#10b981',
    chart4: '#f59e0b',
    chart5: '#7c3aed',
    sidebar: '#0a0f1a',
    sidebarForeground: '#f1f5f9',
    sidebarPrimary: '#ff218c',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#1e293b',
    sidebarAccentForeground: '#f1f5f9',
    sidebarBorder: '#334155',
    sidebarRing: '#ff218c',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

const prideLight: Theme = {
  id: 'pride-light',
  name: 'Pride Light',
  colors: {
    background: '#fff0f3', // Very soft pride pink
    foreground: '#0f172a',
    primary: '#ff218c',
    primaryForeground: '#ffffff',
    secondary: '#ffb400',
    secondaryForeground: '#ffffff',
    accent: '#e6fffa', // Soft teal accent
    accentForeground: '#0f172a',
    card: '#fffcf0', // Creamy yellow card
    cardForeground: '#0f172a',
    popover: '#ffffff',
    popoverForeground: '#0f172a',
    muted: '#f0eaff', // Soft lavender muted
    mutedForeground: '#52527a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#f5e6ff', // Lavender border
    input: '#ffffff',
    ring: '#ff218c',
    chart1: '#ff218c',
    chart2: '#ffb400',
    chart3: '#10b981',
    chart4: '#f59e0b',
    chart5: '#7c3aed',
    sidebar: '#eef6ff', // Soft pride blue sidebar
    sidebarForeground: '#0f172a',
    sidebarPrimary: '#ff218c',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#f0eaff',
    sidebarAccentForeground: '#0f172a',
    sidebarBorder: '#d0e0ff',
    sidebarRing: '#ff218c',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

export { prideDark, prideLight };


