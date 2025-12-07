import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONTS, RADIUS } from '../constants/theme';

const CourseDetailScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { course } = route.params;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Hero Section */}
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <Feather name="arrow-left" color="#FFF" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Feather name="more-vertical" color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>
                <View style={styles.heroContent}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                    <Text style={styles.statsText}>{course.videoCount} Videos</Text>
                    <TouchableOpacity
                        style={styles.resumeButton}
                        onPress={() => {
                            if (course.videos.length > 0) {
                                navigation.navigate('VideoPlayer', {
                                    videoUri: course.videos[0].uri,
                                    title: course.videos[0].title
                                });
                            }
                        }}
                    >
                        <Feather name="play-circle" color={colors.primary} size={20} />
                        <Text style={[styles.resumeText, { color: colors.primary }]}>Start Course</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Video List */}
            <View style={[styles.listContainer, { backgroundColor: colors.background }]}>
                <View style={styles.listHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Course Content</Text>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>{course.progress || 0}% Complete</Text>
                </View>

                <FlatList
                    data={course.videos}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={[styles.videoItem, { borderBottomColor: colors.border }]}
                            onPress={() => navigation.navigate('VideoPlayer', { videoUri: item.uri, title: item.title })}
                        >
                            <View style={[styles.videoIndex, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.videoIndexText, { color: colors.primary }]}>{index + 1}</Text>
                            </View>
                            <View style={styles.videoInfo}>
                                <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.videoDuration, { color: colors.textSecondary }]}>
                                    {item.duration}
                                </Text>
                            </View>
                            <Feather
                                name={item.completed ? "check-circle" : "play-circle"}
                                size={24}
                                color={item.completed ? colors.success : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyList}>
                            <Text style={{ color: colors.textSecondary }}>No videos in this course</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { height: 240, justifyContent: 'space-between', paddingBottom: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16 },
    iconButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },
    heroContent: { paddingHorizontal: 24 },
    courseTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8 },
    statsText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 16 },
    resumeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        gap: 8
    },
    resumeText: { fontWeight: '600', fontSize: 14 },
    listContainer: { flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    sectionTitle: { fontSize: 18, fontWeight: '600' },
    progressText: { fontSize: 14 },
    listContent: { paddingBottom: 20 },
    videoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    videoIndex: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    videoIndexText: { fontSize: 14, fontWeight: '600' },
    videoInfo: { flex: 1, marginRight: 12 },
    videoTitle: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    videoDuration: { fontSize: 12 },
    emptyList: { padding: 40, alignItems: 'center' },
});

export default CourseDetailScreen;
