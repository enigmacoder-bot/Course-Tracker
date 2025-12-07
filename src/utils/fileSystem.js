import * as FileSystem from 'expo-file-system';

const { StorageAccessFramework } = FileSystem;

// Video file extensions to look for
const VIDEO_EXTENSIONS = /\.(mp4|mkv|avi|mov|webm|m4v|wmv|flv)$/i;

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
 * Check if a URI is a directory (SAF uses content:// URIs)
 * Directories in SAF typically end with %2F or have document type indicators
 */
const isDirectory = (uri) => {
    // SAF directory URIs usually contain 'document' and end with encoded path
    // Files usually have file extensions
    const decodedUri = decodeURIComponent(uri);
    const lastSegment = decodedUri.split('/').pop();

    // If it has a video extension, it's a file
    if (VIDEO_EXTENSIONS.test(lastSegment)) {
        return false;
    }

    // If it has any common file extension, it's likely a file
    if (/\.[a-zA-Z0-9]{2,4}$/.test(lastSegment)) {
        return false;
    }

    // Otherwise, assume it might be a directory
    return true;
};

/**
 * Recursively read all video files from a directory and its subdirectories
 * @param {string} directoryUri - SAF URI of the directory to scan
 * @param {number} maxDepth - Maximum recursion depth (default: 5)
 * @param {number} currentDepth - Current recursion depth
 * @returns {Promise<Array>} - Array of video file objects
 */
export const readVideoFiles = async (directoryUri, maxDepth = 5, currentDepth = 0) => {
    if (currentDepth >= maxDepth) {
        return [];
    }

    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
        const videoFiles = [];

        for (const uri of entries) {
            const decodedUri = decodeURIComponent(uri);
            const filename = decodedUri.split('/').pop();

            // Check if this is a video file
            if (VIDEO_EXTENSIONS.test(filename)) {
                videoFiles.push({
                    uri,
                    filename: filename,
                });
            }
            // Check if this might be a subdirectory and recurse
            else if (isDirectory(uri)) {
                try {
                    // Try to read as directory - if it works, it's a directory
                    const subFiles = await readVideoFiles(uri, maxDepth, currentDepth + 1);
                    videoFiles.push(...subFiles);
                } catch (e) {
                    // Not a directory or can't read it, skip
                    console.log('Skipping non-directory or unreadable:', filename);
                }
            }
        }

        // Sort videos by filename for consistent ordering
        videoFiles.sort((a, b) => {
            // Natural sort for proper ordering of numbered files (1, 2, 10 vs 1, 10, 2)
            return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
        });

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
        // SAF URIs have format like: content://...%3A or content://.../
        const parts = decoded.split('/');
        const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
        // Remove any URL encoding remnants
        return lastPart.replace(/%3A/g, '').replace(/primary:/g, '') || 'Course';
    } catch (e) {
        return 'Course';
    }
};
