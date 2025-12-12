import { View, FlatList, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCourse } from '../context/CourseContext';

// Inline CourseCard
const CourseCard = ({ course, onPress, onLongPress, colors }) => (
    <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.9}
    >
        <View style={[styles.cardThumbnail, { backgroundColor: colors.border }]}>
            <Feather name="play-circle" size={40} color={colors.textSecondary} />
        </View>
        <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {course.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {course.videoCount} videos
            </Text>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${course.progress || 0}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>{course.progress || 0}%</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const { courses, deleteCourse, updateCourse } = useCourse();

    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [newName, setNewName] = useState('');

    const handleLongPress = (course) => {
        Alert.alert(
            'Course Options',
            `Options for "${course.title}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Rename',
                    onPress: () => {
                        setSelectedCourse(course);
                        setNewName(course.title);
                        setRenameModalVisible(true);
                    }
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Delete Course',
                            `Are you sure you want to remove "${course.title}" from your list?`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteCourse(course.id) }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const handleRename = () => {
        if (selectedCourse && newName.trim()) {
            updateCourse(selectedCourse.id, { title: newName.trim() });
            setRenameModalVisible(false);
            setSelectedCourse(null);
        }
    };

    const handleAddCourse = () => {
        // Navigate to folder picker
        navigation.navigate('FolderPicker');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>My Learning</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your progress</Text>
                </View>
            </View>

            <FlatList
                data={courses}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <CourseCard
                        course={item}
                        colors={colors}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
                        onLongPress={() => handleLongPress(item)}
                    />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Feather name="folder-plus" size={64} color={colors.border} />
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No courses yet</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Tap + to add a course folder
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={handleAddCourse}
            >
                <Feather name="plus" color="#FFF" size={28} />
            </TouchableOpacity>
            {/* Rename Modal */}
            <Modal
                transparent={true}
                visible={renameModalVisible}
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Rename Course</Text>
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                            placeholder="Enter new course name"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                                onPress={() => setRenameModalVisible(false)}
                            >
                                <Text style={{ color: colors.textPrimary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleRename}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20 },
    title: { fontSize: 28, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4 },
    list: { padding: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptyText: { fontSize: 14, marginTop: 8 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    cardThumbnail: { height: 140, justifyContent: 'center', alignItems: 'center' },
    cardContent: { padding: 16 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    cardSubtitle: { fontSize: 14, marginBottom: 12 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressBg: { flex: 1, height: 6, borderRadius: 3 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 12, width: 30 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', padding: 24, borderRadius: 16, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 24, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
});

export default HomeScreen;
