import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const VideoListItem = ({ video, onPress, isActive }) => {
    const { colors } = useTheme();

    const getStatusIcon = () => {
        if (video.completed) {
            return <Feather name="check-circle" size={24} color={colors.success || '#10B981'} />;
        }
        if (video.progress > 0) {
            return <Feather name="clock" size={24} color={colors.warning || '#F59E0B'} />;
        }
        return <Feather name="circle" size={24} color={colors.textSecondary} />;
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isActive && { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.thumbnailContainer}>
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.border }]}>
                    <Feather name="play" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration || '--:--'}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text
                    style={[styles.title, { color: isActive ? colors.primary : colors.textPrimary }]}
                    numberOfLines={2}
                >
                    {video.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {video.fileName}
                </Text>
            </View>

            <View style={styles.status}>
                {getStatusIcon()}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', padding: 12, alignItems: 'center', borderRadius: 12, marginBottom: 8 },
    thumbnailContainer: { width: 80, height: 45, borderRadius: 8, overflow: 'hidden', position: 'relative' },
    thumbnailPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    durationBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 4, borderRadius: 4 },
    durationText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
    content: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    subtitle: { fontSize: 12 },
    status: { marginLeft: 12 },
});

export default VideoListItem;
