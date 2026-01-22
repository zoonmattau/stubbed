import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="manual" />
      <Stack.Screen name="search" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}
