import * as FileSystem from 'expo-file-system';

const { StorageAccessFramework } = FileSystem;

// Video file extensions
const VIDEO_EXTENSIONS = /\.(mp4|mkv|avi|mov|webm|m4v|wmv|flv|3gp|ts)$/i;

/**
 * Check if a filename is a video file
 */
export const isVideoFile = (filename) => VIDEO_EXTENSIONS.test(filename);

/**
 * Request access to a directory (opens SAF picker)
 */
export const requestFolderPermission = async () => {
    try {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
            return permissions.directoryUri;
        }
        return null;
    } catch (error) {
        console.error('Error requesting permissions:', error);
        return null;
    }
};

/**
 * Read contents of a directory at a SINGLE level (no recursion)
 * This is fast because it only lists immediate children
 * @param {string} directoryUri - SAF URI of the directory
 * @returns {Promise<Array>} Array of {uri, name, isFolder, isVideo}
 */
export const readDirectoryContents = async (directoryUri) => {
    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);

        // Process entries in parallel
        const contents = await Promise.all(
            entries.map(async (uri) => {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                // Check if it's a video file
                if (isVideoFile(name)) {
                    return {
                        uri,
                        name,
                        isFolder: false,
                        isVideo: true,
                    };
                }

                // If it's not a video, treat it as a potential folder first
                // Only skip if we are absolutely sure it's a non-video file we don't care about
                // But folders often have dots (e.g. "1. Introduction"), so we shouldn't skip based on extension alone.
                // We'll rely on readDirectoryAsync failing if it's not a directory.


                // Try to read as directory to confirm it's a folder
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    // Count videos quickly (just check extensions, no recursion)
                    const videoCount = subEntries.filter(subUri => {
                        const subName = decodeURIComponent(subUri).split('/').pop() || '';
                        return isVideoFile(subName);
                    }).length;

                    const subfolderCount = subEntries.filter(subUri => {
                        const subName = decodeURIComponent(subUri).split('/').pop() || '';
                        return !/\.[a-zA-Z0-9]{1,5}$/.test(subName);
                    }).length - videoCount; // Approximate subfolders

                    return {
                        uri,
                        name,
                        isFolder: true,
                        isVideo: false,
                        videoCount,
                        subfolderCount: Math.max(0, subfolderCount),
                        totalItems: subEntries.length,
                    };
                } catch (e) {
                    // Not a directory, skip
                    return null;
                }
            })
        );

        // Filter out nulls and sort: folders first, then alphabetically
        const filtered = contents.filter(item => item !== null);
        filtered.sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        return filtered;
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
};

/**
 * Recursively count all videos in a folder (for when user selects a course folder)
 * Optimized with parallel processing
 */
export const countVideosRecursively = async (directoryUri, maxDepth = 10, currentDepth = 0) => {
    if (currentDepth >= maxDepth) return 0;

    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);

        const counts = await Promise.all(
            entries.map(async (uri) => {
                const name = decodeURIComponent(uri).split('/').pop() || '';

                // Check if it's a video file
                if (isVideoFile(name)) {
                    return 1;
                }

                // Try to recurse into folder
                try {
                    return await countVideosRecursively(uri, maxDepth, currentDepth + 1);
                } catch (e) {
                    return 0;
                }
            })
        );

        return counts.reduce((sum, c) => sum + c, 0);
    } catch (error) {
        return 0;
    }
};

/**
 * Recursively read all video files from a directory (up to 10 levels deep)
 * Optimized for parallel processing to improve performance
 */
export const readVideoFiles = async (directoryUri, maxDepth = 10, currentDepth = 0) => {
    if (currentDepth >= maxDepth) {
        return [];
    }

    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);

        if (currentDepth === 0) {
            console.log(`Scanning ${entries.length} items...`);
        }

        // Process all entries in parallel
        const results = await Promise.all(
            entries.map(async (uri) => {
                const decodedUri = decodeURIComponent(uri);
                const filename = decodedUri.split('/').pop();

                // Check if it's a video file
                if (isVideoFile(name)) {
                    return [{ uri, filename: name }];
                }

                // Try to process as directory
                try {
                    const subFiles = await readVideoFiles(uri, maxDepth, currentDepth + 1);
                    return subFiles;
                } catch (e) {
                    return [];
                }
            })
        );

        // Flatten all results
        const videoFiles = results.flat();

        // Only sort at the top level
        if (currentDepth === 0) {
            videoFiles.sort((a, b) =>
                a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
            );
            console.log(`Found ${videoFiles.length} videos`);
        }

        return videoFiles;
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
};

