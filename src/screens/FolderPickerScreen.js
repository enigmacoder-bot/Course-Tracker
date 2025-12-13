import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Alert,
    ScrollView,
    Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
    requestFolderPermission,
    getFolderName,
    readCourseStructureWithLogs,
} from '../utils/fileSystem';
import { useCourse } from '../context/CourseContext';

/**
 * FolderPickerScreen - Simple folder selector with debug logging
 */
const FolderPickerScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const { addCourse } = useCourse();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Opening folder picker...');
    const [debugLogs, setDebugLogs] = useState([]);
    const [showDebug, setShowDebug] = useState(false);

    // Add log function
    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    // Share/copy logs using native share
    const shareLogs = async () => {
        const logText = debugLogs.join('\n');
        try {
            await Share.share({
                message: logText,
                title: 'Debug Logs',
            });
        } catch (err) {
            Alert.alert('Error', 'Could not share logs');
        }
    };

    // Request storage access on first load
    useEffect(() => {
        requestStorageAccess();
    }, []);

    const requestStorageAccess = async () => {
        setLoading(true);
        setError(null);
        setDebugLogs([]);
        setStatusMessage('Opening folder picker...');
        addLog('Requesting folder permission...');

        try {
            const uri = await requestFolderPermission();
            if (uri) {
                addLog(`Folder selected: ${uri.substring(0, 60)}...`);
                await createCourseFromFolder(uri);
            } else {
                addLog('Permission denied or cancelled');
                setError('Storage access denied. Please grant permission to select a folder.');
                setLoading(false);
            }
        } catch (err) {
            addLog(`Error: ${err.message}`);
            setError('Failed to access storage.');
            setLoading(false);
        }
    };

    // Create course directly from the SAF-selected folder
    const createCourseFromFolder = async (folderUri) => {
        try {
            setStatusMessage('Reading folder structure...');
            addLog('Starting to read folder structure...');

            // Get course structure with logging callback
            const structure = await readCourseStructureWithLogs(folderUri, addLog);

            addLog(`Result: ${structure.totalVideos} videos, ${structure.sections.length} sections`);

            if (structure.totalVideos === 0) {
                addLog('No videos found!');
                setShowDebug(true); // Auto-show debug when there's an issue
                Alert.alert(
                    'No Videos Found',
                    'No video files found. Check debug logs for details.',
                    [{ text: 'OK' }]
                );
                setError('No videos found. Tap "Show Debug" to see details.');
                setLoading(false);
                return;
            }

            setStatusMessage(`Found ${structure.totalVideos} videos. Creating course...`);
            addLog('Creating course...');

            const folderName = getFolderName(folderUri);

            const newCourse = {
                id: folderUri,
                title: folderName,
                thumbnail: null,
                videoCount: structure.totalVideos,
                progress: 0,
                sections: structure.sections,
                rootVideos: structure.rootVideos,
                videos: [
                    ...structure.rootVideos,
                    ...structure.sections.flatMap(s => s.videos),
                ],
            };

            addCourse(newCourse);
            addLog('Course created successfully!');
            navigation.navigate('Home');
        } catch (err) {
            addLog(`Error creating course: ${err.message}`);
            setShowDebug(true);
            Alert.alert('Error', `Failed to read folder: ${err.message}`);
            setError('Failed to read folder. Check debug logs.');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Feather name="x" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    Add Course
                </Text>
                <TouchableOpacity
                    onPress={() => setShowDebug(!showDebug)}
                    style={styles.headerButton}
                >
                    <Feather name="terminal" size={20} color={showDebug ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Debug Log Panel */}
            {showDebug && (
                <View style={[styles.debugPanel, { backgroundColor: '#1a1a2e' }]}>
                    <View style={styles.debugHeader}>
                        <Text style={styles.debugTitle}>Debug Logs</Text>
                        <View style={styles.debugButtons}>
                            <TouchableOpacity onPress={shareLogs} style={styles.debugBtn}>
                                <Text style={styles.copyButton}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setDebugLogs([])} style={styles.debugBtn}>
                                <Text style={styles.clearButton}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView style={styles.debugScroll}>
                        {debugLogs.map((log, index) => (
                            <Text key={index} style={styles.debugLog}>{log}</Text>
                        ))}
                        {debugLogs.length === 0 && (
                            <Text style={styles.debugLog}>No logs yet...</Text>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Content */}
            <View style={[styles.centered, showDebug && styles.centeredSmall]}>
                {loading ? (
                    <>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            {statusMessage}
                        </Text>
                    </>
                ) : error ? (
                    <>
                        <Feather name="folder" size={64} color={colors.textSecondary} />
                        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.primary }]}
                            onPress={requestStorageAccess}
                        >
                            <Feather name="folder-plus" size={20} color="#FFF" />
                            <Text style={styles.retryButtonText}>Select Folder</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.debugButton, { borderColor: colors.border }]}
                            onPress={() => setShowDebug(!showDebug)}
                        >
                            <Feather name="terminal" size={16} color={colors.textSecondary} />
                            <Text style={[styles.debugButtonText, { color: colors.textSecondary }]}>
                                {showDebug ? 'Hide' : 'Show'} Debug Logs
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : null}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 8,
        width: 40,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    debugPanel: {
        maxHeight: 200,
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
    copyButton: {
        color: '#6bc5ff',
        fontSize: 12,
    },
    clearButton: {
        color: '#ff6b6b',
        fontSize: 12,
    },
    debugScroll: {
        padding: 8,
    },
    debugLog: {
        color: '#a0ffa0',
        fontSize: 11,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    centeredSmall: {
        flex: 0.6,
    },
    statusText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    debugButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    debugButtonText: {
        fontSize: 14,
    },
    cancelButton: {
        marginTop: 16,
        padding: 12,
    },
    cancelText: {
        fontSize: 14,
    },
});

export default FolderPickerScreen;
