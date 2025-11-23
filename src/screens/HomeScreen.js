import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity } from 'react-native';
import { Plus, Settings, Search } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import CourseCard from '../components/CourseCard';
import { SPACING, FONTS, RADIUS } from '../constants/theme';
import { requestFolderPermission, readVideoFiles } from '../utils/fileSystem';

// Mock Data (Keep for initial render if needed, or start empty)
const MOCK_COURSES = [];

const HomeScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const [courses, setCourses] = useState(MOCK_COURSES);

    const handleAddCourse = async () => {
        const directoryUri = await requestFolderPermission();
        if (directoryUri) {
            const videos = await readVideoFiles(directoryUri);

            if (videos.length > 0) {
                // Extract folder name from URI (basic decoding)
                const folderName = decodeURIComponent(directoryUri.split('%2F').pop().split('%3A').pop());

                const newCourse = {
                    id: directoryUri,
                    title: folderName || 'New Course',
                    thumbnail: null,
                    totalDuration: `${videos.length} videos`, // Placeholder
                    videoCount: videos.length,
                    progress: 0,
                    videos: videos.map((v, i) => ({
                        id: v.uri,
                        title: v.filename,
                        fileName: v.filename,
                        uri: v.uri,
                        duration: '--:--',
                        completed: false,
                        progress: 0,
                    })),
                };

                setCourses(prev => [...prev, newCourse]);
            } else {
                alert('No videos found in this folder.');
            }
        }
    };

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
                    <Search color={colors.textPrimary} size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Settings color={colors.textPrimary} size={24} />
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
                    <CourseCard
                        course={item}
                        onPress={() => navigation.navigate('CourseDetail', { course: item })}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ color: colors.textSecondary }}>No courses yet. Tap + to add one.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={handleAddCourse}
            >
                <Plus color="#FFF" size={32} />
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
        paddingBottom: 100, // Space for FAB
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});

export default HomeScreen;
