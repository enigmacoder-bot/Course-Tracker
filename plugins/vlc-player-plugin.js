const { withAppBuildGradle, withSettingsGradle, withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo config plugin for react-native-vlc-media-player
 * Compatible with Expo SDK 52 / React Native 0.76+
 * 
 * This plugin handles the native configuration without using the buggy
 * applyNativeModulesAppBuildGradle pattern matching.
 */

const withVLCPlayer = (config) => {
    // Add libc++_shared.so conflict fix to app/build.gradle
    config = withAppBuildGradle(config, (config) => {
        const buildGradle = config.modResults.contents;

        // Check if we already added the fix
        if (buildGradle.includes('libc++_shared.so')) {
            return config;
        }

        // Add the libc++_shared.so conflict fix in the android block
        // This prevents crashes from conflicting shared libraries
        const androidBlockRegex = /(android\s*\{)/;
        const libcFix = `$1
    // Fix libc++_shared.so conflict between React Native and LibVLC
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }`;

        if (androidBlockRegex.test(buildGradle)) {
            config.modResults.contents = buildGradle.replace(androidBlockRegex, libcFix);
        }

        return config;
    });

    return config;
};

module.exports = createRunOncePlugin(withVLCPlayer, 'vlc-player-plugin', '1.0.0');
