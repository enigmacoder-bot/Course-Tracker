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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
    requestFolderPermission,
    getFolderName,
    readCourseStructure,
} from '../utils/fileSystem';
import { useCourse } from '../context/CourseContext';

/**
 * FolderPickerScreen - Simple folder selector
 * 
 * Flow:
 * 1. Opens system SAF picker on mount
 * 2. Creates course from selected folder
 * 3. Navigates to Home
 */
const FolderPickerScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const { addCourse } = useCourse();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Opening folder picker...');

    // Request storage access on first load
    useEffect(() => {
        requestStorageAccess();
    }, []);

    const requestStorageAccess = async () => {
        setLoading(true);
        setError(null);
        setStatusMessage('Opening folder picker...');

        try {
            const uri = await requestFolderPermission();
            if (uri) {
                await createCourseFromFolder(uri);
            } else {
                setError('Storage access denied. Please grant permission to select a folder.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error requesting storage:', err);
            setError('Failed to access storage.');
            setLoading(false);
        }
    };

    // Create course directly from the SAF-selected folder
    const createCourseFromFolder = async (folderUri) => {
        try {
            setStatusMessage('Reading folder structure...');

            // Get course structure preserving folders as sections
            const structure = await readCourseStructure(folderUri);

            if (structure.totalVideos === 0) {
                Alert.alert(
                    'No Videos Found',
                    'No video files found in this folder or its subfolders. Please select a folder containing video files.',
                    [{ text: 'OK' }]
                );
                setError('No videos found. Try selecting a different folder.');
                setLoading(false);
                return;
            }

            setStatusMessage(`Found ${structure.totalVideos} videos. Creating course...`);

            const folderName = getFolderName(folderUri);

            const newCourse = {
                id: folderUri,
                title: folderName,
                thumbnail: null,
                videoCount: structure.totalVideos,
                progress: 0,
                // Keep sections (Level 1, Level 2, etc.) for in-course navigation
                sections: structure.sections,
                // Root-level videos (not in any subfolder)
                rootVideos: structure.rootVideos,
                // Flattened videos for backwards compatibility
                videos: [
                    ...structure.rootVideos,
                    ...structure.sections.flatMap(s => s.videos),
                ],
            };

            addCourse(newCourse);
            navigation.navigate('Home');
        } catch (err) {
            console.error('Error creating course:', err);
            Alert.alert('Error', 'Failed to read video files from this folder.');
            setError('Failed to read folder. Try again.');
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
                <View style={styles.headerButton} />
            </View>

            {/* Content */}
            <View style={styles.centered}>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
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
    cancelButton: {
        marginTop: 16,
        padding: 12,
    },
    cancelText: {
        fontSize: 14,
    },
});

export default FolderPickerScreen;
