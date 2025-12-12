import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Dimensions, PanResponder, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { VLCPlayer } from 'react-native-vlc-media-player';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

const VideoPlayerScreen = ({ navigation, route }) => {
    const { videoUri, title, videoId } = route.params;
    const playerRef = useRef(null);

    // Resolved file path for VLC
    const [resolvedUri, setResolvedUri] = useState(null);
    const [loadError, setLoadError] = useState(null);

    // Playback state
    const [paused, setPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [volume, setVolume] = useState(100);
    const [muted, setMuted] = useState(false);

    const controlsTimeout = useRef(null);

    // Resolve content:// URI to file path for VLCPlayer
    useEffect(() => {
        const resolveVideoUri = async () => {
            try {
                console.log('Original videoUri:', videoUri);
                console.log('Video ID:', videoId);

                // If we have a videoId, use MediaLibrary to get the real file path
                if (videoId) {
                    const assetInfo = await MediaLibrary.getAssetInfoAsync(videoId);
                    if (assetInfo && assetInfo.localUri) {
                        // Remove file:// prefix if present - VLC adds it internally
                        let filePath = assetInfo.localUri;
                        if (filePath.startsWith('file://')) {
                            filePath = filePath.substring(7);
                        }
                        console.log('Resolved localUri:', filePath);
                        setResolvedUri(filePath);
                        return;
                    }
                }

                // Fallback: Try to extract file path from content:// URI
                if (videoUri.startsWith('content://')) {
                    // For content URIs, we need the asset ID to resolve properly
                    console.warn('Content URI without video ID - playback may fail');
                    setLoadError('Cannot resolve video path. Please try again.');
                    return;
                }

                // If it's already a file path, use it directly
                if (videoUri.startsWith('file://')) {
                    setResolvedUri(videoUri.substring(7));
                } else if (videoUri.startsWith('/')) {
                    setResolvedUri(videoUri);
                } else {
                    // Network URL or other format
                    setResolvedUri(videoUri);
                }
            } catch (error) {
                console.error('Error resolving video URI:', error);
                setLoadError('Failed to load video: ' + error.message);
            }
        };

        resolveVideoUri();
    }, [videoUri, videoId]);

    // Auto-hide controls after 4 seconds
    useEffect(() => {
        if (showControls && !paused && !showSpeedMenu) {
            controlsTimeout.current = setTimeout(() => setShowControls(false), 4000);
        }
        return () => clearTimeout(controlsTimeout.current);
    }, [showControls, paused, showSpeedMenu]);

    // Format time (seconds to HH:MM:SS or MM:SS)
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle progress updates from VLC
    const handleProgress = (event) => {
        if (!isSeeking && event.currentTime !== undefined) {
            setCurrentTime(event.currentTime / 1000); // Convert ms to seconds
        }
        if (event.duration !== undefined && event.duration > 0) {
            setDuration(event.duration / 1000); // Convert ms to seconds
        }
    };

    // Handle load event to get duration
    const handleLoad = (event) => {
        console.log('VLC loaded:', event);
        if (event.duration) {
            setDuration(event.duration / 1000);
        }
        setIsBuffering(false);
    };

    // Seek to position (0-1 progress)
    const handleSeekToPosition = (positionPercent) => {
        if (duration > 0) {
            const seekTimeMs = positionPercent * duration * 1000; // Convert to milliseconds
            playerRef.current?.seek(seekTimeMs);
            setCurrentTime(positionPercent * duration);
        }
    };

    // Skip forward/backward by seconds
    const handleSkip = (seconds) => {
        const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        const seekTimeMs = newTime * 1000;
        playerRef.current?.seek(seekTimeMs);
        setCurrentTime(newTime);
    };

    // Handle end of video
    const handleEnd = () => {
        console.log('Video ended');
        navigation.goBack();
    };

    // Handle buffering state
    const handleBuffering = (event) => {
        setIsBuffering(event.isBuffering);
    };

    // Calculate progress percentage
    const progressPercent = duration > 0 ? (isSeeking ? seekPosition : currentTime / duration) : 0;

    // Progress bar pan responder for seeking
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsSeeking(true);
                clearTimeout(controlsTimeout.current);
            },
            onPanResponderMove: (evt, gestureState) => {
                const barWidth = SCREEN_WIDTH - 160;
                const position = Math.max(0, Math.min(1, (gestureState.moveX - 80) / barWidth));
                setSeekPosition(position);
            },
            onPanResponderRelease: () => {
                handleSeekToPosition(seekPosition);
                setIsSeeking(false);
            },
        })
    ).current;

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Error State */}
            {loadError && (
                <View style={styles.errorOverlay}>
                    <Feather name="alert-circle" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{loadError}</Text>
                    <TouchableOpacity
                        style={styles.errorBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.errorBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Loading State - waiting for URI resolution */}
            {!resolvedUri && !loadError && (
                <View style={styles.bufferingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={styles.bufferingText}>Preparing video...</Text>
                </View>
            )}

            {/* VLC Player Component - only render when we have a valid path */}
            {resolvedUri && !loadError && (
                <VLCPlayer
                    ref={playerRef}
                    style={styles.video}
                    source={{ uri: resolvedUri }}
                    autoplay={true}
                    paused={paused}
                    rate={playbackRate}
                    volume={muted ? 0 : volume}
                    muted={muted}
                    repeat={false}
                    resizeMode="contain"
                    onProgress={handleProgress}
                    onLoad={handleLoad}
                    onEnd={handleEnd}
                    onBuffering={handleBuffering}
                    onError={(e) => {
                        console.error('VLC Error:', e);
                        setLoadError('Video playback error. The file may be corrupted or unsupported.');
                    }}
                    onStopped={() => console.log('VLC Stopped')}
                    onPlaying={() => setIsBuffering(false)}
                    onPaused={() => console.log('VLC Paused')}
                />
            )}

            {/* Buffering Indicator */}
            {isBuffering && (
                <View style={styles.bufferingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={styles.bufferingText}>Loading...</Text>
                </View>
            )}

            {/* Tap area to toggle controls */}
            <Pressable style={styles.touchOverlay} onPress={() => setShowControls(!showControls)} />

            {/* Controls Overlay */}
            {showControls && (
                <View style={styles.overlay}>
                    {/* Top Bar - Title and actions */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Feather name="arrow-left" color="#FFF" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                        <TouchableOpacity onPress={() => setMuted(!muted)} style={styles.iconBtn}>
                            <Feather name={muted ? "volume-x" : "volume-2"} color="#FFF" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Center Controls - Play/Pause and Skip */}
                    <View style={styles.centerControls}>
                        <TouchableOpacity onPress={() => handleSkip(-10)} style={styles.skipBtn}>
                            <Feather name="rotate-ccw" color="#FFF" size={32} />
                            <Text style={styles.skipText}>10</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.playBtn} onPress={() => setPaused(!paused)}>
                            <Feather name={paused ? "play" : "pause"} color="#000" size={40} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleSkip(10)} style={styles.skipBtn}>
                            <Feather name="rotate-cw" color="#FFF" size={32} />
                            <Text style={styles.skipText}>10</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Bar - Progress and Speed */}
                    <View style={styles.bottomBar}>
                        <Text style={styles.time}>{formatTime(isSeeking ? seekPosition * duration : currentTime)}</Text>

                        {/* Seekable Progress Bar */}
                        <View style={styles.progressContainer} {...panResponder.panHandlers}>
                            <View style={styles.progressBg}>
                                <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
                                <View style={[styles.seekThumb, { left: `${progressPercent * 100}%` }]} />
                            </View>
                        </View>

                        <Text style={styles.time}>{formatTime(duration)}</Text>

                        {/* Playback Speed Button */}
                        <TouchableOpacity onPress={() => setShowSpeedMenu(true)} style={styles.speedBtn}>
                            <Text style={styles.speedText}>{playbackRate}x</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Playback Speed Selection Modal */}
            <Modal visible={showSpeedMenu} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowSpeedMenu(false)}>
                    <View style={styles.speedMenu}>
                        <Text style={styles.speedMenuTitle}>Playback Speed</Text>
                        {PLAYBACK_RATES.map(rate => (
                            <TouchableOpacity
                                key={rate}
                                style={[styles.speedOption, playbackRate === rate && styles.speedOptionActive]}
                                onPress={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}
                            >
                                <Text style={[styles.speedOptionText, playbackRate === rate && styles.speedOptionTextActive]}>
                                    {rate}x {rate === 1.0 ? '(Normal)' : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    video: { flex: 1 },
    touchOverlay: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between', padding: 16 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 40 },
    iconBtn: { padding: 8 },
    videoTitle: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600', textAlign: 'center', marginHorizontal: 8 },
    centerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 50 },
    playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    skipBtn: { alignItems: 'center' },
    skipText: { color: '#FFF', fontSize: 12, marginTop: 2 },
    bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 20 },
    time: { color: '#FFF', fontSize: 12, minWidth: 50, textAlign: 'center' },
    progressContainer: { flex: 1, height: 40, justifyContent: 'center' },
    progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, position: 'relative' },
    progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 2 },
    seekThumb: { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', marginLeft: -8 },
    speedBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, marginLeft: 8 },
    speedText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    bufferingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    bufferingText: { color: '#FFF', marginTop: 10, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    speedMenu: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, width: 240 },
    speedMenuTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
    speedOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, marginBottom: 4 },
    speedOptionActive: { backgroundColor: '#2563EB' },
    speedOptionText: { color: '#94A3B8', fontSize: 16, textAlign: 'center' },
    speedOptionTextActive: { color: '#FFF', fontWeight: '600' },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20
    },
    errorText: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24
    },
    errorBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    errorBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    },
});

export default VideoPlayerScreen;
