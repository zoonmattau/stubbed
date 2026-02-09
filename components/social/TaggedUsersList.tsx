import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { TaggedUser } from '@/types';

interface TaggedUsersListProps {
  userIds: string[] | null;
  textNames: string[] | null;
}

export function TaggedUsersList({ userIds, textNames }: TaggedUsersListProps) {
  const { fetchUsersByIds } = useFollows();
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      if (!userIds?.length) {
        setTaggedUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const users = await fetchUsersByIds(userIds);
        setTaggedUsers(users);
      } catch (err) {
        console.error('Error loading tagged users:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [userIds, fetchUsersByIds]);

  const hasTaggedUsers = taggedUsers.length > 0;
  const hasTextNames = textNames && textNames.length > 0;

  if (!hasTaggedUsers && !hasTextNames) {
    return null;
  }

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}` as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Went With</Text>
      <View style={styles.usersContainer}>
        {/* Tagged app users */}
        {taggedUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userChip}
            onPress={() => handleUserPress(user.id)}
          >
            <Avatar
              source={user.avatar_url}
              name={user.display_name || user.username}
              size="sm"
            />
            <Text style={styles.userName} numberOfLines={1}>
              {user.display_name || user.username}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Plain text names */}
        {textNames?.map((name, index) => (
          <View key={`text-${index}`} style={[styles.userChip, styles.textNameChip]}>
            <View style={styles.textNameIcon}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  usersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  textNameChip: {
    paddingLeft: spacing.sm,
  },
  textNameIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    maxWidth: 100,
  },
});
