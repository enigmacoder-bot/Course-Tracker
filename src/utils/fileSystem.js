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
 * Read videos from a section (folder) with limited depth
 * Uses try-catch on readDirectoryAsync to detect directories
 * (getInfoAsync doesn't work reliably with SAF content:// URIs)
 * @param {string} directoryUri - SAF URI of the section folder
 * @param {number} maxDepth - Maximum depth to recurse (default: 5)
 * @param {number} currentDepth - Current recursion depth
 * @returns {Promise<Array>} Array of video objects
 */
export const readSectionVideos = async (directoryUri, maxDepth = 5, currentDepth = 0) => {
    if (currentDepth >= maxDepth) {
        console.log(`Max depth ${maxDepth} reached, stopping recursion`);
        return [];
    }

    try {
        console.log(`[Depth ${currentDepth}] Reading directory: ${directoryUri.substring(0, 80)}...`);
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
        console.log(`[Depth ${currentDepth}] Found ${entries.length} entries`);

        const videos = [];

        // Process entries sequentially to avoid race conditions and get better logging
        for (const uri of entries) {
            try {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                // Check if it's a video file by extension
                if (isVideoFile(name)) {
                    console.log(`[Depth ${currentDepth}] Found video: ${name}`);
                    videos.push({
                        id: uri,
                        uri,
                        filename: name,
                        title: name.replace(/\.[^/.]+$/, ''),
                        completed: false,
                        progress: 0,
                    });
                    continue;
                }

                // Try to read as directory - if it succeeds, it's a directory
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    console.log(`[Depth ${currentDepth}] Found subfolder: ${name} with ${subEntries.length} entries`);

                    // Recurse into this directory
                    const subVideos = await readSectionVideos(uri, maxDepth, currentDepth + 1);
                    console.log(`[Depth ${currentDepth}] Subfolder ${name} returned ${subVideos.length} videos`);
                    videos.push(...subVideos);
                } catch (dirError) {
                    // Not a directory - it's a non-video file, skip it
                    console.log(`[Depth ${currentDepth}] Skipping non-video file: ${name}`);
                }
            } catch (e) {
                console.log(`[Depth ${currentDepth}] Error processing entry:`, e.message);
            }
        }

        console.log(`[Depth ${currentDepth}] Returning ${videos.length} videos from this level`);

        // Sort videos alphabetically
        videos.sort((a, b) =>
            a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
        );

        return videos;
    } catch (error) {
        console.error(`[Depth ${currentDepth}] Error reading directory:`, error);
        return [];
    }
};

/**
 * Read a course folder preserving its structure (sections/folders)
 * Returns: { rootVideos: [...], sections: [{ name, uri, videos: [...] }, ...] }
 * Direct subfolders (like Week 1, Week 2) become sections
 * Videos in those sections are collected up to 5 levels deep
 */
export const readCourseStructure = async (directoryUri) => {
    try {
        console.log('Reading course structure...');
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);

        const rootVideos = [];
        const sections = [];

        // Process entries sequentially for better logging
        for (const uri of entries) {
            try {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                // Check if it's a video file at root level
                if (isVideoFile(name)) {
                    console.log(`Found root video: ${name}`);
                    rootVideos.push({
                        id: uri,
                        uri,
                        filename: name,
                        title: name.replace(/\.[^/.]+$/, ''),
                        completed: false,
                        progress: 0,
                    });
                    continue;
                }

                // Try to read as directory - if it succeeds, it's a section
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    console.log(`Found section folder: ${name} with ${subEntries.length} entries`);

                    // Read videos from this section (with depth limit of 5)
                    const sectionVideos = await readSectionVideos(uri, 5, 0);
                    console.log(`Section ${name} has ${sectionVideos.length} videos`);

                    if (sectionVideos.length > 0) {
                        sections.push({
                            id: uri,
                            uri,
                            name,
                            videos: sectionVideos,
                        });
                    }
                } catch (dirError) {
                    // Not a directory - it's a non-video file, skip it
                    console.log(`Skipping non-video file: ${name}`);
                }
            } catch (e) {
                console.log('Error processing entry:', e.message);
            }
        }

        // Sort sections alphabetically/numerically (Week 1, Week 2, etc.)
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
 * Read videos from a section with UI logging
 * Uses visited Set to prevent infinite loops
 */
const readSectionVideosWithLogs = async (directoryUri, log, visited, maxDepth = 5, currentDepth = 0) => {
    // Prevent infinite loops by checking if we've already visited this URI
    if (visited.has(directoryUri)) {
        log(`[D${currentDepth}] ⚠ Already visited, skipping`);
        return [];
    }
    visited.add(directoryUri);

    if (currentDepth >= maxDepth) {
        log(`Depth ${maxDepth} reached, stopping`);
        return [];
    }

    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
        log(`[D${currentDepth}] Found ${entries.length} entries`);

        const videos = [];

        for (const uri of entries) {
            // Skip if already visited
            if (visited.has(uri)) {
                continue;
            }

            try {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                if (isVideoFile(name)) {
                    log(`[D${currentDepth}] ✓ Video: ${name}`);
                    videos.push({
                        id: uri,
                        uri,
                        filename: name,
                        title: name.replace(/\.[^/.]+$/, ''),
                        completed: false,
                        progress: 0,
                    });
                    continue;
                }

                // Try to read as directory
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    log(`[D${currentDepth}] 📁 Folder: ${name} (${subEntries.length} items)`);

                    const subVideos = await readSectionVideosWithLogs(uri, log, visited, maxDepth, currentDepth + 1);
                    videos.push(...subVideos);
                } catch (dirError) {
                    log(`[D${currentDepth}] ✗ Skip: ${name}`);
                }
            } catch (e) {
                log(`[D${currentDepth}] Error: ${e.message}`);
            }
        }

        return videos;
    } catch (error) {
        log(`Error: ${error.message}`);
        return [];
    }
};

