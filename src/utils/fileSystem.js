import * as FileSystem from 'expo-file-system';

const { StorageAccessFramework } = FileSystem;

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

export const readVideoFiles = async (directoryUri) => {
    try {
        const files = await StorageAccessFramework.readDirectoryAsync(directoryUri);
        const videoFiles = files.filter(uri => {
            const filename = decodeURIComponent(uri.split('/').pop());
            return filename.match(/\.(mp4|mkv|avi|mov)$/i);
        });

        // Get metadata for each file (name, size, etc.)
        // Note: SAF doesn't give duration directly, we'll get that when playing or using a separate library if needed.
        // For now, we just return the URIs and filenames.
        return videoFiles.map(uri => ({
            uri,
            filename: decodeURIComponent(uri.split('/').pop()),
        }));
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
};
