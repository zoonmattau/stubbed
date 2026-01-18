import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { getRelativeTime } from '@/utils/dates';
import type { ActivityFeed, Profile } from '@/types';

interface ActivityItemProps {
  activity: ActivityFeed & { profile?: Profile };
  onPress?: () => void;
}

const ACTIVITY_CONFIG = {
  attended_event: {
    icon: 'ticket' as const,
    color: colors.primary,
    getText: (metadata: Record<string, unknown> | null) =>
      `attended ${metadata?.event_name || 'an event'}`,
  },
  achievement_unlocked: {
    icon: 'trophy' as const,
    color: colors.gold,
    getText: (metadata: Record<string, unknown> | null) =>
      `unlocked "${metadata?.achievement_name || 'an achievement'}"`,
  },
  milestone: {
    icon: 'flag' as const,
    color: colors.success,
    getText: (metadata: Record<string, unknown> | null) =>
      `reached ${metadata?.milestone || 'a milestone'}`,
  },
};

export function ActivityItem({ activity, onPress }: ActivityItemProps) {
  const config = ACTIVITY_CONFIG[activity.activity_type as keyof typeof ACTIVITY_CONFIG] || {
    icon: 'ellipse' as const,
    color: colors.textSecondary,
    getText: () => 'did something',
  };

  const profile = activity.profile;

  return (
    <View style={styles.container}>
      <Avatar
        source={profile?.avatar_url}
        name={profile?.display_name || profile?.username}
        size="md"
      />

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.name}>
            {profile?.display_name || profile?.username || 'Someone'}
          </Text>
          <Text style={styles.action}>
            {' '}
            {config.getText(activity.metadata as Record<string, unknown> | null)}
          </Text>
        </View>
        <Text style={styles.time}>{getRelativeTime(activity.created_at)}</Text>
      </View>

      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  action: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
