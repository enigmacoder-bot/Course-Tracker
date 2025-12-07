import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CourseCard = ({ course, onPress }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.thumbnailContainer}>
                {course.thumbnail ? (
                    <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                    <View style={[styles.placeholderThumbnail, { backgroundColor: colors.border }]}>
                        <Feather name="play" size={32} color={colors.textSecondary} />
                    </View>
                )}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{course.totalDuration || '0 videos'}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                    {course.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {course.videoCount || 0} videos
                </Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${course.progress || 0}%` }]} />
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
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    thumbnailContainer: { height: 180, width: '100%', position: 'relative' },
    thumbnail: { width: '100%', height: '100%' },
    placeholderThumbnail: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
    content: { padding: 16 },
    title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
    subtitle: { fontSize: 14, marginBottom: 12 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressBarBackground: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    progressText: { fontSize: 12, fontWeight: '500', width: 35, textAlign: 'right' },
});

export default CourseCard;
