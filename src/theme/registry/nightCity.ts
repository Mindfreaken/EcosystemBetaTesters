import type { Theme } from './types';

// Define the dark variant of the Night City theme
const nightCityDark: Theme = {
  id: 'nightCity-dark',
  name: 'Night City Dark',
  colors: {
    primary: '#ff2d55',
    primaryDark: '#e60033',
    primaryLight: '#ff5c7c',
    primaryHover: '#ff2d5580',
    primaryActive: '#d10030',

    secondary: '#0096ff',
    secondaryDark: '#0077cc',
    secondaryLight: '#33abff',
    secondaryHover: '#0096ff80',
    secondaryActive: '#0066cc',

    background: '#121212',
    backgroundAlt: '#1e1e1e',
    backgroundLight: '#2a2a2a',
    backgroundDark: '#0a0a0a',

    card: '#1e1e1e',
    cardHover: '#2a2a2a',
    cardActive: '#333333',

    border: '#333333',
    borderLight: '#444444',
    borderDark: '#222222',

    text: '#e6e6e6',
    textPrimary: '#e6e6e6',
    textLight: '#f2f2f2',
    textDark: '#d9d9d9',
    textMuted: '#9ca3af',
    textSecondary: '#bdc3cf',

    success: '#36d399',
    successDark: '#2baf7c',
    successLight: '#5ddcac',

    danger: '#ff2d55',
    dangerDark: '#e60033',
    dangerLight: '#ff5c7c',

    warning: '#ffb400',
    warningDark: '#cc9000',
    warningLight: '#ffc333',

    info: '#0096ff',
    infoDark: '#0077cc',
    infoLight: '#33abff',

    link: '#0096ff',
    linkHover: '#0077cc',
    linkActive: '#0066cc',

    buttonPrimary: '#ff2d55',
    buttonPrimaryHover: '#e60033',
    buttonPrimaryActive: '#d10030',
    buttonSecondary: '#0096ff',
    buttonSecondaryHover: '#0077cc',
    buttonSecondaryActive: '#0066cc',

    shadow: '#00000080',
    highlight: '#ffffff10',

    overlay: '#121212cc',
    disabled: '#4b5563'
  }
};

// Define the light variant of the Night City theme
const nightCityLight: Theme = {
  id: 'nightCity-light',
  name: 'Night City Light',
  colors: {
    primary: '#ff2d55',
    primaryDark: '#d10030',
    primaryLight: '#ff5c7c',
    primaryHover: '#ff2d5580',
    primaryActive: '#e60033',

    secondary: '#0096ff',
    secondaryDark: '#0066cc',
    secondaryLight: '#33abff',
    secondaryHover: '#0096ff80',
    secondaryActive: '#0077cc',

    background: '#f7f7f7',
    backgroundAlt: '#eeeeee',
    backgroundLight: '#ffffff',
    backgroundDark: '#e0e0e0',

    card: '#ffffff',
    cardHover: '#f2f2f2',
    cardActive: '#e0e0e0',

    border: '#dcdcdc',
    borderLight: '#e0e0e0',
    borderDark: '#c0c0c0',

    text: '#333333',
    textPrimary: '#333333',
    textLight: '#555555',
    textDark: '#222222',
    textMuted: '#777777',
    textSecondary: '#555555',

    success: '#36d399',
    successDark: '#2baf7c',
    successLight: '#5ddcac',

    danger: '#ff2d55',
    dangerDark: '#e60033',
    dangerLight: '#ff5c7c',

    warning: '#ffb400',
    warningDark: '#cc9000',
    warningLight: '#ffc333',

    info: '#0096ff',
    infoDark: '#0077cc',
    infoLight: '#33abff',

    link: '#0096ff',
    linkHover: '#0077cc',
    linkActive: '#0066cc',

    buttonPrimary: '#ff2d55',
    buttonPrimaryHover: '#e60033',
    buttonPrimaryActive: '#d10030',
    buttonSecondary: '#0096ff',
    buttonSecondaryHover: '#0077cc',
    buttonSecondaryActive: '#0066cc',

    shadow: '#00000040',
    highlight: '#00000010',

    overlay: '#ffffffcc',
    disabled: '#a1a1a1'
  }
};

export { nightCityDark, nightCityLight };
