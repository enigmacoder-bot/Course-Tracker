import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, SectionList, Modal, TextInput, ActivityIndicator, ScrollView, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCourse } from '../context/CourseContext';
import { loadSectionVideosWithLogs } from '../utils/fileSystem';

const CourseDetailScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { courseId } = route.params;
    const { courses, updateVideoProgress, updateCourse, updateSectionVideos } = useCourse();

    // Get latest course state from context
    const course = courses.find(c => c.id === courseId);

    const [expandedSections, setExpandedSections] = useState({});
    const [loadingSections, setLoadingSections] = useState({});
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [newName, setNewName] = useState('');

    // Debug logging
    const [debugLogs, setDebugLogs] = useState([]);
    const [showDebug, setShowDebug] = useState(false);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    const shareLogs = async () => {
        const logText = debugLogs.join('\n');
        try {
            await Share.share({ message: logText, title: 'Debug Logs' });
        } catch (err) {
            Alert.alert('Error', 'Could not share logs');
        }
    };

    useEffect(() => {
        if (!course) {
            navigation.goBack();
        }
    }, [course]);

    if (!course) return null;

    // Calculate progress based on completed videos
    const allVideos = course.videos || [];
    const completedCount = allVideos.filter(v => v.completed).length;
    const progress = allVideos.length > 0 ? Math.round((completedCount / allVideos.length) * 100) : 0;

    // Check if course has sections
    const hasSections = course.sections && course.sections.length > 0;
    const hasRootVideos = course.rootVideos && course.rootVideos.length > 0;

    // Toggle section/folder expand/collapse - loads contents on first expand
    const toggleSection = async (section) => {
        const sectionId = section.id;
        const isCurrentlyExpanded = expandedSections[sectionId] === true;

        addLog(`Toggle: ${section.name}, expanded: ${isCurrentlyExpanded}, loaded: ${section.loaded}`);

        // If collapsing, just toggle
        if (isCurrentlyExpanded) {
            addLog('Collapsing');
            setExpandedSections(prev => ({
                ...prev,
                [sectionId]: false,
            }));
            return;
        }

        // If expanding and not loaded, load folder contents first
        if (!section.loaded) {
            // CRITICAL DEBUG: Compare section URI vs course ID (parent folder)
            const sectionHash = section.uri?.slice(-40) || 'NO_URI';
            const courseHash = course.id?.slice(-40) || 'NO_COURSE_ID';
            addLog(`Section URI hash: ${sectionHash}`);
            addLog(`Course (parent) hash: ${courseHash}`);

            if (section.uri === course.id) {
                addLog('⚠️ BUG DETECTED: Section URI equals parent folder URI!');
            }

            setLoadingSections(prev => ({ ...prev, [sectionId]: true }));

            try {
                // Use loadFolderContents to get BOTH folders and videos
                const { loadFolderContents } = require('../utils/fileSystem');
                const contents = await loadFolderContents(section.uri, addLog);
                addLog(`Found ${contents.folders.length} folders, ${contents.videos.length} videos`);
                updateSectionVideos(course.id, sectionId, contents);
                addLog('Context updated!');
            } catch (error) {
                addLog(`ERROR: ${error.message}`);
                Alert.alert('Error', `Failed to load: ${error.message}`);
            } finally {
                setLoadingSections(prev => ({ ...prev, [sectionId]: false }));
            }
        } else {
            const subfolders = section.subfolders?.length || 0;
            const videos = section.videos?.length || 0;
            addLog(`Already loaded: ${subfolders} folders, ${videos} videos`);
        }

        // Expand the section
        addLog('Expanding');
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: true,
        }));
    };

    // Toggle video completed status
    const toggleVideoComplete = (videoId, currentStatus) => {
        updateVideoProgress(course.id, videoId, !currentStatus);
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
                    onPress: () => {
                        // We need a bulk update method in context ideally, but for now we iterate or logic needs update
                        // For simplicity/performance locally, we can iterate, but better to add bulk update to context if needed.
                        // Actually, I'll allow the user to toggle one by one or implement bulk in context later.
                        // For now, let's just do a simple implementation or skip complex bulk update to keep context simple:
                        // "feature not fully implemented" or better, add batch update to context.
                        // Let's modify context to support simpler updates?
                        // Or just iterate:
                        const allVids = [...(course.rootVideos || []), ...(course.sections?.flatMap(s => s.videos) || [])];
                        // This might be slow. Let's just update the course object directly via updateCourse for bulk.

                        const updatedCourse = {
                            ...course,
                            videos: course.videos.map(v => ({ ...v, completed: true })),
                            sections: course.sections?.map(s => ({
                                ...s,
                                videos: s.videos.map(v => ({ ...v, completed: true })),
                            })),
                            rootVideos: course.rootVideos?.map(v => ({ ...v, completed: true })),
                            progress: 100
                        };
                        updateCourse(course.id, updatedCourse);
                    }
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
                    onPress: () => {
                        const updatedCourse = {
                            ...course,
                            videos: course.videos.map(v => ({ ...v, completed: false })),
                            sections: course.sections?.map(s => ({
                                ...s,
                                videos: s.videos.map(v => ({ ...v, completed: false })),
                            })),
                            rootVideos: course.rootVideos?.map(v => ({ ...v, completed: false })),
                            progress: 0
                        };
                        updateCourse(course.id, updatedCourse);
                    }
                },
            ]
        );
    };

    const handleRename = () => {
        if (newName.trim()) {
            updateCourse(course.id, { title: newName.trim() });
            setRenameModalVisible(false);
        }
    };

    // Render a video item with depth-based indentation
    const renderVideoItem = (video, index, depth = 0) => {
        const isCompleted = video.completed;
        const indentMargin = depth * 24; // 24px per depth level

        return (
            <View style={[styles.videoRow, { borderBottomColor: colors.border, marginLeft: indentMargin }]}>
                {/* Play button */}
                <TouchableOpacity
                    style={[styles.videoNum, { backgroundColor: isCompleted ? colors.success + '20' : colors.primary + '20' }]}
                    onPress={() => navigation.navigate('VideoPlayer', { videoUri: video.uri, title: video.title, videoId: video.id })}
                >
                    <Feather name="play" size={16} color={isCompleted ? colors.success : colors.primary} />
                </TouchableOpacity>

                {/* Video info */}
                <TouchableOpacity
                    style={styles.videoInfo}
                    onPress={() => navigation.navigate('VideoPlayer', { videoUri: video.uri, title: video.title, videoId: video.id })}
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
                    onPress={() => toggleVideoComplete(video.id, isCompleted)}
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

    // Render a folder header with depth-based indentation
    const renderSectionHeader = (section, depth = 0) => {
        const isExpanded = expandedSections[section.id] === true;
        const isLoading = loadingSections[section.id];
        const isLoaded = section.loaded;
        const indentMargin = depth * 24; // 24px per depth level

        // Calculate stats based on loaded state
        const subfolderCount = section.subfolders?.length || 0;
        const videoCount = section.videos?.length || 0;
        const sectionCompleted = section.videos?.filter(v => v.completed).length || 0;
        const sectionProgress = videoCount > 0 ? Math.round((sectionCompleted / videoCount) * 100) : 0;

        return (
            <TouchableOpacity
                style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border, marginLeft: indentMargin }]}
                onPress={() => toggleSection(section)}
                activeOpacity={0.7}
                disabled={isLoading}
            >
                <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Feather name="folder" size={20} color={colors.primary} />
                    )}
                </View>
                <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {section.name}
                    </Text>
                    <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>
                        {isLoaded
                            ? (subfolderCount > 0
                                ? `${subfolderCount} folders, ${videoCount} videos`
                                : `${sectionCompleted}/${videoCount} videos • ${sectionProgress}%`)
                            : `${section.itemCount || '?'} items • Tap to load`
                        }
                    </Text>
                </View>
                {isLoading ? null : (
                    <Feather
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.textSecondary}
                    />
                )}
            </TouchableOpacity>
        );
    };

    // Build list data recursively for nested folders
    const buildListData = () => {
        const data = [];

        // Add root videos first (if any)
        if (hasRootVideos) {
            course.rootVideos.forEach((video, index) => {
                data.push({ type: 'video', video, index, depth: 0 });
            });
        }

        // Recursive function to add folders and their contents
        const addFolderContents = (folder, depth) => {
            // Add the folder itself
            data.push({ type: 'folder', folder, depth });

            // If expanded, add its contents
            if (expandedSections[folder.id] === true && folder.loaded) {
                // Add subfolders first
                if (folder.subfolders && folder.subfolders.length > 0) {
                    folder.subfolders.forEach(subfolder => {
                        addFolderContents(subfolder, depth + 1);
                    });
                }

                // Then add videos
                if (folder.videos && folder.videos.length > 0) {
                    folder.videos.forEach((video, index) => {
                        data.push({ type: 'video', video, index, depth: depth + 1, folderId: folder.id });
                    });
                }
            }
        };

        // Add sections (top-level folders)
        if (hasSections) {
            course.sections.forEach(section => {
                addFolderContents(section, 0);
            });
        }

        // Fallback: if no sections structure, show flat videos
        if (!hasSections && !hasRootVideos && allVideos.length > 0) {
            allVideos.forEach((video, index) => {
                data.push({ type: 'video', video, index, depth: 0 });
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
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={styles.backBtn}>
                            <Feather name="terminal" color={showDebug ? '#FFD700' : '#FFF'} size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            setNewName(course.title);
                            setRenameModalVisible(true);
                        }} style={styles.backBtn}>
                            <Feather name="edit-2" color="#FFF" size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={markAllComplete} style={styles.backBtn}>
                            <Feather name="check-square" color="#FFF" size={22} />
                        </TouchableOpacity>
                    </View>
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

            {/* Debug Log Panel */}
            {showDebug && (
                <View style={styles.debugPanel}>
                    <View style={styles.debugHeader}>
                        <Text style={styles.debugTitle}>Debug Logs</Text>
                        <View style={styles.debugButtons}>
                            <TouchableOpacity onPress={shareLogs} style={styles.debugBtn}>
                                <Text style={styles.shareButton}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setDebugLogs([])} style={styles.debugBtn}>
                                <Text style={styles.clearButton}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView style={styles.debugScroll} nestedScrollEnabled>
                        {debugLogs.map((log, index) => (
                            <Text key={index} style={styles.debugLog}>{log}</Text>
                        ))}
                        {debugLogs.length === 0 && (
                            <Text style={styles.debugLog}>Tap a section to see logs...</Text>
                        )}
                    </ScrollView>
                </View>
            )}

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
                        if (item.type === 'folder') return `folder-${item.folder.id}`;
                        return `video-${item.video?.id || index}`;
                    }}
                    renderItem={({ item }) => {
                        if (item.type === 'folder') {
                            return renderSectionHeader(item.folder, item.depth);
                        }
                        return renderVideoItem(item.video, item.index, item.depth);
                    }}
                    contentContainerStyle={styles.listContent}
                />
            </View>


            {/* Rename Modal */}
            <Modal
                transparent={true}
                visible={renameModalVisible}
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Rename Course</Text>
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                            placeholder="Enter new course name"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                                onPress={() => setRenameModalVisible(false)}
                            >
                                <Text style={{ color: colors.textPrimary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleRename}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', padding: 24, borderRadius: 16, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 24, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },

    // Debug panel styles
    debugPanel: {
        maxHeight: 180,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    debugHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    debugTitle: {
        color: '#00ff88',
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    debugButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    debugBtn: {
        padding: 4,
    },
    shareButton: {
        color: '#6bc5ff',
        fontSize: 12,
    },
    clearButton: {
        color: '#ff6b6b',
        fontSize: 12,
    },
    debugScroll: {
        padding: 8,
        maxHeight: 120,
    },
    debugLog: {
        color: '#a0ffa0',
        fontSize: 11,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
});

export default CourseDetailScreen;
