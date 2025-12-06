// Test 7: Completely minimal HomeScreen - no imports from src folder
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Learning</Text>
                <Text style={styles.headerSubtitle}>Track your progress</Text>
            </View>
            <View style={styles.emptyState}>
                <Text style={styles.text}>Test 7: Minimal HomeScreen works!</Text>
            </View>
            <TouchableOpacity style={styles.fab}>
                <Text style={{ color: '#FFF', fontSize: 32 }}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        padding: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F1F5F9',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#94A3B8',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 32,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default HomeScreen;