/**
 * Read a course folder preserving its structure (sections/folders)
 * Returns: { rootVideos: [...], sections: [{ name, uri, videos: [...] }, ...] }
 * This allows displaying Week 1, Week 2, etc. as navigable sections
 */
export const readCourseStructure = async (directoryUri) => {
    try {
        console.log('Reading course structure...');
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);

        const rootVideos = [];
        const sections = [];

        // Process all entries in parallel
        await Promise.all(
            entries.map(async (uri) => {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                // Check if it's a video file
                if (isVideoFile(name)) {
                    rootVideos.push({
                        id: uri,
                        uri,
                        filename: name,
                        title: name.replace(/\.[^/.]+$/, ''),
                        completed: false,
                        progress: 0,
                    });
                    return;
                }

                // Try to read as directory (this is a section/folder)
                try {
                    const sectionVideos = await readVideoFiles(uri);
                    if (sectionVideos.length > 0) {
                        sections.push({
                            id: uri,
                            uri,
                            name,
                            videos: sectionVideos.map(v => ({
                                id: v.uri,
                                uri: v.uri,
                                filename: v.filename || v.name, // Handle both properties if different
                                title: (v.filename || v.name).replace(/\.[^/.]+$/, ''),
                                completed: false,
                                progress: 0,
                            })),
                        });
                    }
                } catch (e) {
                    // Not a directory, skip
                }
            })
        );

        // Sort sections alphabetically
        sections.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        // Sort root videos
        rootVideos.sort((a, b) =>
            a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
        );

        const totalVideos = rootVideos.length + sections.reduce((sum, s) => sum + s.videos.length, 0);
        console.log(`Found ${totalVideos} videos in ${sections.length} sections`);

        return {
            rootVideos,
            sections,
            totalVideos,
        };
    } catch (error) {
        console.error('Error reading course structure:', error);
        return { rootVideos: [], sections: [], totalVideos: 0 };
    }
};

/**
 * Get folder name from SAF URI
 */
export const getFolderName = (directoryUri) => {
    try {
        const decoded = decodeURIComponent(directoryUri);
        const parts = decoded.split('/').filter(p => p);
        const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
        return lastPart.replace(/%3A/g, '').replace(/primary:/g, '').replace(/document/g, '') || 'Course';
    } catch (e) {
        return 'Course';
    }
};

/**
 * Get parent directory URI from a SAF URI
 */
export const getParentUri = (directoryUri) => {
    try {
        const decoded = decodeURIComponent(directoryUri);
        const lastSlash = decoded.lastIndexOf('/');
        if (lastSlash > 0) {
            return encodeURIComponent(decoded.substring(0, lastSlash));
        }
        return null;
    } catch (e) {
        return null;
    }
};

/**
 * Build breadcrumb path from URI
 */
export const getBreadcrumbs = (directoryUri, rootUri) => {
    try {
        const decodedCurrent = decodeURIComponent(directoryUri);
        const decodedRoot = decodeURIComponent(rootUri);

        // Get the path after the root
        const relativePath = decodedCurrent.replace(decodedRoot, '');
        const parts = relativePath.split('/').filter(p => p);

        const breadcrumbs = [];
        let currentPath = decodedRoot;

        // Add root
        breadcrumbs.push({
            name: 'Storage',
            uri: rootUri,
        });

        // Add each folder in path
        for (const part of parts) {
            currentPath += '/' + part;
            breadcrumbs.push({
                name: part,
                uri: encodeURIComponent(currentPath),
            });
        }

        return breadcrumbs;
    } catch (e) {
        return [{ name: 'Storage', uri: rootUri }];
    }
};
