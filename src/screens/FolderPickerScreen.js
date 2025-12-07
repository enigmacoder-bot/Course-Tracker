import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    SafeAreaView,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { requestMediaLibraryPermission, getAllVideosGrouped } from '../utils/mediaLibrary';

const FolderPickerScreen = ({ navigation, route }) => {
    const { colors, isDarkMode } = useTheme();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAlbums();
    }, []);

    const loadAlbums = async () => {
        setLoading(true);
        setError(null);

        try {
            const hasPermission = await requestMediaLibraryPermission();
            if (!hasPermission) {
                setError('Permission denied. Please grant access to your media library.');
                setLoading(false);
                return;
            }

            const videoAlbums = await getAllVideosGrouped();

            if (videoAlbums.length === 0) {
                setError('No video folders found on your device.');
            }

            setAlbums(videoAlbums);
        } catch (err) {
            console.error('Error loading albums:', err);
            setError('Failed to scan videos. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAlbum = (album) => {
        // Navigate back to home with selected album data
        navigation.navigate('Home', {
            newCourse: {
                id: album.id,
                title: album.title,
                thumbnail: null,
                videoCount: album.videoCount,
                progress: 0,
                videos: album.videos,
            },
        });
    };

    const renderAlbumItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.albumItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSelectAlbum(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.albumIcon, { backgroundColor: colors.primary + '20' }]}>
                <Feather name="folder" size={24} color={colors.primary} />
            </View>
            <View style={styles.albumInfo}>
                <Text style={[styles.albumTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={[styles.albumCount, { color: colors.textSecondary }]}>
                    {item.videoCount} video{item.videoCount !== 1 ? 's' : ''}
                </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Course Folder</Text>
                <TouchableOpacity onPress={loadAlbums} style={styles.refreshButton}>
                    <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Scanning videos...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Feather name="alert-circle" size={48} color={colors.textSecondary} />
                    <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={loadAlbums}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={albums}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAlbumItem}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <Text style={[styles.listHeader, { color: colors.textSecondary }]}>
                            Found {albums.length} folder{albums.length !== 1 ? 's' : ''} with videos
                        </Text>
                    }
                />
            )}
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
        padding: 16,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    },
    refreshButton: {
        padding: 4,
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
        padding: 16,
    },
    listHeader: {
        fontSize: 14,
        marginBottom: 12,
    },
    albumItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    albumIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    albumInfo: {
        flex: 1,
    },
    albumTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    albumCount: {
        fontSize: 14,
    },
});

export default FolderPickerScreen;