/**
 * Read course structure with UI logging callback
 * LAZY LOADING: Only lists sections, doesn't scan for videos inside them
 * @param {string} directoryUri - SAF URI
 * @param {function} log - Callback to log messages to UI
 */
export const readCourseStructureWithLogs = async (directoryUri, log) => {
    try {
        log('Reading root directory...');
        const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
        log(`Root has ${entries.length} entries`);

        const rootVideos = [];
        const sections = [];

        for (const uri of entries) {
            try {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                if (isVideoFile(name)) {
                    log(`✓ Root video: ${name}`);
                    rootVideos.push({
                        id: uri,
                        uri,
                        filename: name,
                        title: name.replace(/\.[^/.]+$/, ''),
                        completed: false,
                        progress: 0,
                    });
                    continue;
                }

                // Try to read as directory - but DON'T scan for videos yet (lazy loading)
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    log(`📁 Section: ${name} (${subEntries.length} items) - not loaded`);

                    // Add section with loaded: false flag - videos will be loaded on demand
                    sections.push({
                        id: uri,
                        uri,
                        name,
                        itemCount: subEntries.length,
                        videos: [],
                        loaded: false, // Videos not yet loaded
                    });
                } catch (dirError) {
                    log(`✗ Not a folder: ${name}`);
                }
            } catch (e) {
                log(`Error: ${e.message}`);
            }
        }

        sections.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        rootVideos.sort((a, b) =>
            a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
        );

        // Only count root videos initially - section videos will be counted when loaded
        log(`✓ Found ${rootVideos.length} root videos, ${sections.length} sections (not scanned yet)`);

        return {
            rootVideos,
            sections,
            totalVideos: rootVideos.length, // Initially just root videos
        };
    } catch (error) {
        log(`FATAL: ${error.message}`);
        return { rootVideos: [], sections: [], totalVideos: 0 };
    }
};

/**
 * Load videos for a specific section (on-demand loading)
 * Called when user expands a section in CourseDetailScreen
 * @param {string} sectionUri - SAF URI of the section folder
 * @param {function} log - Optional callback to log messages
 * @returns {Promise<Array>} Array of video objects
 */
export const loadSectionVideosWithLogs = async (sectionUri, log = () => { }) => {
    // DON'T add sectionUri to visited here - readSectionVideosWithLogs will add it
    const visited = new Set();

    log('Loading section videos...');

    try {
        const videos = await readSectionVideosWithLogs(sectionUri, log, visited, 5, 0);
        log(`✓ Loaded ${videos.length} videos`);
        return videos;
    } catch (error) {
        log(`Error loading section: ${error.message}`);
        return [];
    }
};

/**
 * Load folder contents - returns folders and videos SEPARATELY (not flattened)
 * This is for the nested folder UI - preserves hierarchy
 * @param {string} folderUri - SAF URI of the folder
 * @param {function} log - Logging callback
 * @returns {Promise<{folders: Array, videos: Array}>}
 */
export const loadFolderContents = async (folderUri, log = () => { }) => {
    log('Loading folder contents...');

    try {
        const entries = await StorageAccessFramework.readDirectoryAsync(folderUri);
        log(`Found ${entries.length} entries`);

        const folders = [];
        const videos = [];

        for (const uri of entries) {
            try {
                const decodedUri = decodeURIComponent(uri);
                const name = decodedUri.split('/').pop() || 'Unknown';

                // Check if it's a video file
                if (isVideoFile(name)) {
                    log(`✓ Video: ${name}`);
                    videos.push({
                        id: uri,
                        uri,
                        type: 'video',
                        filename: name,
                        title: name.replace(/\.[^/.]+$/, ''),
                        completed: false,
                        progress: 0,
                    });
                    continue;
                }

                // Try to read as directory (to verify it IS a folder)
                try {
                    const subEntries = await StorageAccessFramework.readDirectoryAsync(uri);
                    log(`📁 Folder: ${name} (${subEntries.length} items)`);
                    folders.push({
                        id: uri,
                        uri,
                        type: 'folder',
                        name,
                        itemCount: subEntries.length,
                        children: [], // Will be loaded on demand
                        loaded: false,
                    });
                } catch (dirError) {
                    // Not a folder, not a video - skip (e.g., text files, images)
                    log(`✗ Skip non-media: ${name}`);
                }
            } catch (e) {
                log(`Error: ${e.message}`);
            }
        }

        // Sort folders and videos alphabetically
        folders.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        videos.sort((a, b) =>
            a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
        );

        log(`✓ Found ${folders.length} folders, ${videos.length} videos`);

        return { folders, videos };
    } catch (error) {
        log(`Error: ${error.message}`);
        return { folders: [], videos: [] };
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
