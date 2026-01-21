import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function SportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="[sport]"
        options={{
          title: 'Sport',
        }}
      />
    </Stack>
  );
}
