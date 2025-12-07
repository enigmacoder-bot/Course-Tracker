import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';

const VideoPlayerScreen = ({ navigation, route }) => {
    const { videoUri, title } = route.params;
    const video = useRef(null);
    const [status, setStatus] = useState({});
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        let timeout;
        if (showControls && status.isPlaying) {
            timeout = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [showControls, status.isPlaying]);

    const formatTime = (ms) => {
        if (!ms) return '0:00';
        const sec = Math.floor(ms / 1000);
        const min = Math.floor(sec / 60);
        return `${min}:${(sec % 60).toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <TouchableOpacity
                activeOpacity={1}
                style={styles.videoWrap}
                onPress={() => setShowControls(!showControls)}
            >
                <Video
                    ref={video}
                    style={styles.video}
                    source={{ uri: videoUri }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    onPlaybackStatusUpdate={setStatus}
                />

                {showControls && (
                    <View style={styles.overlay}>
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Feather name="arrow-left" color="#FFF" size={24} />
                            </TouchableOpacity>
                            <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <View style={styles.controls}>
                            <TouchableOpacity onPress={() => video.current?.setPositionAsync((status.positionMillis || 0) - 10000)}>
                                <Feather name="skip-back" color="#FFF" size={32} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.playBtn}
                                onPress={() => status.isPlaying ? video.current?.pauseAsync() : video.current?.playAsync()}
                            >
                                <Feather name={status.isPlaying ? "pause" : "play"} color="#000" size={32} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => video.current?.setPositionAsync((status.positionMillis || 0) + 10000)}>
                                <Feather name="skip-forward" color="#FFF" size={32} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bottomBar}>
                            <Text style={styles.time}>{formatTime(status.positionMillis)}</Text>
                            <View style={styles.progress}>
                                <View style={[styles.progressFill, { width: `${((status.positionMillis || 0) / (status.durationMillis || 1)) * 100}%` }]} />
                            </View>
                            <Text style={styles.time}>{formatTime(status.durationMillis)}</Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    videoWrap: { flex: 1 },
    video: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', padding: 20 },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 20 },
    videoTitle: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600', textAlign: 'center', marginHorizontal: 16 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 },
    playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 20 },
    time: { color: '#FFF', fontSize: 12 },
    progress: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
    progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
});

export default VideoPlayerScreen;
