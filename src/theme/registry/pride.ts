import type { Theme } from './types';

// Dark version of the Pride theme
const prideDark: Theme = {
  id: 'pride-dark',
  name: 'Pride Dark',
  colors: {
    primary: '#ff218c',
    primaryDark: '#d10063',
    primaryLight: '#ff4ba8',
    primaryHover: '#ff218c80',
    primaryActive: '#a8004e',

    secondary: '#ffb400',
    secondaryDark: '#cc9000',
    secondaryLight: '#ffc740',
    secondaryHover: '#ffb40080',
    secondaryActive: '#a87800',

    background: '#0f172a',
    backgroundAlt: '#1e293b',
    backgroundLight: '#273444',
    backgroundDark: '#0a0f1a',

    card: '#1e293b',
    cardHover: '#273444',
    cardActive: '#334155',

    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1e293b',

    text: '#f1f5f9',
    textPrimary: '#f1f5f9',
    textLight: '#ffffff',
    textDark: '#d1d5db',
    textMuted: '#9ca3af',
    textSecondary: '#cbd5e1',

    success: '#10b981',
    successDark: '#059669',
    successLight: '#34d399',

    danger: '#ef4444',
    dangerDark: '#dc2626',
    dangerLight: '#f87171',

    warning: '#f59e0b',
    warningDark: '#d97706',
    warningLight: '#fbbf24',

    info: '#3b82f6',
    infoDark: '#2563eb',
    infoLight: '#60a5fa',

    link: '#2563eb',
    linkHover: '#1d4ed8',
    linkActive: '#1e40af',

    buttonPrimary: '#ff218c',
    buttonPrimaryHover: '#d10063',
    buttonPrimaryActive: '#a8004e',

    buttonSecondary: '#7c3aed',
    buttonSecondaryHover: '#6d28d9',
    buttonSecondaryActive: '#5b21b6',

    shadow: '#00000080',
    highlight: '#ffffff',

    overlay: '#0f172a99',
    disabled: '#9ca3af'
  }
};

// Light version of the Pride theme
const prideLight: Theme = {
  id: 'pride-light',
  name: 'Pride Light',
  colors: {
    primary: '#ff218c',
    primaryDark: '#d10063',
    primaryLight: '#ff4ba8',
    primaryHover: '#ff218c80',
    primaryActive: '#a8004e',

    secondary: '#ffb400',
    secondaryDark: '#cc9000',
    secondaryLight: '#ffc740',
    secondaryHover: '#ffb40080',
    secondaryActive: '#a87800',

    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    backgroundLight: '#ffffff',
    backgroundDark: '#f1f5f9',

    card: '#ffffff',
    cardHover: '#f9fafb',
    cardActive: '#f3f4f6',

    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e1',

    text: '#0f172a',
    textPrimary: '#0f172a',
    textLight: '#334155',
    textDark: '#020617',
    textMuted: '#64748b',
    textSecondary: '#475569',

    success: '#10b981',
    successDark: '#059669',
    successLight: '#34d399',

    danger: '#ef4444',
    dangerDark: '#dc2626',
    dangerLight: '#f87171',

    warning: '#f59e0b',
    warningDark: '#d97706',
    warningLight: '#fbbf24',

    info: '#3b82f6',
    infoDark: '#2563eb',
    infoLight: '#60a5fa',

    link: '#2563eb',
    linkHover: '#1d4ed8',
    linkActive: '#1e40af',

    buttonPrimary: '#ff218c',
    buttonPrimaryHover: '#d10063',
    buttonPrimaryActive: '#a8004e',

    buttonSecondary: '#7c3aed',
    buttonSecondaryHover: '#6d28d9',
    buttonSecondaryActive: '#5b21b6',

    shadow: '#0000001a',
    highlight: '#ffffff',

    overlay: '#0f172a99',
    disabled: '#9ca3af'
  }
};

export { prideDark, prideLight };
