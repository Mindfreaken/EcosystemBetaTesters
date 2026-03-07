import type { Theme } from './types'; // Import the Theme type from the types module

// Dark version of the Futuristic Blue theme
const futuristicBlueDark: Theme = { // Define the dark theme variant
  id: 'futuristicBlue-dark', // Unique identifier for the dark Futuristic Blue theme
  name: 'Futuristic Blue Dark', // Display name for the dark theme
  colors: { // Begin defining the color palette for the dark theme
    primary: '#536dfe', // Primary color: vibrant, pop blue
    primaryDark: '#3d5afe', // Darker vibrancy for primary
    primaryLight: '#8c9eff', // Lighter, eye-catching variant of primary
    primaryHover: '#536dfecc', // Semi-transparent hover effect for primary
    primaryActive: '#304ffe', // Active state: deep vibrant blue

    secondary: '#00e5ff', // Bright, vibrant cyan for accents
    secondaryDark: '#00b8d4', // Darker shade of vibrant cyan
    secondaryLight: '#66fff9', // Lighter tint for cyan accents
    secondaryHover: '#00e5ffcc', // Semi-transparent hover effect for secondary
    secondaryActive: '#008fa0', // Active state: deeper cyan

    background: '#0a0d1a', // Deep, dark background with a blue undertone
    backgroundAlt: '#141a2e', // Alternate dark background for contrast
    backgroundLight: '#1e243a', // Lighter variant of background for subtle contrast
    backgroundDark: '#040a12', // Even darker variant for depth

    card: '#141a2e', // Card background with a hint of blue
    cardHover: '#1e243a', // Card hover color with enhanced vibrancy
    cardActive: '#272c45', // Card active state with deeper tone

    border: '#1e243a', // Border color matching card background
    borderLight: '#272c45', // Lighter border variant for subtle outlines
    borderDark: '#141a2e', // Darker border for contrast

    text: '#e0e6f8', // Crisp, light text for readability
    textPrimary: '#ffffff', // White primary text for high contrast
    textLight: '#ffffff', // Lighter text variant
    textDark: '#c0c7e0', // Slightly darker shade for emphasis
    textMuted: '#8895b2', // Muted text for less prominence
    textSecondary: '#a4b0c8', // Secondary text for supporting info

    success: '#00ff7f', // Vibrant success green
    successDark: '#00cc6a', // Darker success green
    successLight: '#66ff9f', // Lighter success green

    danger: '#ff3b30', // Vibrant red for error states
    dangerDark: '#cc2b24', // Darker error red
    dangerLight: '#ff6b61', // Lighter error red

    warning: '#ffd700', // Bright yellow for warnings
    warningDark: '#ccaf00', // Darker shade for warning
    warningLight: '#ffee33', // Lighter tint for warning

    info: '#448aff', // Vibrant blue for informational alerts
    infoDark: '#2979ff', // Darker shade for info
    infoLight: '#82b1ff', // Lighter shade for info emphasis

    link: '#536dfe', // Link color matching primary vibrant blue
    linkHover: '#8c9eff', // Darker hover for links
    linkActive: '#3d5afe', // Active link color, deeper blue

    buttonPrimary: '#536dfe', // Primary button background
    buttonPrimaryHover: '#3d5afe', // Hover state for primary button
    buttonPrimaryActive: '#304ffe', // Active state for primary button

    buttonSecondary: '#00e5ff', // Secondary button background
    buttonSecondaryHover: '#00b8d4', // Hover state for secondary button
    buttonSecondaryActive: '#008fa0', // Active state for secondary button

    shadow: '#00000080', // Shadow for depth effect
    highlight: '#ffffff40', // Subtle white highlight for accents

    overlay: '#0a0d1acc', // Overlay color with transparency for modals
    disabled: '#6b7280' // Disabled state indicator
  } // End of dark theme color definitions
}; // End of the Futuristic Blue Dark theme

// Light version of the Futuristic Blue theme
const futuristicBlueLight: Theme = { // Define the light theme variant
  id: 'futuristicBlue-light', // Unique identifier for the light Futuristic Blue theme
  name: 'Futuristic Blue Light', // Display name for the light theme
  colors: { // Begin defining the color palette for the light theme
    primary: '#536dfe', // Primary vibrant blue for light theme
    primaryDark: '#3d5afe', // Darker primary blue for contrast
    primaryLight: '#8c9eff', // Lighter primary blue for highlights
    primaryHover: '#536dfecc', // Semi-transparent primary hover effect
    primaryActive: '#304ffe', // Active primary button color

    secondary: '#00e5ff', // Vibrant cyan for secondary elements
    secondaryDark: '#00b8d4', // Darker cyan for contrast
    secondaryLight: '#66fff9', // Lighter cyan accent
    secondaryHover: '#00e5ffcc', // Hover state for secondary elements
    secondaryActive: '#008fa0', // Active secondary state

    background: '#e0f7fa', // Bright, airy background with a blue tint
    backgroundAlt: '#f0fbff', // Alternate light background for subtle contrast
    backgroundLight: '#ffffff', // Pure white background
    backgroundDark: '#d0e9f2', // Darker variant of the light background

    card: '#ffffff', // Card background in light theme
    cardHover: '#f9fbff', // Card hover color with gentle blue tint
    cardActive: '#f0f3f8', // Active card background with subtle contrast

    border: '#cfd8dc', // Light border color for cards
    borderLight: '#e0f0f4', // Even lighter border for emphasis
    borderDark: '#a0b4ba', // Darker border for stronger definition

    text: '#0d1b2a', // Dark text for readability in light theme
    textPrimary: '#102a43', // Primary dark text for key content
    textLight: '#3a506b', // Light text variant for supportive content
    textDark: '#000000', // Black text for high emphasis
    textMuted: '#6b7c8c', // Muted text color for less prominent info
    textSecondary: '#4b5563', // Secondary text for supporting details

    success: '#00ff7f', // Vibrant success green
    successDark: '#00cc6a', // Darker success green
    successLight: '#66ff9f', // Lighter success green

    danger: '#ff3b30', // Vibrant red for errors
    dangerDark: '#cc2b24', // Darker red for errors
    dangerLight: '#ff6b61', // Lighter red for errors

    warning: '#ffd700', // Bright yellow for warnings
    warningDark: '#ccaf00', // Darker warning hue
    warningLight: '#ffee33', // Lighter warning tint

    info: '#448aff', // Vibrant blue for informational messages
    infoDark: '#2979ff', // Darker info blue
    infoLight: '#82b1ff', // Lighter info blue

    link: '#536dfe', // Link color aligning with primary blue
    linkHover: '#8c9eff', // Hover color for links
    linkActive: '#3d5afe', // Active link color

    buttonPrimary: '#536dfe', // Primary button background
    buttonPrimaryHover: '#3d5afe', // Hover state for primary button
    buttonPrimaryActive: '#304ffe', // Active state for primary button

    buttonSecondary: '#00e5ff', // Secondary button background
    buttonSecondaryHover: '#00b8d4', // Hover state for secondary button
    buttonSecondaryActive: '#008fa0', // Active state for secondary button

    shadow: '#0000001a', // Subtle shadow for depth
    highlight: '#536dfe25', // Subtle blue highlight for accents

    overlay: '#102a4355', // Overlay with transparency for modal popups
    disabled: '#b0bec5' // Disabled element indicator
  } // End of light theme color definitions
}; // End of the Futuristic Blue Light theme

export { futuristicBlueDark, futuristicBlueLight }; // Export both dark and light theme variants for use in the application
