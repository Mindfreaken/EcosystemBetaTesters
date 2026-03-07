import type { Theme } from './types'; // Import the Theme type from the types module

// Dark version of the Valorant theme (Gamer)
const valorantDark: Theme = { // Define the dark variant of the Valorant theme
  id: 'valorant-dark', // Unique identifier for the dark Valorant theme
  name: 'Gamer Dark', // Display name for the dark theme variant
  colors: { // Begin dark theme color definitions
    primary: '#FF4655', // Primary color: bold red used for key UI elements
    primaryDark: '#FF1F30', // Darker variant of primary for added emphasis
    primaryLight: '#ff6b78', // Lighter variant of primary for subtle highlights
    primaryHover: '#FF465580', // Semi-transparent primary color for hover states
    primaryActive: '#cc1924', // Primary color when an element is active

    secondary: '#00E1FF', // Secondary color: bright cyan for accents
    secondaryDark: '#00a9c7', // Darker variant of secondary for stronger emphasis
    secondaryLight: '#33ebff', // Lighter variant of secondary for visual highlights
    secondaryHover: '#00E1FF90', // Semi-transparent secondary for hover effects
    secondaryActive: '#008aa0', // Secondary color when active

    background: '#0F1923', // Dark background color for the overall interface
    backgroundAlt: '#1F2731', // Alternate dark background for subtle variation
    backgroundLight: '#2B333D', // Lighter variant of background for contrast
    backgroundDark: '#09111A', // Darker variant of background for depth

    card: '#1F2731', // Card background color in dark mode
    cardHover: '#2B333D', // Card background on hover to indicate interactivity
    cardActive: '#3B4452', // Card background when active

    border: '#364966', // Default border color for UI elements
    borderLight: '#5a6f91', // Lighter border variant for subtle outlines
    borderDark: '#2b3d57', // Darker border variant for emphasis

    text: '#FFFFFF', // Default text color: white for readability on dark backgrounds
    textPrimary: '#FFFFFF', // Primary text color for main content
    textLight: '#ffffff', // Lighter text variant for emphasized text
    textDark: '#d6d6d6', // Slightly darker text variant for contrast
    textMuted: '#7B8B9D', // Muted text color for less prominent content
    textSecondary: '#6A7B8D', // Secondary text color for supporting details

    success: '#1ABF2B', // Success color: green for positive actions
    successDark: '#148820', // Darker variant of success for emphasis
    successLight: '#38e046', // Lighter variant of success for highlights

    danger: '#FF4655', // Danger color: bold red for errors or alerts
    dangerDark: '#cc1924', // Darker variant of danger for stronger alerts
    dangerLight: '#ff6b78', // Lighter variant of danger for softer warnings

    warning: '#FFA500', // Warning color: orange for cautionary messages
    warningDark: '#cc8400', // Darker variant of warning for emphasis
    warningLight: '#ffc233', // Lighter variant of warning for highlights

    info: '#00E1FF', // Informational color: bright cyan for neutral messages
    infoDark: '#00a9c7', // Darker variant of info for contrast
    infoLight: '#33ebff', // Lighter variant of info for clarity

    link: '#FF4655', // Link color: uses primary color to indicate interactivity
    linkHover: '#cc1924', // Link color on hover for visual feedback
    linkActive: '#a8141d', // Link color when active or clicked

    buttonPrimary: '#FF4655', // Primary button background color
    buttonPrimaryHover: '#cc1924', // Primary button hover color for responsiveness
    buttonPrimaryActive: '#a8141d', // Primary button active color for tactile feedback

    buttonSecondary: '#00E1FF', // Secondary button background color
    buttonSecondaryHover: '#00a9c7', // Secondary button hover color for interactivity
    buttonSecondaryActive: '#008aa0', // Secondary button active color for feedback

    shadow: '#00000033', // Shadow color with transparency to add depth
    highlight: '#ffffff22', // Highlight color with transparency for subtle accents

    overlay: '#0F1923AA', // Overlay color with transparency for modals/popups
    disabled: '#4b5563' // Disabled element color to indicate inactivity
  } // End of dark theme color definitions
}; // End of the Valorant Dark theme

