import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    FlatList,
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
    readDirectoryContents,
    readVideoFiles,
    getFolderName,
} from '../utils/fileSystem';

const FolderPickerScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUri, setCurrentUri] = useState(null);
    const [rootUri, setRootUri] = useState(null);
    const [pathStack, setPathStack] = useState([]); // Stack of {uri, name}
    const [error, setError] = useState(null);

    // Request storage access on first load
    useEffect(() => {
        requestStorageAccess();
    }, []);

    const requestStorageAccess = async () => {
        setLoading(true);
        setError(null);

        try {
            const uri = await requestFolderPermission();
            if (uri) {
                setRootUri(uri);
                setCurrentUri(uri);
                setPathStack([{ uri, name: 'Storage' }]);
                await loadDirectory(uri);
            } else {
                setError('Storage access denied. Please grant permission to browse folders.');
            }
        } catch (err) {
            console.error('Error requesting storage:', err);
            setError('Failed to access storage.');
        } finally {
            setLoading(false);
        }
    };

    const loadDirectory = async (directoryUri) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Loading directory:', directoryUri);
            const items = await readDirectoryContents(directoryUri);
            setContents(items);

            if (items.length === 0) {
                setError('This folder is empty or contains no video-related items.');
            }
        } catch (err) {
            console.error('Error loading directory:', err);
            setError('Failed to read folder contents.');
            setContents([]);
        } finally {
            setLoading(false);
        }
    };

    const navigateToFolder = async (folder) => {
        setCurrentUri(folder.uri);
        setPathStack(prev => [...prev, { uri: folder.uri, name: folder.name }]);
        await loadDirectory(folder.uri);
    };

    const navigateUp = async () => {
        if (pathStack.length <= 1) return; // Can't go above root

        const newStack = [...pathStack];
        newStack.pop(); // Remove current
        const parent = newStack[newStack.length - 1];

        setPathStack(newStack);
        setCurrentUri(parent.uri);
        await loadDirectory(parent.uri);
    };

    const navigateToBreadcrumb = async (index) => {
        if (index >= pathStack.length - 1) return; // Already here

        const newStack = pathStack.slice(0, index + 1);
        const target = newStack[newStack.length - 1];

        setPathStack(newStack);
        setCurrentUri(target.uri);
        await loadDirectory(target.uri);
    };

    const selectCurrentFolder = async () => {
        if (!currentUri) return;

        setLoading(true);

        try {
            // Get all videos recursively from this folder
            const videos = await readVideoFiles(currentUri);

            if (videos.length === 0) {
                Alert.alert('No Videos', 'No video files found in this folder or its subfolders.');
                setLoading(false);
                return;
            }

            const folderName = pathStack.length > 0
                ? pathStack[pathStack.length - 1].name
                : getFolderName(currentUri);

            const newCourse = {
                id: currentUri,
                title: folderName,
                thumbnail: null,
                videoCount: videos.length,
                progress: 0,
                videos: videos.map((v) => ({
                    id: v.uri,
                    title: v.filename.replace(/\.[^/.]+$/, ''),
                    fileName: v.filename,
                    uri: v.uri,
                    duration: '--:--',
                    completed: false,
                    progress: 0,
                })),
            };

            navigation.navigate('Home', { newCourse });
        } catch (err) {
            console.error('Error selecting folder:', err);
            Alert.alert('Error', 'Failed to read video files from this folder.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        if (item.isFolder) {
            return (
                <TouchableOpacity
                    style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigateToFolder(item)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Feather name="folder" size={24} color={colors.primary} />
                        {item.videoCount > 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.badgeText}>{item.videoCount}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                            {item.subfolderCount > 0 && `${item.subfolderCount} folder${item.subfolderCount !== 1 ? 's' : ''}`}
                            {item.subfolderCount > 0 && item.videoCount > 0 && ' • '}
                            {item.videoCount > 0 && `${item.videoCount} video${item.videoCount !== 1 ? 's' : ''}`}
                            {item.subfolderCount === 0 && item.videoCount === 0 && `${item.totalItems} item${item.totalItems !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            );
        }

        // Video file
        return (
            <View style={[styles.item, styles.videoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                    <Feather name="film" size={20} color={colors.secondary} />
                </View>
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                </View>
            </View>
        );
    };

    const currentFolderName = pathStack.length > 0 ? pathStack[pathStack.length - 1].name : 'Storage';
    const canGoUp = pathStack.length > 1;
    const hasVideos = contents.some(item => item.isVideo);
    const hasFolders = contents.some(item => item.isFolder);
    const videoCount = contents.filter(item => item.isVideo).length;

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
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {currentFolderName}
                </Text>
                <TouchableOpacity
                    onPress={requestStorageAccess}
                    style={styles.headerButton}
                >
                    <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Breadcrumb navigation */}
            {pathStack.length > 1 && (
                <View style={[styles.breadcrumbContainer, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={navigateUp} style={styles.upButton}>
                        <Feather name="arrow-left" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <FlatList
                        horizontal
                        data={pathStack}
                        keyExtractor={(item, index) => `${item.uri}-${index}`}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.breadcrumbList}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => navigateToBreadcrumb(index)}
                                style={styles.breadcrumbItem}
                            >
                                {index > 0 && (
                                    <Feather name="chevron-right" size={14} color={colors.textSecondary} />
                                )}
                                <Text
                                    style={[
                                        styles.breadcrumbText,
                                        { color: index === pathStack.length - 1 ? colors.primary : colors.textSecondary }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Content */}
            {loading && contents.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading...
                    </Text>
                </View>
            ) : error && contents.length === 0 ? (
                <View style={styles.centered}>
                    <Feather name="folder" size={48} color={colors.textSecondary} />
                    <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={requestStorageAccess}
                    >
                        <Text style={styles.retryButtonText}>Select Storage</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={contents}
                    keyExtractor={(item) => item.uri}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <Text style={[styles.listHeader, { color: colors.textSecondary }]}>
                            {hasFolders && `${contents.filter(i => i.isFolder).length} folder${contents.filter(i => i.isFolder).length !== 1 ? 's' : ''}`}
                            {hasFolders && hasVideos && ' • '}
                            {hasVideos && `${videoCount} video${videoCount !== 1 ? 's' : ''}`}
                        </Text>
                    }
                />
            )}

            {/* Select folder button */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.selectButton,
                        { backgroundColor: colors.primary },
                        loading && styles.selectButtonDisabled
                    ]}
                    onPress={selectCurrentFolder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Feather name="check" size={20} color="#FFF" />
                            <Text style={styles.selectButtonText}>Select This Folder</Text>
                        </>
                    )}
                </TouchableOpacity>
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
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginHorizontal: 8,
    },
    breadcrumbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    upButton: {
        padding: 8,
        marginRight: 4,
    },
    breadcrumbList: {
        alignItems: 'center',
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    breadcrumbText: {
        fontSize: 13,
        maxWidth: 100,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    list: {
        padding: 12,
        paddingBottom: 100,
    },
    listHeader: {
        fontSize: 13,
        marginBottom: 12,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    videoItem: {
        opacity: 0.7,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    itemMeta: {
        fontSize: 13,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    selectButtonDisabled: {
        opacity: 0.7,
    },
    selectButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FolderPickerScreen;
