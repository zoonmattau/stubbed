import { Stack, router } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight } from '@/constants/theme';

export default function FollowersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerLeft: () => (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }}
            hitSlop={12}
            style={{ marginLeft: Platform.OS === 'web' ? 16 : 0, paddingRight: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="[userId]" options={{ title: 'Followers' }} />
    </Stack>
  );
}
