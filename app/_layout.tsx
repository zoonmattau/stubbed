import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  const { isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
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
    <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            title: 'Event Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="event/search"
          options={{
            title: 'Search Events',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="event/manual"
          options={{
            title: 'Add Event',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="friends/index"
          options={{
            title: 'Friends',
          }}
        />
        <Stack.Screen
          name="friends/[id]"
          options={{
            title: 'Profile',
          }}
        />
        <Stack.Screen
          name="friends/requests"
          options={{
            title: 'Friend Requests',
          }}
        />
        <Stack.Screen
          name="achievements/index"
          options={{
            title: 'Achievements',
          }}
        />
      </Stack>
  );

  // On web, wrap in a phone-sized container
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.phoneContainer}>
          {content}
          <StatusBar style="light" />
        </View>
      </View>
    );
  }

  return (
    <>
      {content}
      <StatusBar style="light" />
    </>
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
    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
  },
});
