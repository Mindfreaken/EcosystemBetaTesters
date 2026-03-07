import type { Theme } from './types';

// Dark version of the Haunted Grove theme
const hauntedGroveDark: Theme = {
  id: 'hauntedGrove-dark', // Unique identifier for the dark theme
  name: 'Haunted Grove Dark', // Display name for the dark theme
  colors: {
    primary: '#2e4d30', // Primary: Deep, dark forest green for an eerie vibe
    primaryDark: '#273d27', // Darker variant for added spookiness
    primaryLight: '#4b6d4a', // Lighter, ghostly green for subtle highlights
    primaryHover: '#2e4d3080', // Semi-transparent eerie green for hover effects
    primaryActive: '#243926', // Deeper green for active elements

    secondary: '#5a3e66', // Secondary: Muted, ghostly purple for contrasting accents
    secondaryDark: '#4d375b', // Darker shade for emphasis
    secondaryLight: '#7d5c89', // Lighter tint for soft highlights
    secondaryHover: '#5a3e6680', // Semi-transparent accent for hover effects
    secondaryActive: '#45304e', // Darker accent for active states

    background: '#0c1415', // Background: Nearly black with a hint of forest green for a spooky atmosphere
    backgroundAlt: '#121d1a', // Alternate background for subtle contrast
    backgroundLight: '#1a2926', // Lighter background variant for depth
    backgroundDark: '#080e0f', // Darkest background for high contrast areas

    card: '#121d1a', // Card: Cohesive dark tone matching the alternate background
    cardHover: '#1a2926', // Card hover: Slightly lighter for interactive feedback
    cardActive: '#22332f', // Card active: Deeper tone indicating active state

    border: '#1d2a27', // Border: Dark green for outlining elements
    borderLight: '#2a3a36', // Lighter border variant for subtle accents
    borderDark: '#162520', // Darker border for defined edges

    text: '#d0e8dc', // Text: Pale, ghostly green for high readability on dark backgrounds
    textPrimary: '#d0e8dc', // Primary text color
    textLight: '#e4f2ec', // Lighter text for emphasis
    textDark: '#b0cac2', // Slightly subdued for less prominence
    textMuted: '#8c9b92', // Muted tone for secondary text
    textSecondary: '#a3b3ab', // Alternative muted tone for supporting copy

    success: '#3cff8a', // Success: Neon green indicating positive actions
    successDark: '#38d17a', // Darker variant for emphasis
    successLight: '#70ffb0', // Lighter variant for subtle success cues

    danger: '#a83232', // Danger: Blood red to signal horror and alerts
    dangerDark: '#8d2b2b', // Darker blood red for strong emphasis
    dangerLight: '#d14a4a', // Lighter red for gentle warnings

    warning: '#d08800', // Warning: Eerie amber for cautionary messages
    warningDark: '#b36c00', // Darker amber for emphasis
    warningLight: '#e2a700', // Lighter tint for subtle alerts

    info: '#4a90e2', // Info: Ghostly blue for informational messages
    infoDark: '#3a78c2', // Darker blue for contrast
    infoLight: '#7bb4f0', // Lighter blue for gentle highlights

    link: '#3eb0a0', // Link: Luminescent teal for interactive links
    linkHover: '#50c0b2', // Darker hover for visual feedback
    linkActive: '#369e8e', // Active link: Deeper teal for emphasis

    buttonPrimary: '#2e4d30', // Button primary: Matches primary for a cohesive spooky feel
    buttonPrimaryHover: '#273d27', // Hover state: Darker for interactive feedback
    buttonPrimaryActive: '#243926', // Active state: Deepened tone

    buttonSecondary: '#5a3e66', // Button secondary: Uses secondary for accentuation
    buttonSecondaryHover: '#4d375b', // Hover state: Darker for emphasis
    buttonSecondaryActive: '#45304e', // Active state: Even deeper accent

    shadow: '#00000080', // Shadow: Semi-transparent black to add depth
    highlight: '#ffffff15', // Highlight: Subtle ghostly glow for gentle emphasis

    overlay: '#080e0fcc', // Overlay: Dark semi-transparent overlay for modals or focus areas
    disabled: '#4b5563' // Disabled: Muted dark grey for disabled elements
  }
};

