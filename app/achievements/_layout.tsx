import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AchievementsLayout() {
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
          title: 'Achievements',
        }}
      />
    </Stack>
  );
}
