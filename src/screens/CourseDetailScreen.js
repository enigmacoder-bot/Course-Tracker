import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import VideoListItem from '../components/VideoListItem';
import { SPACING, FONTS, RADIUS } from '../constants/theme';

const CourseDetailScreen = ({ navigation, route }) => {
    const { colors, isDarkMode } = useTheme();
    const { course } = route.params;

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <Feather name="arrow-left" color="#FFF" size={24} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="more-vertical" color="#FFF" size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHero = () => (
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
            {renderHeader()}
            <View style={styles.heroContent}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>{course.videoCount} Videos</Text>
                    <Text style={styles.statsText}>•</Text>
                    <Text style={styles.statsText}>{course.totalDuration}</Text>
                </View>

                <TouchableOpacity style={styles.resumeButton}>
                    <Feather name="play-circle" color={colors.primary} size={20} />
                    <Text style={[styles.resumeText, { color: colors.primary }]}>Resume Learning</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {renderHero()}

            <View style={[styles.listContainer, { backgroundColor: colors.background }]}>
                <View style={styles.listHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Course Content</Text>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>{course.progress}% Completed</Text>
                </View>

                <FlatList
                    data={course.videos}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <VideoListItem
                            video={item}
                            onPress={() => navigation.navigate('VideoPlayer', { videoUri: item.uri, title: item.title })}
                            isActive={false}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 50, // Safe area top
        paddingHorizontal: SPACING.m,
    },
    iconButton: {
        padding: SPACING.xs,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: RADIUS.full,
    },
    hero: {
        height: 280,
        justifyContent: 'space-between',
        paddingBottom: SPACING.xl,
    },
    heroContent: {
        paddingHorizontal: SPACING.l,
    },
    courseTitle: {
        fontSize: FONTS.sizes.hero,
        fontWeight: FONTS.weights.bold,
        color: '#FFF',
        marginBottom: SPACING.s,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    statsText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: FONTS.sizes.body,
    },
    resumeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        alignSelf: 'flex-start',
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.l,
        borderRadius: RADIUS.full,
        gap: SPACING.xs,
    },
    resumeText: {
        fontWeight: FONTS.weights.bold,
        fontSize: FONTS.sizes.body,
    },
    listContainer: {
        flex: 1,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: FONTS.sizes.h3,
        fontWeight: FONTS.weights.semibold,
    },
    progressText: {
        fontSize: FONTS.sizes.bodySmall,
    },
    listContent: {
        padding: SPACING.m,
    },
});

export default CourseDetailScreen;
