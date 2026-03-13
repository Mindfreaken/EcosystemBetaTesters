import type { Theme } from './types';

const themenamedark: Theme = {
  id: 'cyberpunkPurple-dark', // Unique identifier for the dark theme variant
  name: 'Cyberpunk Purple Dark', // Display name for the dark theme
  colors: {
    background: '#100c14',
    foreground: '#e8e0f0',
    primary: '#9d00ff',
    primaryForeground: '#ffffff',
    secondary: '#00f5d4',
    secondaryForeground: '#100c14',
    accent: '#1c1621',
    accentForeground: '#e8e0f0',
    card: '#1c1621',
    cardForeground: '#e8e0f0',
    popover: '#1c1621',
    popoverForeground: '#e8e0f0',
    muted: '#28202e',
    mutedForeground: '#888090',
    destructive: '#ff4d4d',
    destructiveForeground: '#ffffff',
    border: '#342a3b',
    input: '#1c1621',
    ring: '#9d00ff',
    chart1: '#9d00ff',
    chart2: '#00f5d4',
    chart3: '#00ff80',
    chart4: '#ffea00',
    chart5: '#6c47ff',
    sidebar: '#060408',
    sidebarForeground: '#e8e0f0',
    sidebarPrimary: '#9d00ff',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#1c1621',
    sidebarAccentForeground: '#e8e0f0',
    sidebarBorder: '#342a3b',
    sidebarRing: '#9d00ff',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
}; // End of Cyberpunk Purple Dark theme

const themenamelight: Theme = {
  id: 'cyberpunkPurple-light', // Unique identifier for the light theme variant
  name: 'Cyberpunk Purple Light', // Display name for the light theme
  colors: {
    background: '#f8f0ff', // Very light lavender
    foreground: '#1a1a1a',
    primary: '#7e00cc',
    primaryForeground: '#ffffff',
    secondary: '#00c4a9',
    secondaryForeground: '#ffffff',
    accent: '#eedeff', // Light purple accent
    accentForeground: '#1a1a1a',
    card: '#f4eafa', // Light purple cards
    cardForeground: '#1a1a1a',
    popover: '#ffffff',
    popoverForeground: '#1a1a1a',
    muted: '#eedeff',
    mutedForeground: '#6a5a8a', // Purple-tinted muted foreground
    destructive: '#cc0000',
    destructiveForeground: '#ffffff',
    border: '#e0ccff', // Purple border
    input: '#ffffff',
    ring: '#7e00cc',
    chart1: '#7e00cc',
    chart2: '#00c4a9',
    chart3: '#00cc66',
    chart4: '#cccc00',
    chart5: '#6c47ff',
    sidebar: '#f0e5ff', // More purplish sidebar
    sidebarForeground: '#1a1a1a',
    sidebarPrimary: '#7e00cc',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#e8d5ff',
    sidebarAccentForeground: '#1a1a1a',
    sidebarBorder: '#d9c2ff',
    sidebarRing: '#7e00cc',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
}; // End of the Cyberpunk Purple Light theme


export { themenamedark, themenamelight };


