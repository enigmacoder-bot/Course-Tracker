// Test 13: HomeScreen with Feather icons
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONTS, RADIUS } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Learning</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track your progress</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Feather name="search" color={colors.textPrimary} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Feather name="settings" color={colors.textPrimary} size={24} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.emptyState}>
                <Text style={{ color: colors.textSecondary }}>Test 13: Feather icons work!</Text>
            </View>
            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]}>
                <Feather name="plus" color="#FFF" size={32} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.l,
    },
    headerTitle: {
        fontSize: FONTS.sizes.h1,
        fontWeight: FONTS.weights.bold,
    },
    headerSubtitle: {
        fontSize: FONTS.sizes.bodySmall,
        marginTop: SPACING.xxs,
    },
    headerActions: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    iconButton: {
        padding: SPACING.xs,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.xl,
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default HomeScreen;
