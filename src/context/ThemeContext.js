import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// All colors defined inline - no external imports
const LIGHT_COLORS = {
    primary: '#2563EB',
    secondary: '#10B981',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
};

const DARK_COLORS = {
    primary: '#2563EB',
    secondary: '#10B981',
    background: '#0F172A',
    surface: '#1E293B',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
};

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
        colors: isDarkMode ? DARK_COLORS : LIGHT_COLORS,
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
