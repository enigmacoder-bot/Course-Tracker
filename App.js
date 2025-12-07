// Test 16: App with HomeScreen + CourseDetailScreen only
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { colors, isDarkMode } = useTheme();

  return (
    <NavigationContainer theme={{
      dark: isDarkMode,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.secondary,
      }
    }}>
      <Stack.Navigator screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
