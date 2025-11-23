import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Maximize2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONTS, RADIUS } from '../constants/theme';

const VideoPlayerScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { videoUri, title } = route.params;
    const video = useRef(null);
    const [status, setStatus] = useState({});
    const [showControls, setShowControls] = useState(true);

    // Auto-hide controls
    useEffect(() => {
        let timeout;
        if (showControls) {
            timeout = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [showControls]);

    const toggleControls = () => setShowControls(!showControls);

    const formatTime = (millis) => {
        if (!millis) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <TouchableOpacity
                activeOpacity={1}
                style={styles.videoContainer}
                onPress={toggleControls}
            >
                <Video
                    ref={video}
                    style={styles.video}
                    source={{
                        uri: videoUri,
                    }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                    shouldPlay
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                />

                {/* Controls Overlay */}
                {showControls && (
                    <View style={styles.overlay}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                                <ArrowLeft color="#FFF" size={24} />
                            </TouchableOpacity>
                            <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {/* Center Controls */}
                        <View style={styles.centerControls}>
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={() => video.current.setPositionAsync(status.positionMillis - 10000)}
                            >
                                <SkipBack color="#FFF" size={32} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={() => status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()}
                            >
                                {status.isPlaying ? (
                                    <Pause color="#000" size={32} fill="#000" />
                                ) : (
                                    <Play color="#000" size={32} fill="#000" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={() => video.current.setPositionAsync(status.positionMillis + 10000)}
                            >
                                <SkipForward color="#FFF" size={32} />
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Bar */}
                        <View style={styles.bottomBar}>
                            <Text style={styles.timeText}>{formatTime(status.positionMillis)}</Text>

                            {/* Progress Bar (Simple) */}
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${(status.positionMillis / status.durationMillis) * 100}%` }
                                    ]}
                                />
                            </View>

                            <Text style={styles.timeText}>{formatTime(status.durationMillis)}</Text>

                            <TouchableOpacity style={styles.iconButton}>
                                <Maximize2 color="#FFF" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
        paddingVertical: SPACING.l,
        paddingHorizontal: SPACING.m,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    videoTitle: {
        color: '#FFF',
        fontSize: FONTS.sizes.h3,
        fontWeight: FONTS.weights.semibold,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: SPACING.m,
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xl,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        padding: SPACING.s,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    timeText: {
        color: '#FFF',
        fontSize: FONTS.sizes.caption,
        fontVariant: ['tabular-nums'],
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFF', // Or Theme Color
    },
    iconButton: {
        padding: SPACING.xs,
    },
});

export default VideoPlayerScreen;
