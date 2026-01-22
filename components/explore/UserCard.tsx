import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Card } from '@/components/ui';
import { FollowButton } from './FollowButton';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { UserSuggestion } from '@/types';

interface UserCardProps {
  user: UserSuggestion;
  showFollowButton?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  compact?: boolean;
}

export function UserCard({ user, showFollowButton = true, onFollowChange, compact = false }: UserCardProps) {
  const handlePress = () => {
    router.push(`/profile/${user.user_id}`);
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress} activeOpacity={0.7}>
        <Avatar
          uri={user.avatar_url || undefined}
          name={user.display_name || user.username}
          size={48}
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {user.display_name || user.username}
          </Text>
          <Text style={styles.compactUsername}>@{user.username}</Text>
        </View>
        {showFollowButton && (
          <FollowButton
            userId={user.user_id}
            size="sm"
            onFollowChange={onFollowChange}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Card style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <Avatar
          uri={user.avatar_url || undefined}
          name={user.display_name || user.username}
          size={56}
        />
        {showFollowButton && (
          <FollowButton
            userId={user.user_id}
            size="md"
            onFollowChange={onFollowChange}
          />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.display_name || user.username}
        </Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.followers_count}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.reviews_count}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  info: {
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.4,
    marginTop: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  compactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  compactName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  compactUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
