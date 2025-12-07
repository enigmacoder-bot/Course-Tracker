import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CourseDetailScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { course } = route.params;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Feather name="arrow-left" color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>
                <View style={styles.heroContent}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                    <Text style={styles.courseInfo}>{course.videoCount} Videos</Text>
                </View>
            </View>

            {/* Video List */}
            <View style={[styles.listSection, { backgroundColor: colors.background }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Videos</Text>
                <FlatList
                    data={course.videos}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={[styles.videoRow, { borderBottomColor: colors.border }]}
                            onPress={() => navigation.navigate('VideoPlayer', { videoUri: item.uri, title: item.title })}
                        >
                            <View style={[styles.videoNum, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.videoNumText, { color: colors.primary }]}>{index + 1}</Text>
                            </View>
                            <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Feather name="play-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { height: 200, paddingBottom: 20 },
    header: { paddingTop: 50, paddingHorizontal: 16 },
    backBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, alignSelf: 'flex-start' },
    heroContent: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20 },
    courseTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    courseInfo: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    listSection: { flex: 1, marginTop: -16, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', paddingHorizontal: 16, marginBottom: 12 },
    videoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
    videoNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    videoNumText: { fontSize: 14, fontWeight: '600' },
    videoTitle: { flex: 1, fontSize: 14, marginRight: 12 },
});

export default CourseDetailScreen;
