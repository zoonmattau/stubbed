import { Stack } from 'expo-router';
import { colors, fontWeight } from '@/constants/theme';

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="manual" />
      <Stack.Screen name="search" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen
        name="review/[id]"
        options={{
          headerShown: true,
          title: 'Write Review',
        }}
      />
    </Stack>
  );
}
