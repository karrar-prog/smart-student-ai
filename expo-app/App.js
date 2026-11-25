import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import NativeFallbackApp from './src/NativeFallbackApp';

const CLOUD_APP_URL = 'https://smart-student-ai-iq.web.app/?mobile=1';

export default function App() {
  if (Platform.OS === 'web') {
    return <NativeFallbackApp />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <WebView
        source={{ uri: CLOUD_APP_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        bounces={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
