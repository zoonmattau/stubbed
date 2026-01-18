import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { FriendWithProfile } from '@/types';

interface FriendCardProps {
  friend: FriendWithProfile;
  isPending?: boolean;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  stats?: {
    totalEvents: number;
    totalPoints: number;
  };
}

export function FriendCard({
  friend,
  isPending = false,
  onPress,
  onAccept,
  onDecline,
  stats,
}: FriendCardProps) {
  const profile = friend.profile;

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <Avatar
          source={profile?.avatar_url}
          name={profile?.display_name || profile?.username}
          size="lg"
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.display_name || profile?.username || 'Unknown'}
          </Text>
          <Text style={styles.username}>@{profile?.username}</Text>

          {stats && (
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Ionicons name="ticket-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{stats.totalEvents} events</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{stats.totalPoints} pts</Text>
              </View>
            </View>
          )}
        </View>

        {isPending ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={onDecline}
            >
              <Ionicons name="close" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error,
  },
});
