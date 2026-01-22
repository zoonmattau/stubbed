import { useEffect } from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ui';
import { logConfigStatus } from '@/lib/config';

export default function RootLayout() {
  const { isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    // Validate configuration at startup
    logConfigStatus();
    // Initialize auth
    initialize();
  }, []);

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  const content = (
    <>
      <Head>
        <title>Stubbed - Track Your Sports Memories</title>
        <meta name="description" content="Track every sports event you attend. Log your games, earn achievements, connect with fellow fans, and build your legacy as the ultimate sports supporter." />
        <meta name="keywords" content="sports, events, tracking, games, achievements, fans, tickets, matches" />
        <meta property="og:title" content="Stubbed - Track Your Sports Memories" />
        <meta property="og:description" content="Track every sports event you attend. Log your games, earn achievements, and connect with fellow fans." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Stubbed" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stubbed - Track Your Sports Memories" />
        <meta name="twitter:description" content="Track every sports event you attend. Log your games, earn achievements, and connect with fellow fans." />
        <meta name="theme-color" content="#006747" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event" options={{ headerShown: false }} />
        <Stack.Screen name="friends" options={{ headerShown: false }} />
        <Stack.Screen name="achievements" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: true }} />
        <Stack.Screen name="explore" options={{ headerShown: true }} />
        <Stack.Screen name="review" options={{ headerShown: true }} />
        <Stack.Screen name="followers" options={{ headerShown: true }} />
        <Stack.Screen name="sports" options={{ headerShown: false }} />
        <Stack.Screen name="tennis" options={{ headerShown: false }} />
      </Stack>
    </>
  );

  // On web, wrap in a phone-sized container
  if (Platform.OS === 'web') {
    return (
      <ErrorBoundary>
        <View style={styles.webContainer}>
          <View style={styles.phoneContainer}>
            {content}
            <StatusBar style="light" />
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {content}
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneContainer: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    maxHeight: 932,
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 20 : 0,
  },
});