// Light version of the Haunted Grove theme
const hauntedGroveLight: Theme = {
  id: 'hauntedGrove-light', // Unique identifier for the light theme
  name: 'Haunted Grove Light', // Display name for the light theme
  colors: {
    primary: '#5d7c62', // Primary: Subdued, eerie green with a ghostly tint
    primaryDark: '#556e57', // Darker variant for emphasis
    primaryLight: '#7b9d82', // Lighter, soft green for subtle highlights
    primaryHover: '#5d7c6280', // Semi-transparent effect for hover states
    primaryActive: '#4a6450', // Active state: Deeper tone

    secondary: '#8d6b7d', // Secondary: Muted plum for a haunted accent
    secondaryDark: '#7a5a6a', // Darker shade for stronger emphasis
    secondaryLight: '#a17c9a', // Lighter tint for gentle highlights
    secondaryHover: '#8d6b7d80', // Semi-transparent for hover effects
    secondaryActive: '#754e69', // Darker accent for active states

    background: '#e8ecea', // Background: Off-white with a ghostly tint for a haunting light mode
    backgroundAlt: '#dfe3e1', // Alternate background for subtle contrast
    backgroundLight: '#ffffff', // Pure white for maximum brightness
    backgroundDark: '#c8d0ce', // Darker variant for gentle depth

    card: '#ffffff', // Card: Clean white to maintain clarity
    cardHover: '#f4f8f6', // Card hover: Slightly tinted for interactive feedback
    cardActive: '#e9f1ef', // Card active: Subtle tone for active state

    border: '#b0bdb7', // Border: Light grey-green for clear separation
    borderLight: '#c7d1cb', // Lighter border for emphasis
    borderDark: '#98a8a2', // Darker border for definition

    text: '#3d493d', // Text: Dark, earthy tone for readability
    textPrimary: '#3d493d', // Primary text color
    textLight: '#5a685a', // Lighter text for subtle emphasis
    textDark: '#2b362b', // Darker text for strong emphasis
    textMuted: '#7c8e7c', // Muted tone for secondary text
    textSecondary: '#6b7a6b', // Alternative tone for supporting copy

    success: '#44ff92', // Success: Vibrant neon green for positive actions
    successDark: '#3ce17e', // Darker variant for emphasis
    successLight: '#70ffb0', // Lighter variant for subtle cues

    danger: '#a83232', // Danger: Blood red to indicate horror and alerts
    dangerDark: '#8d2b2b', // Darker red for strong emphasis
    dangerLight: '#d14a4a', // Lighter red for gentle warnings

    warning: '#d08800', // Warning: Eerie amber for cautionary messages
    warningDark: '#b36c00', // Darker amber for emphasis
    warningLight: '#e2a700', // Lighter tint for subtle alerts

    info: '#4a90e2', // Info: Ghostly blue for informational messages
    infoDark: '#3a78c2', // Darker blue for contrast
    infoLight: '#7bb4f0', // Lighter blue for gentle highlights

    link: '#3eb0a0', // Link: Luminescent teal for interactive links
    linkHover: '#50c0b2', // Hover state: Darker teal for visual feedback
    linkActive: '#369e8e', // Active state: Deeper teal for emphasis

    buttonPrimary: '#5d7c62', // Button primary: Uses primary color for cohesiveness
    buttonPrimaryHover: '#556e57', // Hover state: Darker shade for interactivity
    buttonPrimaryActive: '#4a6450', // Active state: Deeper tone

    buttonSecondary: '#8d6b7d', // Button secondary: Derived from secondary for accent buttons
    buttonSecondaryHover: '#7a5a6a', // Hover state: Darker for emphasis
    buttonSecondaryActive: '#754e69', // Active state: Even deeper accent

    shadow: '#00000040', // Shadow: Subtle shadow for depth in light mode
    highlight: '#00000010', // Highlight: Very subtle dark highlight

    overlay: '#ffffffcc', // Overlay: Semi-transparent white for modals or overlays in light mode
    disabled: '#7c8e7c' // Disabled: Muted grey-green to indicate disabled elements
  }
};

export { hauntedGroveDark, hauntedGroveLight };
