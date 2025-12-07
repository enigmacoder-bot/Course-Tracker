import * as MediaLibrary from 'expo-media-library';

/**
 * Request permission to access media library
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['video']);
    return status === 'granted';
};

/**
 * Get all video albums from MediaStore
 * @returns {Promise<Array>} Array of albums with video counts
 */
export const getVideoAlbums = async () => {
    try {
        const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });

        // Filter albums that contain videos and get counts
        const videoAlbums = [];

        for (const album of albums) {
            // Check if album has any video assets
            const assets = await MediaLibrary.getAssetsAsync({
                album: album,
                mediaType: 'video',
                first: 1, // Just check if there's at least one video
            });

            if (assets.totalCount > 0) {
                videoAlbums.push({
                    id: album.id,
                    title: album.title,
                    videoCount: assets.totalCount,
                });
            }
        }

        // Sort by video count descending
        videoAlbums.sort((a, b) => b.videoCount - a.videoCount);

        return videoAlbums;
    } catch (error) {
        console.error('Error getting video albums:', error);
        return [];
    }
};

/**
 * Get all videos from a specific album
 * @param {string} albumId - Album ID to fetch videos from
 * @returns {Promise<Array>} Array of video objects with uri, filename, duration
 */
export const getVideosFromAlbum = async (albumId) => {
    try {
        const allVideos = [];
        let hasNextPage = true;
        let endCursor = undefined;

        while (hasNextPage) {
            const result = await MediaLibrary.getAssetsAsync({
                album: albumId,
                mediaType: 'video',
                first: 100,
                after: endCursor,
                sortBy: [[MediaLibrary.SortBy.default, true]],
            });

            allVideos.push(...result.assets);
            hasNextPage = result.hasNextPage;
            endCursor = result.endCursor;
        }

        // Map to consistent format
        return allVideos.map((asset) => ({
            id: asset.id,
            uri: asset.uri,
            filename: asset.filename,
            duration: asset.duration, // in seconds
            durationFormatted: formatDuration(asset.duration),
            width: asset.width,
            height: asset.height,
            creationTime: asset.creationTime,
        }));
    } catch (error) {
        console.error('Error getting videos from album:', error);
        return [];
    }
};

/**
 * Get ALL videos on device, grouped by album
 * This is the fastest way - single query to get everything
 * @returns {Promise<Array>} Array of album objects with their videos
 */
export const getAllVideosGrouped = async () => {
    try {
        console.log('Scanning all videos via MediaStore...');
        const startTime = Date.now();

        // Get all videos at once (much faster than per-album queries)
        const allVideos = [];
        let hasNextPage = true;
        let endCursor = undefined;

        while (hasNextPage) {
            const result = await MediaLibrary.getAssetsAsync({
                mediaType: 'video',
                first: 500, // Larger batch size for speed
                after: endCursor,
                sortBy: [[MediaLibrary.SortBy.default, true]],
            });

            allVideos.push(...result.assets);
            hasNextPage = result.hasNextPage;
            endCursor = result.endCursor;
        }

        // Group videos by album
        const albumMap = new Map();

        for (const video of allVideos) {
            const albumId = video.albumId || 'unknown';

            if (!albumMap.has(albumId)) {
                albumMap.set(albumId, {
                    id: albumId,
                    title: getAlbumNameFromPath(video.uri) || 'Unknown Album',
                    videos: [],
                });
            }

            albumMap.get(albumId).videos.push({
                id: video.id,
                uri: video.uri,
                filename: video.filename,
                title: video.filename.replace(/\.[^/.]+$/, ''),
                duration: video.duration,
                durationFormatted: formatDuration(video.duration),
                completed: false,
                progress: 0,
            });
        }

        // Convert to array and sort videos within each album
        const albums = Array.from(albumMap.values());

        for (const album of albums) {
            album.videos.sort((a, b) =>
                a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
            );
            album.videoCount = album.videos.length;
        }

        // Sort albums by video count
        albums.sort((a, b) => b.videoCount - a.videoCount);

        const elapsed = Date.now() - startTime;
        console.log(`Found ${allVideos.length} videos in ${albums.length} albums in ${elapsed}ms`);

        return albums;
    } catch (error) {
        console.error('Error getting all videos:', error);
        return [];
    }
};

/**
 * Extract album/folder name from file path
 */
const getAlbumNameFromPath = (uri) => {
    try {
        const decoded = decodeURIComponent(uri);
        const parts = decoded.split('/');
        // Get the parent folder name (second to last part)
        if (parts.length >= 2) {
            return parts[parts.length - 2];
        }
        return null;
    } catch (e) {
        return null;
    }
};

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 */
const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '--:--';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
