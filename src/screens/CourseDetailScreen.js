import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, SectionList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CourseDetailScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { course: initialCourse } = route.params;
    const [course, setCourse] = useState(initialCourse);
    const [expandedSections, setExpandedSections] = useState({});

    // Calculate progress based on completed videos
    const allVideos = course.videos || [];
    const completedCount = allVideos.filter(v => v.completed).length;
    const progress = allVideos.length > 0 ? Math.round((completedCount / allVideos.length) * 100) : 0;

    // Check if course has sections
    const hasSections = course.sections && course.sections.length > 0;
    const hasRootVideos = course.rootVideos && course.rootVideos.length > 0;

    // Toggle section expand/collapse
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    // Toggle video completed status
    const toggleVideoComplete = (videoId) => {
        setCourse(prev => {
            // Update in flat videos array
            const updatedVideos = prev.videos.map(v =>
                v.id === videoId ? { ...v, completed: !v.completed } : v
            );

            // Update in sections if they exist
            const updatedSections = prev.sections?.map(section => ({
                ...section,
                videos: section.videos.map(v =>
                    v.id === videoId ? { ...v, completed: !v.completed } : v
                ),
            }));

            // Update in rootVideos
            const updatedRootVideos = prev.rootVideos?.map(v =>
                v.id === videoId ? { ...v, completed: !v.completed } : v
            );

            return {
                ...prev,
                videos: updatedVideos,
                sections: updatedSections,
                rootVideos: updatedRootVideos,
            };
        });
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
                        sections: prev.sections?.map(s => ({
                            ...s,
                            videos: s.videos.map(v => ({ ...v, completed: true })),
                        })),
                        rootVideos: prev.rootVideos?.map(v => ({ ...v, completed: true })),
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
                        sections: prev.sections?.map(s => ({
                            ...s,
                            videos: s.videos.map(v => ({ ...v, completed: false })),
                        })),
                        rootVideos: prev.rootVideos?.map(v => ({ ...v, completed: false })),
                    }))
                },
            ]
        );
    };

    // Render a video item
    const renderVideoItem = (video, index, sectionName = null) => {
        const isCompleted = video.completed;

        return (
            <View style={[styles.videoRow, { borderBottomColor: colors.border }]}>
                {/* Play button */}
                <TouchableOpacity
                    style={[styles.videoNum, { backgroundColor: isCompleted ? colors.success + '20' : colors.primary + '20' }]}
                    onPress={() => navigation.navigate('VideoPlayer', { videoUri: video.uri, title: video.title })}
                >
                    <Feather name="play" size={16} color={isCompleted ? colors.success : colors.primary} />
                </TouchableOpacity>

                {/* Video info */}
                <TouchableOpacity
                    style={styles.videoInfo}
                    onPress={() => navigation.navigate('VideoPlayer', { videoUri: video.uri, title: video.title })}
                >
                    <Text
                        style={[
                            styles.videoTitle,
                            {
                                color: colors.textPrimary,
                                textDecorationLine: isCompleted ? 'line-through' : 'none',
                                opacity: isCompleted ? 0.6 : 1,
                            }
                        ]}
                        numberOfLines={2}
                    >
                        {index + 1}. {video.title}
                    </Text>
                </TouchableOpacity>

                {/* Mark complete button */}
                <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => toggleVideoComplete(video.id)}
                >
                    <Feather
                        name={isCompleted ? "check-circle" : "circle"}
                        size={28}
                        color={isCompleted ? colors.success : colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    // Render a section header (folder like Week 1, Week 2)
    const renderSectionHeader = (section) => {
        const isExpanded = expandedSections[section.id] !== false; // Default to expanded
        const sectionCompleted = section.videos.filter(v => v.completed).length;
        const sectionTotal = section.videos.length;
        const sectionProgress = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0;

        return (
            <TouchableOpacity
                style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Feather name="folder" size={20} color={colors.primary} />
                </View>
                <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {section.name}
                    </Text>
                    <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>
                        {sectionCompleted}/{sectionTotal} videos • {sectionProgress}%
                    </Text>
                </View>
                <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>
        );
    };

    // Build list data with sections
    const buildListData = () => {
        const data = [];

        // Add root videos first (if any)
        if (hasRootVideos) {
            course.rootVideos.forEach((video, index) => {
                data.push({ type: 'video', video, index });
            });
        }

        // Add sections with their videos
        if (hasSections) {
            course.sections.forEach(section => {
                data.push({ type: 'section', section });

                // If expanded, add section's videos
                if (expandedSections[section.id] !== false) {
                    section.videos.forEach((video, index) => {
                        data.push({ type: 'sectionVideo', video, index, sectionId: section.id });
                    });
                }
            });
        }

        // Fallback: if no sections structure, show flat videos
        if (!hasSections && !hasRootVideos && allVideos.length > 0) {
            allVideos.forEach((video, index) => {
                data.push({ type: 'video', video, index });
            });
        }

        return data;
    };

    const listData = buildListData();

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
                    <Text style={styles.courseInfo}>
                        {allVideos.length} Videos
                        {hasSections && ` • ${course.sections.length} Sections`}
                        {` • ${progress}% Complete`}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            </View>

            {/* Content List */}
            <View style={[styles.listSection, { backgroundColor: colors.background }]}>
                <View style={styles.listHeader}>
                    <Text style={[styles.listTitle, { color: colors.textPrimary }]}>
                        {hasSections ? 'Course Content' : `Videos (${completedCount}/${allVideos.length})`}
                    </Text>
                    <TouchableOpacity onPress={resetProgress}>
                        <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={listData}
                    keyExtractor={(item, index) => {
                        if (item.type === 'section') return `section-${item.section.id}`;
                        if (item.type === 'sectionVideo') return `sv-${item.sectionId}-${item.video.id}`;
                        return `video-${item.video.id}`;
                    }}
                    renderItem={({ item }) => {
                        if (item.type === 'section') {
                            return renderSectionHeader(item.section);
                        }
                        return renderVideoItem(item.video, item.index);
                    }}
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
    listTitle: { fontSize: 16, fontWeight: '600' },
    resetText: { fontSize: 14 },
    listContent: { paddingBottom: 20 },

    // Section styles
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionInfo: {
        flex: 1,
    },
    sectionName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    sectionMeta: {
        fontSize: 13,
    },

    // Video styles
    videoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginLeft: 12, // Indent videos under sections
        borderBottomWidth: 1
    },
    videoNum: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    videoInfo: { flex: 1, marginRight: 12 },
    videoTitle: { fontSize: 14 },
    completeBtn: { padding: 4 },
});

export default CourseDetailScreen;
