import type { Theme } from './types';

const themenamedark: Theme = {
  id: 'cyberpunk-dark', // Unique identifier for the dark theme variant
  name: 'Cyberpunk Dark', // Display name for the dark theme
  colors: { // Begin dark theme color definitions
    primary: '#00e0ff', // Electric Cyan/Blue for primary UI elements, neon highlight
    primaryDark: '#00b8d4', // Darker shade of primary cyan
    primaryLight: '#61efff', // Lighter, brighter shade of primary cyan
    primaryHover: '#00e0ff80', // Semi-transparent primary cyan for hover effects
    primaryActive: '#0099b0', // Deeper cyan for active state interactions

    secondary: '#f500ff', // Vibrant Magenta/Pink for secondary actions and accents
    secondaryDark: '#c400cc', // Darker shade of magenta
    secondaryLight: '#f733ff', // Lighter, more intense magenta
    secondaryHover: '#f500ff80', // Semi-transparent magenta for hover states
    secondaryActive: '#a300a8', // Deeper magenta for active state elements

    background: '#0a0a1a', // Very dark, deep blue/purple background, like a night city sky
    backgroundAlt: '#14142b', // Slightly lighter dark background for variation
    backgroundLight: '#1f1f3d', // Lighter background variant for panels or contrast areas
    backgroundDark: '#030308', // Near black for deepest background areas

    card: '#14142b', // Card background using the alternate dark background color
    cardHover: '#1f1f3d', // Card color on hover, using the lighter background variant
    cardActive: '#2a2a4f', // Card color when active or pressed, slightly more prominent

    border: '#33334d', // Dark, subtle border color, complements the background
    borderLight: '#4d4d6b', // Lighter border variant
    borderDark: '#1f1f3d', // Darker border variant, blending more with background

    text: '#e0e0e0', // Light grey text for readability on dark backgrounds
    textPrimary: '#f0f0f0', // Slightly brighter primary text color
    textLight: '#ffffff', // Pure white text for high emphasis
    textDark: '#b3b3b3', // Dimmer grey text
    textMuted: '#808080', // Muted grey text for less prominent content
    textSecondary: '#a0a0cc', // Secondary text with a subtle blue/purple tint

    success: '#00ff80', // Neon Green for success states
    successDark: '#00cc66', // Darker shade of neon green
    successLight: '#66ffb3', // Lighter shade of neon green

    danger: '#ff4d4d', // Bright Red for errors or critical warnings
    dangerDark: '#cc0000', // Darker, more intense red
    dangerLight: '#ff8080', // Lighter shade of red

    warning: '#ffea00', // Bright Yellow for warnings
    warningDark: '#cccc00', // Darker shade of yellow
    warningLight: '#fff066', // Lighter shade of yellow

    info: '#00e0ff', // Info color using the primary cyan
    infoDark: '#00b8d4', // Darker variant of info
    infoLight: '#61efff', // Lighter variant of info

    link: '#00e0ff', // Link color using primary cyan for consistency
    linkHover: '#61efff', // Lighter cyan on hover for clear feedback
    linkActive: '#0099b0', // Deeper cyan when active/clicked

    buttonPrimary: '#00e0ff', // Primary button background using primary cyan (ensure text is dark)
    buttonPrimaryHover: '#00b8d4', // Darker cyan on hover
    buttonPrimaryActive: '#0099b0', // Deepest cyan on active

    buttonSecondary: '#f500ff', // Secondary button background using magenta (ensure text is dark/light)
    buttonSecondaryHover: '#c400cc', // Darker magenta on hover
    buttonSecondaryActive: '#a300a8', // Deepest magenta on active

    shadow: '#000000a0', // Pronounced black shadow with transparency for depth
    highlight: '#00e0ff30', // Subtle highlight using primary cyan with transparency

    overlay: '#0a0a1acc', // Dark overlay using background color with transparency
    disabled: '#555566' // Muted, dark grey for disabled elements
  } // End dark theme color definitions
}; // End of Cyberpunk Dark theme

const themenamelight: Theme = {
  id: 'cyberpunk-light', // Unique identifier for the light theme variant
  name: 'Cyberpunk Light', // Display name for the light theme
  colors: { // Begin light theme color definitions
    primary: '#00b8d4', // Using the darker primary cyan for better contrast on light backgrounds
    primaryDark: '#0099b0', // Darker shade
    primaryLight: '#33c6bb', // Lighter shade
    primaryHover: '#00b8d480', // Semi-transparent hover
    primaryActive: '#007a8c', // Even darker active state

    secondary: '#c400cc', // Using the darker magenta for better contrast
    secondaryDark: '#a300a8', // Darker shade
    secondaryLight: '#f733ff', // Lighter shade (can be very bright)
    secondaryHover: '#c400cc80', // Semi-transparent hover
    secondaryActive: '#820086', // Even darker active state

    background: '#f0f0f5', // Light grey/off-white background
    backgroundAlt: '#e0e0e5', // Slightly darker light grey
    backgroundLight: '#ffffff', // Pure white for primary content areas
     backgroundDark: '#d0d0d5', // Noticeable grey for contrast areas

    card: '#ffffff', // White card background for a clean look
    cardHover: '#f7f7fa', // Very subtle grey on hover
    cardActive: '#f0f0f5', // Active card matches the main background

    border: '#d0d0d5', // Light grey border color
    borderLight: '#e0e0e5', // Lighter border variant
    borderDark: '#b0b0b5', // Darker border variant for more definition

    text: '#1a1a1a', // Very dark grey/near black text for readability
    textPrimary: '#0d0d0d', // Primary text color, almost black
    textLight: '#4d4d4d', // Lighter dark grey
    textDark: '#000000', // Pure black text for high emphasis
    textMuted: '#808080', // Medium grey for muted text
    textSecondary: '#666666', // Slightly darker grey for secondary details

    success: '#00cc66', // Using darker success green for contrast
    successDark: '#00994d', // Darker shade
    successLight: '#33ff99', // Lighter shade

    danger: '#cc0000', // Using darker danger red for contrast
    dangerDark: '#a30000', // Darker shade
    dangerLight: '#ff4d4d', // Lighter shade

    warning: '#cccc00', // Using darker warning yellow for contrast
    warningDark: '#a3a300', // Darker shade
    warningLight: '#ffea00', // Lighter shade

    info: '#00b8d4', // Info color using the adjusted primary cyan
    infoDark: '#0099b0', // Darker variant
    infoLight: '#61efff', // Lighter variant

    link: '#0099b0', // Link color using a darker cyan for readability
    linkHover: '#007a8c', // Darker cyan on hover
    linkActive: '#005c66', // Deepest cyan when active/clicked

    buttonPrimary: '#00b8d4', // Primary button uses darker cyan (ensure text is light)
    buttonPrimaryHover: '#0099b0', // Darker on hover
    buttonPrimaryActive: '#007a8c', // Darkest on active

    buttonSecondary: '#c400cc', // Secondary button uses darker magenta (ensure text is light)
    buttonSecondaryHover: '#a300a8', // Darker on hover
    buttonSecondaryActive: '#820086', // Darkest on active

    shadow: '#0000002a', // Subtle black shadow with transparency
    highlight: '#00b8d430', // Subtle highlight using primary color with transparency

    overlay: '#ffffffcc', // Light overlay using white with transparency
    disabled: '#b0b0b5' // Muted light grey for disabled elements
  } // End light theme color definitions
}; // End of the Cyberpunk Light theme

export { themenamedark, themenamelight };
