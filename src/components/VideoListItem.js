import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONTS } from '../constants/theme';

const VideoListItem = ({ video, onPress, isActive }) => {
    const { colors } = useTheme();

    const getStatusIcon = () => {
        if (video.completed) {
            return <Feather name="check-circle" size={24} color={colors.success} />;
        }
        if (video.progress > 0) {
            return <Feather name="clock" size={24} color={colors.warning} />;
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
            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.border }]}>
                    <Feather name="play" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration || '--:--'}</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text
                    style={[
                        styles.title,
                        { color: isActive ? colors.primary : colors.textPrimary }
                    ]}
                    numberOfLines={2}
                >
                    {video.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {video.fileName}
                </Text>
            </View>

            {/* Status */}
            <View style={styles.status}>
                {getStatusIcon()}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: SPACING.s,
        alignItems: 'center',
        borderRadius: RADIUS.m,
        marginBottom: SPACING.xs,
    },
    thumbnailContainer: {
        width: 80,
        height: 45,
        borderRadius: RADIUS.s,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        marginLeft: SPACING.m,
        justifyContent: 'center',
    },
    title: {
        fontSize: FONTS.sizes.body,
        fontWeight: FONTS.weights.medium,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: FONTS.sizes.caption,
    },
    status: {
        marginLeft: SPACING.s,
    },
});

export default VideoListItem;
