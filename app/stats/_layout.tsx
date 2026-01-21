import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function StatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="map"
        options={{
          title: 'World Map',
        }}
      />
      <Stack.Screen
        name="teams"
        options={{
          title: 'Teams',
        }}
      />
      <Stack.Screen
        name="venues"
        options={{
          title: 'Venues',
        }}
      />
    </Stack>
  );
}
