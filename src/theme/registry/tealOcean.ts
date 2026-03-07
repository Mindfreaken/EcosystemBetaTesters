import type { Theme } from './types'; // Import the Theme type from the types module

// Dark version of the Teal Ocean theme
const tealOceanDark: Theme = { // Define the dark variant of the Teal Ocean theme
  id: 'tealOcean-dark', // Unique identifier for the dark theme variant
  name: 'Teal Ocean Dark', // Display name for the dark theme
  colors: { // Begin dark theme color definitions
    primary: '#00b8a9', // Primary teal color for key UI elements
    primaryDark: '#008f85', // Darker shade of primary for added depth
    primaryLight: '#33c6bb', // Lighter shade of primary for subtle highlights
    primaryHover: '#00b8a980', // Semi-transparent primary color for hover effects
    primaryActive: '#007f75', // Primary color for active state interactions

    secondary: '#0582ca', // Secondary blue color for accents and actions
    secondaryDark: '#0467a2', // Darker shade of secondary for stronger emphasis
    secondaryLight: '#339bda', // Lighter shade of secondary for visual highlights
    secondaryHover: '#0582ca80', // Semi-transparent secondary for hover states
    secondaryActive: '#035e97', // Secondary color for active state elements

    background: '#051e3e', // Dark background color for the overall interface
    backgroundAlt: '#0a2f5e', // Alternate dark background for subtle variation
    backgroundLight: '#0e407e', // Lighter background variant for contrast
    backgroundDark: '#021326', // Darker background variant for depth

    card: '#0a2f5e', // Card background color in dark mode
    cardHover: '#0e407e', // Card color on hover to indicate interactivity
    cardActive: '#12519e', // Card color when active or pressed

    border: '#12519e', // Default border color for elements
    borderLight: '#1762bd', // Lighter border variant for subtle outlines
    borderDark: '#0e407e', // Darker border variant for stronger definition

    text: '#e3f6fc', // Default text color for readability on dark backgrounds
    textPrimary: '#e3f6fc', // Primary text color for main content
    textLight: '#f0fbff', // Lighter text variant for emphasis
    textDark: '#c7ebf5', // Slightly darker text variant for contrast
    textMuted: '#85c1d9', // Muted text color for less prominent content
    textSecondary: '#a7d7e8', // Secondary text color for supporting details

    success: '#00b8a9', // Success color, matching the primary for positive actions
    successDark: '#008f85', // Darker variant of success for emphasis
    successLight: '#33c6bb', // Lighter variant of success for highlights

    danger: '#f85c70', // Danger color for errors or warnings
    dangerDark: '#f62e48', // Darker variant of danger for stronger alerts
    dangerLight: '#fa8a98', // Lighter variant of danger for softer warnings

    warning: '#ffc045', // Warning color for cautionary messages
    warningDark: '#ffae12', // Darker shade of warning for emphasis
    warningLight: '#ffd378', // Lighter shade of warning for subtle highlights

    info: '#0582ca', // Informational color matching secondary for neutral messages
    infoDark: '#0467a2', // Darker variant of info for contrast
    infoLight: '#339bda', // Lighter variant of info for clarity

    link: '#0582ca', // Link color to denote interactivity
    linkHover: '#0467a2', // Link color on hover for visual feedback
    linkActive: '#035e97', // Link color when active or clicked

    buttonPrimary: '#00b8a9', // Primary button background color
    buttonPrimaryHover: '#008f85', // Primary button hover color for responsiveness
    buttonPrimaryActive: '#007f75', // Primary button active color for tactile feedback

    buttonSecondary: '#0582ca', // Secondary button background color
    buttonSecondaryHover: '#0467a2', // Secondary button hover color for interactivity
    buttonSecondaryActive: '#035e97', // Secondary button active color for feedback

    shadow: '#00000080', // Shadow color with transparency to add depth
    highlight: '#00b8a920', // Highlight color with transparency for subtle accents

    overlay: '#051e3ecc', // Overlay color with transparency for modals/popups
    disabled: '#526b8c' // Disabled element color to indicate inactivity
  } // End dark theme color definitions
}; // End of Teal Ocean Dark theme

