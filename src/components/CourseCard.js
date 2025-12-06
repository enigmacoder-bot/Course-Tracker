import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS, FONTS } from '../constants/theme';

const CourseCard = ({ course, onPress }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                SHADOWS.light,
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Thumbnail Area */}
            <View style={styles.thumbnailContainer}>
                {course.thumbnail ? (
                    <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                    <View style={[styles.placeholderThumbnail, { backgroundColor: colors.border }]}>
                        <Feather name="play" size={32} color={colors.textSecondary} />
                    </View>
                )}

                {/* Duration Badge */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{course.totalDuration || '0h 0m'}</Text>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                <Text
                    style={[styles.title, { color: colors.textPrimary }]}
                    numberOfLines={2}
                >
                    {course.title}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {course.videoCount || 0} videos
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View
                        style={[
                            styles.progressBarBackground,
                            { backgroundColor: colors.border }
                        ]}
                    >
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    backgroundColor: colors.primary,
                                    width: `${course.progress || 0}%`
                                }
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                        {Math.round(course.progress || 0)}%
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.m,
        borderWidth: 1,
        marginBottom: SPACING.m,
        overflow: 'hidden',
    },
    thumbnailContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholderThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        bottom: SPACING.xs,
        right: SPACING.xs,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: RADIUS.s,
    },
    badgeText: {
        color: '#FFF',
        fontSize: FONTS.sizes.caption,
        fontWeight: FONTS.weights.medium,
    },
    content: {
        padding: SPACING.m,
    },
    title: {
        fontSize: FONTS.sizes.h3,
        fontWeight: FONTS.weights.semibold,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONTS.sizes.bodySmall,
        marginBottom: SPACING.s,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: RADIUS.full,
    },
    progressText: {
        fontSize: FONTS.sizes.caption,
        fontWeight: FONTS.weights.medium,
        width: 35,
        textAlign: 'right',
    },
});

export default CourseCard;
