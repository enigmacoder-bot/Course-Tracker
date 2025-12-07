import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { requestFolderPermission, readVideoFiles, getFolderName } from '../utils/fileSystem';

// Inline CourseCard
const CourseCard = ({ course, onPress, colors }) => (
    <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.9}
    >
        <View style={[styles.cardThumbnail, { backgroundColor: colors.border }]}>
            <Feather name="play-circle" size={40} color={colors.textSecondary} />
        </View>
        <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {course.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {course.videoCount} videos
            </Text>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${course.progress || 0}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>{course.progress || 0}%</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleAddCourse = async () => {
        try {
            const directoryUri = await requestFolderPermission();
            if (directoryUri) {
                setLoading(true);
                const videos = await readVideoFiles(directoryUri);

                if (videos.length > 0) {
                    const folderName = getFolderName(directoryUri);
                    const newCourse = {
                        id: directoryUri,
                        title: folderName,
                        thumbnail: null,
                        totalDuration: `${videos.length} videos`,
                        videoCount: videos.length,
                        progress: 0,
                        videos: videos.map((v, i) => ({
                            id: v.uri,
                            title: v.filename.replace(/\.[^/.]+$/, ''),
                            fileName: v.filename,
                            uri: v.uri,
                            duration: '--:--',
                            completed: false,
                            progress: 0,
                        })),
                    };
                    setCourses(prev => [...prev, newCourse]);
                } else {
                    alert('No videos found in this folder or subfolders.');
                }
                setLoading(false);
            }
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
            alert('Error scanning folder.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>My Learning</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your progress</Text>
                </View>
            </View>

            <FlatList
                data={courses}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <CourseCard
                        course={item}
                        colors={colors}
                        onPress={() => navigation.navigate('CourseDetail', { course: item })}
                    />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Feather name="folder-plus" size={64} color={colors.border} />
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No courses yet</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Tap + to add a course folder
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={handleAddCourse}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Feather name="plus" color="#FFF" size={28} />
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20 },
    title: { fontSize: 28, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4 },
    list: { padding: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptyText: { fontSize: 14, marginTop: 8 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    cardThumbnail: { height: 140, justifyContent: 'center', alignItems: 'center' },
    cardContent: { padding: 16 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    cardSubtitle: { fontSize: 14, marginBottom: 12 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressBg: { flex: 1, height: 6, borderRadius: 3 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 12, width: 30 },
});

export default HomeScreen;
