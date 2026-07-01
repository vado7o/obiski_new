import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { WebView } from 'react-native-webview'
import { useRef, useState } from 'react'

const APP_URL = 'https://obiski.replit.app'

export default function App() {
  const webViewRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function handleReload() {
    setError(false)
    setLoading(true)
    webViewRef.current?.reload()
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#f0eeff" />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorEmoji}>🌐</Text>
          <Text style={styles.errorTitle}>Нет соединения</Text>
          <Text style={styles.errorText}>Проверьте подключение к интернету и попробуйте снова.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleReload}>
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={[styles.webview, error && styles.hidden]}
        onLoadStart={() => { setLoading(true); setError(false) }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true) }}
        onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500) { setLoading(false); setError(true) } }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        startInLoadingState={false}
        userAgent="ObishkiApp/1.0 (Android; Mobile)"
      />

      {loading && !error && (
        <View style={styles.loader}>
          <Text style={styles.loaderLogo}>🐾</Text>
          <Text style={styles.loaderTitle}>Obiski</Text>
          <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0eeff',
  },
  webview: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderLogo: {
    fontSize: 64,
  },
  loaderTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6C63FF',
    marginTop: 12,
    letterSpacing: 1,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
