import { Stack } from 'expo-router';
import { colors, fontWeight } from '@/constants/theme';

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="search" options={{ title: 'Explore Search' }} />
      <Stack.Screen name="discover" options={{ title: 'Discover Users' }} />
    </Stack>
  );
}
