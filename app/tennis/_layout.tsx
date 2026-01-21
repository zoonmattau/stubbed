import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TennisLayout() {
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
          title: 'Tennis',
        }}
      />
    </Stack>
  );
}
