import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function FriendsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Friends',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Friend Profile',
        }}
      />
      <Stack.Screen
        name="requests"
        options={{
          title: 'Friend Requests',
        }}
      />
    </Stack>
  );
}
