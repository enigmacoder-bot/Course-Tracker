import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Dimensions, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoPlayerScreen = ({ navigation, route }) => {
    const { videoUri, title } = route.params;
    const video = useRef(null);
    const [status, setStatus] = useState({});
    const [showControls, setShowControls] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let timeout;
        if (showControls && status.isPlaying) {
            timeout = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [showControls, status.isPlaying]);

    const formatTime = (millis) => {
        if (!millis || isNaN(millis)) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handlePlayPause = async () => {
        if (!video.current) return;
        try {
            if (status.isPlaying) {
                await video.current.pauseAsync();
            } else {
                await video.current.playAsync();
            }
        } catch (e) {
            console.error('Play/Pause error:', e);
        }
    };

    const handleSeek = async (direction) => {
        if (!video.current || !status.positionMillis) return;
        try {
            const newPosition = status.positionMillis + (direction * 10000); // 10 seconds
            const clampedPosition = Math.max(0, Math.min(newPosition, status.durationMillis || 0));
            await video.current.setPositionAsync(clampedPosition);
        } catch (e) {
            console.error('Seek error:', e);
        }
    };

    const handleError = (errorMessage) => {
        console.error('Video error:', errorMessage);
        setError('Unable to play this video. The file format may not be supported.');
    };

    const progressPercent = status.durationMillis
        ? (status.positionMillis / status.durationMillis) * 100
        : 0;

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <TouchableOpacity
                activeOpacity={1}
                style={styles.videoContainer}
                onPress={() => setShowControls(!showControls)}
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Feather name="alert-circle" size={48} color="#ff6b6b" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.backButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Video
                        ref={video}
                        style={styles.video}
                        source={{ uri: videoUri }}
                        useNativeControls={false}
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping={false}
                        shouldPlay={true}
                        onPlaybackStatusUpdate={setStatus}
                        onError={handleError}
                    />
                )}

                {/* Controls Overlay */}
                {showControls && !error && (
                    <View style={styles.overlay}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                                <Feather name="arrow-left" color="#FFF" size={24} />
                            </TouchableOpacity>
                            <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {/* Center Controls */}
                        <View style={styles.centerControls}>
                            <TouchableOpacity style={styles.seekBtn} onPress={() => handleSeek(-1)}>
                                <Feather name="rotate-ccw" color="#FFF" size={28} />
                                <Text style={styles.seekText}>10s</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                                <Feather name={status.isPlaying ? "pause" : "play"} color="#000" size={36} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.seekBtn} onPress={() => handleSeek(1)}>
                                <Feather name="rotate-cw" color="#FFF" size={28} />
                                <Text style={styles.seekText}>10s</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Bar */}
                        <View style={styles.bottomBar}>
                            <Text style={styles.timeText}>{formatTime(status.positionMillis)}</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                            </View>
                            <Text style={styles.timeText}>{formatTime(status.durationMillis)}</Text>
                        </View>
                    </View>
                )}

                {/* Loading Indicator */}
                {status.isBuffering && !error && (
                    <View style={styles.bufferingOverlay}>
                        <Text style={styles.bufferingText}>Loading...</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    videoContainer: { flex: 1, justifyContent: 'center' },
    video: { width: '100%', height: '100%' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
        padding: 20
    },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20 },
    iconBtn: { padding: 8 },
    videoTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
    centerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 50 },
    playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    seekBtn: { alignItems: 'center' },
    seekText: { color: '#FFF', fontSize: 12, marginTop: 4 },
    bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 20 },
    timeText: { color: '#FFF', fontSize: 12, minWidth: 50 },
    progressBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
    progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
    bufferingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    bufferingText: { color: '#FFF', fontSize: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 16 },
    backButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#333', borderRadius: 8 },
    backButtonText: { color: '#FFF', fontSize: 14 },
});

export default VideoPlayerScreen;
