import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Dimensions, Modal, Pressable, ActivityIndicator, BackHandler } from 'react-native';
import Video from 'react-native-video';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as ScreenOrientation from 'expo-screen-orientation';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const VideoPlayerScreen = ({ navigation, route }) => {
    const { videoUri, title, videoId } = route.params;
    const playerRef = useRef(null);

    // Resolved file path
    const [resolvedUri, setResolvedUri] = useState(null);
    const [loadError, setLoadError] = useState(null);

    // Playback state
    const [paused, setPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isBuffering, setIsBuffering] = useState(true);

    // Subtitles
    const [textTracks, setTextTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState({ type: 'title', value: 'Off' }); // Default off
    const [showSettings, setShowSettings] = useState(false);

    const controlsTimeout = useRef(null);

    // Lock to landscape
    useEffect(() => {
        const lock = async () => {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        };
        lock();
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    // Resolve URI
    useEffect(() => {
        const resolveVideoUri = async () => {
            try {
                if (videoId) {
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status !== 'granted') {
                        setLoadError('Permission required');
                        return;
                    }
                    const assetInfo = await MediaLibrary.getAssetInfoAsync(videoId);
                    if (assetInfo?.localUri) {
                        setResolvedUri(assetInfo.localUri);
                        return;
                    }
                }
                setResolvedUri(videoUri);
            } catch (error) {
                console.error('Error resolving:', error);
                setLoadError('Failed to load video');
            }
        };
        resolveVideoUri();
    }, [videoUri, videoId]);

    // Auto-hide controls
    useEffect(() => {
        if (showControls && !paused && !showSettings) {
            resetControlsTimeout();
        }
        return () => clearTimeout(controlsTimeout.current);
    }, [showControls, paused, showSettings]);

    const resetControlsTimeout = () => {
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => setShowControls(false), 4000);
    };

    const toggleControls = () => {
        if (showControls) {
            setShowControls(false);
        } else {
            setShowControls(true);
            resetControlsTimeout();
        }
    };

    // Handlers
    const handleLoad = (meta) => {
        console.log('Loaded:', meta);
        setDuration(meta.duration);
        setIsBuffering(false);
        if (meta.textTracks) {
            setTextTracks(meta.textTracks);
        }
    };

    const handleProgress = (progress) => {
        setCurrentTime(progress.currentTime);
    };

    const handleEnd = () => {
        navigation.goBack();
    };

    const handleSeek = (value) => {
        playerRef.current?.seek(value);
        setCurrentTime(value);
        resetControlsTimeout();
    };

    const handleSkip = (seconds) => {
        const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        playerRef.current?.seek(newTime);
        resetControlsTimeout();
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return hrs > 0
            ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            : `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {resolvedUri && !loadError && (
                <Video
                    ref={playerRef}
                    source={{ uri: resolvedUri }}
                    style={styles.video}
                    resizeMode="contain"
                    paused={paused}
                    rate={playbackRate}
                    onLoad={handleLoad}
                    onProgress={handleProgress}
                    onEnd={handleEnd}
                    onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
                    onError={(e) => {
                        console.error('Player Error:', e);
                        setLoadError('Playback error');
                    }}
                    selectedTextTrack={selectedTrack}
                    progressUpdateInterval={500}
                />
            )}

            {isBuffering && !loadError && (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#FFF" />
                </View>
            )}

            {loadError && (
                <View style={styles.centerLoader}>
                    <Feather name="alert-circle" size={40} color="red" />
                    <Text style={{ color: 'white', marginTop: 10 }}>{loadError}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBtn}>
                        <Text style={{ color: 'white' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Pressable style={styles.touchOverlay} onPress={toggleControls} />

            {showControls && (
                <View style={styles.overlay}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Feather name="arrow-left" color="#FFF" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconBtn}>
                            <Feather name="settings" color="#FFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.centerControls}>
                        <TouchableOpacity onPress={() => handleSkip(-10)}>
                            <Feather name="rotate-ccw" color="#FFF" size={32} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPaused(!paused)} style={styles.playBtn}>
                            <Feather name={paused ? "play" : "pause"} color="black" size={32} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleSkip(10)}>
                            <Feather name="rotate-cw" color="#FFF" size={32} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomBar}>
                        <Text style={styles.time}>{formatTime(currentTime)}</Text>
                        <Slider
                            style={{ flex: 1, height: 40 }}
                            minimumValue={0}
                            maximumValue={duration}
                            value={currentTime}
                            onSlidingComplete={handleSeek}
                            minimumTrackTintColor="#2563EB"
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#FFF"
                        />
                        <Text style={styles.time}>{formatTime(duration)}</Text>
                    </View>
                </View>
            )}

            <Modal visible={showSettings} transparent animationType="fade">
                <Pressable style={styles.modalBg} onPress={() => setShowSettings(false)}>
                    <View style={styles.settingsBox}>
                        <Text style={styles.sectionTitle}>Playback Speed</Text>
                        <View style={styles.optionsRow}>
                            {PLAYBACK_RATES.map(rate => (
                                <TouchableOpacity
                                    key={rate}
                                    onPress={() => setPlaybackRate(rate)}
                                    style={[styles.optionChip, playbackRate === rate && styles.optionActive]}
                                >
                                    <Text style={[styles.optionText, playbackRate === rate && styles.optionTextActive]}>{rate}x</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Subtitles</Text>
                        <View style={styles.optionsList}>
                            <TouchableOpacity
                                onPress={() => setSelectedTrack({ type: 'disabled' })}
                                style={[styles.listItem, selectedTrack.type === 'disabled' && styles.listItemActive]}
                            >
                                <Text style={styles.listText}>Off</Text>
                                {selectedTrack.type === 'disabled' && <Feather name="check" color="#FFF" size={16} />}
                            </TouchableOpacity>

                            {textTracks.map((track, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setSelectedTrack({ type: 'index', value: i })}
                                    style={[styles.listItem, (selectedTrack.type === 'index' && selectedTrack.value === i) && styles.listItemActive]}
                                >
                                    <Text style={styles.listText}>{track.title || track.language || `Track ${i + 1}`}</Text>
                                    {(selectedTrack.type === 'index' && selectedTrack.value === i) && <Feather name="check" color="#FFF" size={16} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    video: { width: '100%', height: '100%' },
    centerLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    touchOverlay: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', padding: 20 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1, marginHorizontal: 15 },
    iconBtn: { padding: 8 },
    centerControls: { flexDirection: 'row', gap: 60, justifyContent: 'center', alignItems: 'center' },
    playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    time: { color: 'white', fontSize: 12, fontFamily: 'monospace' },
    errorBtn: { marginTop: 20, backgroundColor: '#2563EB', padding: 10, borderRadius: 5 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    settingsBox: { width: 300, backgroundColor: '#1E293B', borderRadius: 12, padding: 20 },
    sectionTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', opacity: 0.7 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    optionActive: { backgroundColor: '#2563EB' },
    optionText: { color: '#94A3B8', fontSize: 12 },
    optionTextActive: { color: 'white', fontWeight: 'bold' },
    optionsList: { gap: 5 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
    listItemActive: { backgroundColor: '#2563EB' },
    listText: { color: 'white' }
});

export default VideoPlayerScreen;