// Light version of the Teal Ocean theme
const tealOceanLight: Theme = { // Define the light variant of the Teal Ocean theme
  id: 'tealOcean-light', // Unique identifier for the light theme variant
  name: 'Teal Ocean Light', // Display name for the light theme
  colors: { // Begin light theme color definitions
    primary: '#00b8a9', // Primary teal color remains for consistency
    primaryDark: '#008f85', // Darker shade of primary for contrast
    primaryLight: '#33c6bb', // Lighter shade of primary for highlights
    primaryHover: '#00b8a980', // Semi-transparent primary for hover effects
    primaryActive: '#007f75', // Primary color for active state interactions

    secondary: '#0582ca', // Secondary blue color for accents
    secondaryDark: '#0467a2', // Darker variant of secondary for emphasis
    secondaryLight: '#339bda', // Lighter variant of secondary for visual highlights
    secondaryHover: '#0582ca80', // Semi-transparent secondary for hover states
    secondaryActive: '#035e97', // Secondary color for active state elements

    background: '#e6f7f8', // Light background color for a bright, airy interface
    backgroundAlt: '#d6eef2', // Alternate light background for subtle variation
    backgroundLight: '#ffffff', // Pure white background for primary sections
    backgroundDark: '#cce8ec', // Slightly darker background variant for contrast

    card: '#ffffff', // Card background set to white for a clean look
    cardHover: '#f7f9fa', // Card background on hover for gentle interactivity
    cardActive: '#f0f4f7', // Card background when active to indicate selection

    border: '#cce8ec', // Border color for light theme elements
    borderLight: '#d6eef2', // Lighter border variant for delicate outlines
    borderDark: '#b0d0d6', // Darker border variant for stronger definition

    text: '#023e58', // Default text color: dark for optimal readability on light backgrounds
    textPrimary: '#023e58', // Primary text color for main content
    textLight: '#406d8a', // Lighter text variant for less emphasis
    textDark: '#012a36', // Darker text variant for strong emphasis
    textMuted: '#7f8c8d', // Muted text color for secondary or disabled content
    textSecondary: '#4a6572', // Secondary text color for supporting details

    success: '#00b8a9', // Success color remains consistent with primary
    successDark: '#008f85', // Darker success shade for emphasis
    successLight: '#33c6bb', // Lighter success shade for subtle highlights

    danger: '#f85c70', // Danger color for errors or alerts
    dangerDark: '#f62e48', // Darker danger shade for stronger alerts
    dangerLight: '#fa8a98', // Lighter danger shade for softer warnings

    warning: '#ffc045', // Warning color for cautionary messages
    warningDark: '#ffae12', // Darker warning shade for emphasis
    warningLight: '#ffd378', // Lighter warning shade for subtle highlights

    info: '#0582ca', // Informational color remains consistent with secondary
    infoDark: '#0467a2', // Darker info shade for contrast
    infoLight: '#339bda', // Lighter info shade for clarity

    link: '#0582ca', // Link color to denote interactivity
    linkHover: '#0467a2', // Link color on hover for visual feedback
    linkActive: '#035e97', // Link color when active or clicked

    buttonPrimary: '#00b8a9', // Primary button background color
    buttonPrimaryHover: '#008f85', // Primary button hover color for responsiveness
    buttonPrimaryActive: '#007f75', // Primary button active color for tactile feedback

    buttonSecondary: '#0582ca', // Secondary button background color
    buttonSecondaryHover: '#0467a2', // Secondary button hover color for interactivity
    buttonSecondaryActive: '#035e97', // Secondary button active color for feedback

    shadow: '#0000001a', // Light shadow with transparency for subtle depth
    highlight: '#00b8a920', // Highlight color with transparency for accents

    overlay: '#ffffffcc', // Light overlay color with transparency for modals/popups
    disabled: '#a8b3c0' // Disabled element color to indicate inactivity in light mode
  } // End light theme color definitions
}; // End of the Teal Ocean Light theme

export { tealOceanDark, tealOceanLight }; // Export both theme variants for use in the application
