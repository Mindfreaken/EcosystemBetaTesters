import type { Theme } from './types';

const themenamedark: Theme = {
  id: 'cyberpunkPurple-dark', // Unique identifier for the dark theme variant
  name: 'Cyberpunk Purple Dark', // Display name for the dark theme
  colors: { // Begin dark theme color definitions
    primary: '#9d00ff', // Vibrant Purple for primary UI elements, main neon highlight
    primaryDark: '#7e00cc', // Darker shade of primary purple
    primaryLight: '#b133ff', // Lighter, brighter shade of primary purple
    primaryHover: '#9d00ff80', // Semi-transparent primary purple for hover effects
    primaryActive: '#6500a3', // Deeper purple for active state interactions

    secondary: '#00f5d4', // Bright Teal/Cyan as a contrasting secondary neon color
    secondaryDark: '#00c4a9', // Darker shade of secondary teal
    secondaryLight: '#33f7de', // Lighter shade of secondary teal
    secondaryHover: '#00f5d480', // Semi-transparent secondary teal for hover states
    secondaryActive: '#00a38d', // Deeper teal for active state elements

    background: '#100c14', // Very dark, deep purple-tinged background
    backgroundAlt: '#1c1621', // Slightly lighter dark purple background
    backgroundLight: '#28202e', // Lighter background variant for panels or contrast
    backgroundDark: '#060408', // Near black for deepest areas

    card: '#1c1621', // Card background using the alternate dark background
    cardHover: '#28202e', // Card color on hover, using the lighter background variant
    cardActive: '#342a3b', // Card color when active or pressed

    border: '#342a3b', // Dark, subtle border color, complementing the dark purple background
    borderLight: '#4d3e55', // Lighter border variant
    borderDark: '#28202e', // Darker border variant

    text: '#e8e0f0', // Light grey text with a very subtle purple tint for readability
    textPrimary: '#f5f0fa', // Brighter primary text color
    textLight: '#ffffff', // Pure white text for high emphasis
    textDark: '#b8b0c0', // Dimmer grey text
    textMuted: '#888090', // Muted grey text for less prominent content
    textSecondary: '#a8a0b0', // Secondary text, slightly muted

    success: '#00ff80', // Neon Green for success states (contrasts well with purple)
    successDark: '#00cc66', // Darker shade of neon green
    successLight: '#66ffb3', // Lighter shade of neon green

    danger: '#ff4d4d', // Bright Red for errors or critical warnings
    dangerDark: '#cc0000', // Darker, more intense red
    dangerLight: '#ff8080', // Lighter shade of red

    warning: '#ffea00', // Bright Yellow for warnings
    warningDark: '#cccc00', // Darker shade of yellow
    warningLight: '#fff066', // Lighter shade of yellow

    info: '#00f5d4', // Info color using the secondary teal
    infoDark: '#00c4a9', // Darker variant of info
    infoLight: '#33f7de', // Lighter variant of info

    link: '#b133ff', // Link color using the lighter primary purple for visibility
    linkHover: '#c466ff', // Even lighter purple on hover
    linkActive: '#9d00ff', // Base primary purple when active/clicked

    buttonPrimary: '#9d00ff', // Primary button background using primary purple (ensure text is light)
    buttonPrimaryHover: '#7e00cc', // Darker purple on hover
    buttonPrimaryActive: '#6500a3', // Deepest purple on active

    buttonSecondary: '#00f5d4', // Secondary button background using teal (ensure text is dark)
    buttonSecondaryHover: '#00c4a9', // Darker teal on hover
    buttonSecondaryActive: '#00a38d', // Deepest teal on active

    shadow: '#000000a0', // Pronounced black shadow with transparency
    highlight: '#9d00ff30', // Subtle highlight using primary purple with transparency

    overlay: '#100c14cc', // Dark overlay using background color with transparency
    disabled: '#5a5263' // Muted, dark grey/purple for disabled elements
  } // End dark theme color definitions
}; // End of Cyberpunk Purple Dark theme

const themenamelight: Theme = {
  id: 'cyberpunkPurple-light', // Unique identifier for the light theme variant
  name: 'Cyberpunk Purple Light', // Display name for the light theme
  colors: { // Begin light theme color definitions
    primary: '#7e00cc', // Using the darker primary purple for better contrast on light BG
    primaryDark: '#6500a3', // Darker shade
    primaryLight: '#9d00ff', // Lighter shade (original dark primary)
    primaryHover: '#7e00cc80', // Semi-transparent hover
    primaryActive: '#4c007a', // Even darker active state

    secondary: '#00c4a9', // Using the darker secondary teal for better contrast
    secondaryDark: '#00a38d', // Darker shade
    secondaryLight: '#00f5d4', // Lighter shade (original dark secondary)
    secondaryHover: '#00c4a980', // Semi-transparent hover
    secondaryActive: '#008271', // Even darker active state

    background: '#f2f0f5', // Light grey background with a subtle lavender tint
    backgroundAlt: '#e2e0e5', // Slightly darker light grey/lavender
    backgroundLight: '#ffffff', // Pure white for primary content areas
    backgroundDark: '#d2d0d5', // Noticeable grey for contrast areas

    card: '#ffffff', // White card background
    cardHover: '#f8f7fa', // Very subtle grey/lavender on hover
    cardActive: '#f2f0f5', // Active card matches the main background

    border: '#d2d0d5', // Light grey border color
    borderLight: '#e2e0e5', // Lighter border variant
    borderDark: '#b2b0b5', // Darker border variant

    text: '#1a1a1a', // Very dark grey/near black text for readability
    textPrimary: '#0d0d0d', // Primary text color, almost black
    textLight: '#4d4d4d', // Lighter dark grey
    textDark: '#000000', // Pure black text for high emphasis
    textMuted: '#808080', // Medium grey for muted text
    textSecondary: '#666666', // Slightly darker grey for secondary details

    success: '#00cc66', // Darker success green for contrast
    successDark: '#00994d', // Darker shade
    successLight: '#33ff99', // Lighter shade

    danger: '#cc0000', // Darker danger red for contrast
    dangerDark: '#a30000', // Darker shade
    dangerLight: '#ff4d4d', // Lighter shade

    warning: '#cccc00', // Darker warning yellow for contrast
    warningDark: '#a3a300', // Darker shade
    warningLight: '#ffea00', // Lighter shade

    info: '#00c4a9', // Info color using the adjusted secondary teal
    infoDark: '#00a38d', // Darker variant
    infoLight: '#33f7de', // Lighter variant

    link: '#7e00cc', // Link color using the adjusted primary purple for readability
    linkHover: '#6500a3', // Darker purple on hover
    linkActive: '#4c007a', // Deepest purple when active/clicked

    buttonPrimary: '#7e00cc', // Primary button uses adjusted primary purple (ensure text is light)
    buttonPrimaryHover: '#6500a3', // Darker on hover
    buttonPrimaryActive: '#4c007a', // Darkest on active

    buttonSecondary: '#00c4a9', // Secondary button uses adjusted teal (ensure text is dark)
    buttonSecondaryHover: '#00a38d', // Darker on hover
    buttonSecondaryActive: '#008271', // Darkest on active

    shadow: '#0000002a', // Subtle black shadow with transparency
    highlight: '#7e00cc30', // Subtle highlight using primary color with transparency

    overlay: '#ffffffcc', // Light overlay using white with transparency
    disabled: '#b2b0b5' // Muted light grey for disabled elements
  } // End light theme color definitions
}; // End of the Cyberpunk Purple Light theme


export { themenamedark, themenamelight };