// Light version of the Valorant theme
const valorantLight: Theme = { // Define the light variant of the Valorant theme
  id: 'valorant-light', // Unique identifier for the light Valorant theme
  name: 'Gamer Light', // Display name for the light theme variant
  colors: { // Begin light theme color definitions
    primary: '#FF4655', // Primary color remains the same for brand consistency
    primaryDark: '#FF1F30', // Darker variant of primary for contrast
    primaryLight: '#ff6b78', // Lighter variant of primary for highlights
    primaryHover: '#FF465580', // Semi-transparent primary color for hover effects
    primaryActive: '#cc1924', // Primary color when active

    secondary: '#00E1FF', // Secondary color remains the same for consistency
    secondaryDark: '#00a9c7', // Darker variant of secondary for emphasis
    secondaryLight: '#33ebff', // Lighter variant of secondary for visual highlights
    secondaryHover: '#00E1FF90', // Semi-transparent secondary for hover effects
    secondaryActive: '#008aa0', // Secondary color when active

    background: '#FFFFFF', // Light background color for a bright, clean interface
    backgroundAlt: '#F0F2F5', // Alternate light background for subtle variation
    backgroundLight: '#FFFFFF', // Pure white background for primary sections
    backgroundDark: '#E0E3E8', // Slightly darker background variant for contrast

    card: '#FFFFFF', // Card background set to white for clarity and cleanliness
    cardHover: '#F7F9FB', // Card background on hover for gentle interactivity
    cardActive: '#E8EBEF', // Card background when active for visual feedback

    border: '#E0E3E8', // Border color for light theme elements
    borderLight: '#F0F2F5', // Lighter border variant for delicate outlines
    borderDark: '#CCD0D5', // Darker border variant for stronger definition

    text: '#0F1923', // Default text color: dark for optimal readability on light backgrounds
    textPrimary: '#0F1923', // Primary text color for main content
    textLight: '#333333', // Lighter text variant for less prominent content
    textDark: '#000000', // Darker text variant for strong emphasis
    textMuted: '#7B8B9D', // Muted text color for secondary or disabled content
    textSecondary: '#6A7B8D', // Secondary text color for supporting details

    success: '#1ABF2B', // Success color remains consistent with the dark theme
    successDark: '#148820', // Darker variant of success for emphasis
    successLight: '#38e046', // Lighter variant of success for highlights

    danger: '#FF4655', // Danger color remains consistent with the dark theme
    dangerDark: '#cc1924', // Darker variant of danger for stronger alerts
    dangerLight: '#ff6b78', // Lighter variant of danger for softer warnings

    warning: '#FFA500', // Warning color remains consistent for cautionary messages
    warningDark: '#cc8400', // Darker variant of warning for emphasis
    warningLight: '#ffc233', // Lighter variant of warning for highlights

    info: '#00E1FF', // Informational color remains consistent with the dark theme
    infoDark: '#00a9c7', // Darker variant of info for contrast
    infoLight: '#33ebff', // Lighter variant of info for clarity

    link: '#FF4655', // Link color remains the same for brand consistency
    linkHover: '#cc1924', // Link color on hover for visual feedback
    linkActive: '#a8141d', // Link color when active or clicked

    buttonPrimary: '#FF4655', // Primary button background color remains for consistency
    buttonPrimaryHover: '#cc1924', // Primary button hover color for responsiveness
    buttonPrimaryActive: '#a8141d', // Primary button active color for tactile feedback

    buttonSecondary: '#00E1FF', // Secondary button background color remains for consistency
    buttonSecondaryHover: '#00a9c7', // Secondary button hover color for interactivity
    buttonSecondaryActive: '#008aa0', // Secondary button active color for feedback

    shadow: '#0000001a', // Light shadow with transparency for subtle depth in light mode
    highlight: '#ffffff22', // Highlight color with transparency for gentle accents

    overlay: '#FFFFFFAA', // Light overlay color with transparency for modals/popups
    disabled: '#B0B0B0' // Disabled element color adjusted for light theme readability
  } // End of light theme color definitions
}; // End of the Valorant Light theme

export { valorantDark, valorantLight }; // Export both theme variants for use in the application
