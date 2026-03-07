export interface ThemeColors {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryHover: string;
    primaryActive: string;
    
    secondary: string;
    secondaryDark: string;
    secondaryLight: string;
    secondaryHover: string;
    secondaryActive: string;
    
    background: string;
    backgroundAlt: string;
    backgroundLight: string;
    backgroundDark: string;
    
    card: string;
    cardHover: string;
    cardActive: string;
    
    border: string;
    borderLight: string;
    borderDark: string;

    text: string;
    textPrimary: string;
    textLight: string;
    textDark: string;
    textMuted: string;
    textSecondary: string;
    
    success: string;
    successDark: string;
    successLight: string;
    
    danger: string;
    dangerDark: string;
    dangerLight: string;
    
    warning: string;
    warningDark: string;
    warningLight: string;

    info: string;
    infoDark: string;
    infoLight: string;

    link: string;
    linkHover: string;
    linkActive: string;

    buttonPrimary: string;
    buttonPrimaryHover: string;
    buttonPrimaryActive: string;

    buttonSecondary: string;
    buttonSecondaryHover: string;
    buttonSecondaryActive: string;

    shadow: string;
    highlight: string;

    overlay: string;
    disabled: string;
}

export interface Theme {
    id: string;
    name: string;
    colors: ThemeColors;
}
