// Test 6: HomeScreen without icons or complex components
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONTS, RADIUS } from '../constants/theme';

const MOCK_COURSES = [];

const HomeScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const [courses, setCourses] = useState(MOCK_COURSES);

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
            <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Learning</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Track your progress
                </Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={{ color: colors.textPrimary }}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={{ color: colors.textPrimary }}>⚙️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {renderHeader()}

            <FlatList
                data={courses}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={{ padding: 10 }}>
                        <Text style={{ color: colors.textPrimary }}>{item.title}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ color: colors.textSecondary }}>Test 6: HomeScreen without icons works!</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => console.log('Add pressed')}
            >
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
    listContent: {
        padding: SPACING.m,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
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
