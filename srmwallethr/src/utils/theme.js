/**
 * Theme Constants for SRM Sweets Mobile App
 * Centralized color and styling constants
 */

// Brand Colors
export const COLORS = {
    // Primary
    primary: '#EF4136',
    primaryDark: '#D13A30',
    primaryLight: '#FF5A4F',

    // Secondary
    secondary: '#FF7F27',
    secondaryDark: '#E06A1F',
    secondaryLight: '#FF9A4D',

    // Status Colors
    success: '#4CAF50',
    successLight: 'rgba(76,175,80,0.9)',
    warning: '#FF9800',
    warningLight: 'rgba(255,193,7,0.9)',
    danger: '#f44336',
    dangerLight: 'rgba(244,67,54,0.9)',

    // Neutral Colors - Black and White theme
    white: '#FFFFFF',
    black: '#000000',
    background: '#FFFFFF',
    backgroundDark: '#000000',
    surface: '#FFFFFF',

    // Text Colors - Black
    textPrimary: '#000000',
    textSecondary: '#333333',
    textMuted: '#666666',
    textLight: '#999999',

    // Border Colors
    border: '#E0E0E0',
    borderLight: '#F0F0F0',

    // Overlay
    overlay: 'rgba(0,0,0,0.5)',

    // Links
    link: '#EF4136',
    info: '#EF4136',
    infoBackground: '#FFF5F5',
};

// Spacing
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 40,
};

// Border Radius - All set to 0 for sharp corners
export const BORDER_RADIUS = {
    sm: 0,
    md: 0,
    lg: 0,
    xl: 0,
    round: 0,
};

// Font Sizes
export const FONT_SIZE = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 36,
};

// Font Family - Poppins
export const FONT_FAMILY = {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
};

// Status badge styles
export const getStatusColor = (status) => {
    switch (status) {
        case 'present':
            return COLORS.success;
        case 'late':
            return COLORS.warning;
        case 'half-day':
            return COLORS.danger;
        default:
            return COLORS.textLight;
    }
};

export default {
    COLORS,
    SPACING,
    BORDER_RADIUS,
    FONT_SIZE,
    FONT_FAMILY,
    getStatusColor,
};
