# Course Tracker App

A React Native (Expo) application for tracking video course progress on Android.

## Features

- **Add Courses**: Select local folders containing video files to create courses.
- **Track Progress**: View list of videos and track completion status (mocked for now, persistence to be added).
- **Video Player**: Custom video player overlay with playback controls.
- **Dark Mode**: Support for system dark mode.

## Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Native Stack)
- **Video**: `expo-av`
- **File Access**: `expo-file-system` (Storage Access Framework)
- **Icons**: `lucide-react-native`

## How to Run

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npx expo start
    ```

3.  Run on Android:
    - Press `a` in the terminal to open in Android Emulator.
    - Or scan the QR code with the Expo Go app on your physical device.

## Permissions

The app uses the **Storage Access Framework** to read video files. When you tap "Add Course" (+ button), you will be prompted to select a folder. Granting access allows the app to list video files (`.mp4`, `.mkv`, etc.) in that directory.
