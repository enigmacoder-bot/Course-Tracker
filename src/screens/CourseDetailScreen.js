import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CourseDetailScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { course: initialCourse } = route.params;
    const [course, setCourse] = useState(initialCourse);

    // Calculate progress based on completed videos
    const completedCount = course.videos.filter(v => v.completed).length;
    const progress = course.videos.length > 0 ? Math.round((completedCount / course.videos.length) * 100) : 0;

    // Toggle video completed status
    const toggleVideoComplete = (videoId) => {
        setCourse(prev => ({
            ...prev,
            videos: prev.videos.map(v =>
                v.id === videoId ? { ...v, completed: !v.completed } : v
            ),
        }));
    };

    // Mark all as completed
    const markAllComplete = () => {
        Alert.alert(
            'Mark All Complete',
            'Mark all videos as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: () => setCourse(prev => ({
                        ...prev,
                        videos: prev.videos.map(v => ({ ...v, completed: true })),
                    }))
                },
            ]
        );
    };

    // Mark all as incomplete
    const resetProgress = () => {
        Alert.alert(
            'Reset Progress',
            'Mark all videos as not completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: () => setCourse(prev => ({
                        ...prev,
                        videos: prev.videos.map(v => ({ ...v, completed: false })),
                    }))
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Feather name="arrow-left" color="#FFF" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={markAllComplete} style={styles.backBtn}>
                        <Feather name="check-square" color="#FFF" size={22} />
                    </TouchableOpacity>
                </View>
                <View style={styles.heroContent}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                    <Text style={styles.courseInfo}>{course.videoCount} Videos • {progress}% Complete</Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            </View>

            {/* Video List */}
            <View style={[styles.listSection, { backgroundColor: colors.background }]}>
                <View style={styles.listHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Videos ({completedCount}/{course.videos.length})</Text>
                    <TouchableOpacity onPress={resetProgress}>
                        <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={course.videos}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => (
                        <View style={[styles.videoRow, { borderBottomColor: colors.border }]}>
                            {/* Play button */}
                            <TouchableOpacity
                                style={[styles.videoNum, { backgroundColor: item.completed ? colors.success + '20' : colors.primary + '20' }]}
                                onPress={() => navigation.navigate('VideoPlayer', { videoUri: item.uri, title: item.title })}
                            >
                                <Feather name="play" size={16} color={item.completed ? colors.success : colors.primary} />
                            </TouchableOpacity>

                            {/* Video info */}
                            <TouchableOpacity
                                style={styles.videoInfo}
                                onPress={() => navigation.navigate('VideoPlayer', { videoUri: item.uri, title: item.title })}
                            >
                                <Text style={[styles.videoTitle, { color: colors.textPrimary, textDecorationLine: item.completed ? 'line-through' : 'none' }]} numberOfLines={2}>
                                    {index + 1}. {item.title}
                                </Text>
                            </TouchableOpacity>

                            {/* Mark complete button */}
                            <TouchableOpacity
                                style={styles.completeBtn}
                                onPress={() => toggleVideoComplete(item.id)}
                            >
                                <Feather
                                    name={item.completed ? "check-circle" : "circle"}
                                    size={28}
                                    color={item.completed ? colors.success : colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { height: 220, paddingBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16 },
    backBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },
    heroContent: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20 },
    courseTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    courseInfo: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 12 },
    progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
    listSection: { flex: 1, marginTop: -16, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600' },
    resetText: { fontSize: 14 },
    listContent: { paddingBottom: 20 },
    videoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
    videoNum: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    videoInfo: { flex: 1, marginRight: 12 },
    videoTitle: { fontSize: 14 },
    completeBtn: { padding: 4 },
});

export default CourseDetailScreen;
