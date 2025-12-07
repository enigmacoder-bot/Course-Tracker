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
 */
export const readVideoFiles = async (directoryUri, maxDepth = 10, currentDepth = 0) => {
    if (currentDepth >= maxDepth) {
        console.log(`Max depth ${maxDepth} reached`);
        return [];
    }

    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
        const videoFiles = [];

        console.log(`Scanning depth ${currentDepth}: found ${entries.length} entries`);

        for (const uri of entries) {
            const decodedUri = decodeURIComponent(uri);
            const filename = decodedUri.split('/').pop();

            // Check if this is a video file
            if (VIDEO_EXTENSIONS.test(filename)) {
                videoFiles.push({
                    uri,
                    filename: filename,
                });
                console.log(`Found video: ${filename}`);
            } else {
                // Try to read as directory - this is the most reliable way to check
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    console.log(`Found folder: ${filename} with ${subEntries.length} items`);

                    // Recursively get videos from subdirectory
                    const subFiles = await readVideoFiles(uri, maxDepth, currentDepth + 1);
                    videoFiles.push(...subFiles);
                } catch (e) {
                    // Not a directory, might be a non-video file - skip
                    console.log(`Skipping: ${filename}`);
                }
            }
        }

        // Sort videos naturally (1, 2, 10 instead of 1, 10, 2)
        videoFiles.sort((a, b) =>
            a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
        );

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
