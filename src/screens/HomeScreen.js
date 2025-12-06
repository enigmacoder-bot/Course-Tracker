// Test 11: HomeScreen that uses useTheme()
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Learning</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track your progress</Text>
            </View>
            <View style={styles.emptyState}>
                <Text style={{ color: colors.textSecondary }}>Test 11: HomeScreen with useTheme works!</Text>
            </View>
            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFF', fontSize: 32 }}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 32,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default HomeScreen;
