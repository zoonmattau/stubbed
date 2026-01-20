import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: 'Privacy',
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: 'Help & Support',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
        }}
      />
    </Stack>
  );
}
