import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('App Error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>⚠️ App Error</Text>
                        <Text style={styles.subtitle}>Something went wrong</Text>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.label}>Error Message:</Text>
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeText}>
                                {this.state.error?.toString() || 'Unknown error'}
                            </Text>
                        </View>

                        {this.state.errorInfo && (
                            <>
                                <Text style={styles.label}>Component Stack:</Text>
                                <View style={styles.codeBlock}>
                                    <Text style={styles.codeText}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.button} onPress={this.resetError}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff6b6b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginTop: 16,
        marginBottom: 8,
    },
    codeBlock: {
        backgroundColor: '#0d0d1a',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#ff9f43',
        lineHeight: 18,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ErrorBoundary;
