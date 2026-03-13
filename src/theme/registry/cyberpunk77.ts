import type { Theme } from './types';

const themenamedark: Theme = {
  id: 'cyberpunk-dark',
  name: 'Cyberpunk Dark',
  colors: {
    background: '#0a0a1a',
    foreground: '#e0e0e0',
    primary: '#00e0ff',
    primaryForeground: '#0a0a1a',
    secondary: '#f500ff',
    secondaryForeground: '#ffffff',
    accent: '#14142b',
    accentForeground: '#e0e0e0',
    card: '#14142b',
    cardForeground: '#e0e0e0',
    popover: '#14142b',
    popoverForeground: '#e0e0e0',
    muted: '#1f1f3d',
    mutedForeground: '#808080',
    destructive: '#ff4d4d',
    destructiveForeground: '#ffffff',
    border: '#333333',
    input: '#14142b',
    ring: '#00e0ff',
    chart1: '#00e0ff',
    chart2: '#f500ff',
    chart3: '#00ff80',
    chart4: '#ffea00',
    chart5: '#6c47ff',
    sidebar: '#030308',
    sidebarForeground: '#e0e0e0',
    sidebarPrimary: '#00e0ff',
    sidebarPrimaryForeground: '#0a0a1a',
    sidebarAccent: '#14142b',
    sidebarAccentForeground: '#e0e0e0',
    sidebarBorder: '#333333',
    sidebarRing: '#00e0ff',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

const themenamelight: Theme = {
  id: 'cyberpunk-light',
  name: 'Cyberpunk Light',
  colors: {
    background: '#f2f4f7', // High-tech light grey
    foreground: '#0a0a14',
    primary: '#00f2ff', // Electric Cyan
    primaryForeground: '#0a0a14',
    secondary: '#ff00ff', // Hot Magenta
    secondaryForeground: '#ffffff',
    accent: '#f3e600', // Cyberpunk Yellow (now an accent)
    accentForeground: '#0a0a14',
    card: '#ffffff',
    cardForeground: '#0a0a14',
    popover: '#ffffff',
    popoverForeground: '#0a0a14',
    muted: '#e5e8eb',
    mutedForeground: '#525266',
    destructive: '#ff0033',
    destructiveForeground: '#ffffff',
    border: '#0a0a0a', // Solid black borders
    input: '#ffffff',
    ring: '#00f2ff',
    chart1: '#00f2ff',
    chart2: '#ff00ff',
    chart3: '#05ff91',
    chart4: '#f3e600',
    chart5: '#6c47ff',
    sidebar: '#0a0a0f', // High-contrast black sidebar
    sidebarForeground: '#ffffff',
    sidebarPrimary: '#00f2ff',
    sidebarPrimaryForeground: '#0a0a14',
    sidebarAccent: '#1a1a24',
    sidebarAccentForeground: '#ffffff',
    sidebarBorder: '#00f2ff', // Neon cyan sidebar border
    sidebarRing: '#00f2ff',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
}; // End of the Cyberpunk Light theme

export { themenamedark, themenamelight };


