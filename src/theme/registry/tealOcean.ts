import type { Theme } from './types'; // Import the Theme type from the types module

// Dark version of the Teal Ocean theme
const tealOceanDark: Theme = {
  id: 'tealOcean-dark',
  name: 'Teal Ocean Dark',
  colors: {
    background: '#051e3e',
    foreground: '#e3f6fc',
    primary: '#00b8a9',
    primaryForeground: '#ffffff',
    secondary: '#0582ca',
    secondaryForeground: '#ffffff',
    accent: '#0a2f5e',
    accentForeground: '#e3f6fc',
    card: '#0a2f5e',
    cardForeground: '#e3f6fc',
    popover: '#0a2f5e',
    popoverForeground: '#e3f6fc',
    muted: '#0e407e',
    mutedForeground: '#85c1d9',
    destructive: '#f85c70',
    destructiveForeground: '#ffffff',
    border: '#12519e',
    input: '#0a2f5e',
    ring: '#00b8a9',
    chart1: '#00b8a9',
    chart2: '#0582ca',
    chart3: '#00b8a9',
    chart4: '#ffc045',
    chart5: '#6c47ff',
    sidebar: '#021326',
    sidebarForeground: '#e3f6fc',
    sidebarPrimary: '#00b8a9',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#0a2f5e',
    sidebarAccentForeground: '#e3f6fc',
    sidebarBorder: '#12519e',
    sidebarRing: '#00b8a9',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
};

const tealOceanLight: Theme = {
  id: 'tealOcean-light',
  name: 'Teal Ocean Light',
  colors: {
    background: '#81ecec', // Vibrant teal background
    foreground: '#023e58',
    primary: '#00b8a9',
    primaryForeground: '#ffffff',
    secondary: '#0582ca',
    secondaryForeground: '#ffffff',
    accent: '#2ed573',
    accentForeground: '#023e58',
    card: '#c7ecee', // Saturated teal card
    cardForeground: '#023e58',
    popover: '#ffffff',
    popoverForeground: '#023e58',
    muted: '#7ed6df',
    mutedForeground: '#444444',
    destructive: '#f85c70',
    destructiveForeground: '#ffffff',
    border: '#74c7b8',
    input: '#ffffff',
    ring: '#00b8a9',
    chart1: '#00b8a9',
    chart2: '#0582ca',
    chart3: '#00b8a9',
    chart4: '#ffc045',
    chart5: '#6c47ff',
    sidebar: '#7ed6df',
    sidebarForeground: '#023e58',
    sidebarPrimary: '#00b8a9',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#95e1d3',
    sidebarAccentForeground: '#023e58',
    sidebarBorder: '#74c7b8',
    sidebarRing: '#00b8a9',
    fontSans: '"Geist Sans", sans-serif',
    fontSerif: 'Georgia, serif',
    fontMono: '"Geist Mono", monospace',
  }
}; // End of the Teal Ocean Light theme

export { tealOceanDark, tealOceanLight }; // Export both theme variants for use in the application


