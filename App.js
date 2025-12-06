// Minimal test to isolate crash - tests basic React Native without navigation
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>CourseTracker</Text>
      <Text style={styles.subtext}>If you see this, the app launches!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtext: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
  },
});
