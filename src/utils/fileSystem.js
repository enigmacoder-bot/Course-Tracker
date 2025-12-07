import * as FileSystem from 'expo-file-system';

const { StorageAccessFramework } = FileSystem;

// Video file extensions
const VIDEO_EXTENSIONS = /\.(mp4|mkv|avi|mov|webm|m4v|wmv|flv|3gp|ts)$/i;

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

                // Quick check: if it's a video file, return immediately
                if (VIDEO_EXTENSIONS.test(filename)) {
                    return [{ uri, filename }];
                }

                // Check if it looks like a file with non-video extension
                // Files typically have extensions with 2-5 characters
                const hasExtension = /\.[a-zA-Z0-9]{1,5}$/.test(filename);
                if (hasExtension) {
                    // It's a non-video file, skip
                    return [];
                }

                // Try to process as directory
                try {
                    const subFiles = await readVideoFiles(uri, maxDepth, currentDepth + 1);
                    return subFiles;
                } catch (e) {
                    // Not a directory or can't read, skip
                    return [];
                }
            })
        );

        // Flatten all results
        const videoFiles = results.flat();

        // Only sort at the top level to avoid redundant sorting
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
 * Get folder name from SAF URI
 */
export const getFolderName = (directoryUri) => {
    try {
        const decoded = decodeURIComponent(directoryUri);
        const parts = decoded.split('/');
        const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
        return lastPart.replace(/%3A/g, '').replace(/primary:/g, '').replace(/document/g, '') || 'Course';
    } catch (e) {
        return 'Course';
    }
};
