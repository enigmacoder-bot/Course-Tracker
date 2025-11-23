import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

    useEffect(() => {
        setIsDarkMode(systemScheme === 'dark');
    }, [systemScheme]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const theme = {
        isDarkMode,
        toggleTheme,
        colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
            background: isDarkMode ? COLORS.background.dark : COLORS.background.light,
            surface: isDarkMode ? COLORS.surface.dark : COLORS.surface.light,
            textPrimary: isDarkMode ? COLORS.text.primaryDark : COLORS.text.primaryLight,
            textSecondary: isDarkMode ? COLORS.text.secondaryDark : COLORS.text.secondaryLight,
            border: isDarkMode ? COLORS.border.dark : COLORS.border.light,
            success: COLORS.success,
            warning: COLORS.warning,
            error: COLORS.error,
            info: COLORS.info,
        },
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
