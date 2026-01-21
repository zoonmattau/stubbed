import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { ProgressBar } from '@/components/stats';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getRarityColor } from '@/constants/achievements';
import type { AchievementWithStatus } from '@/types';

interface AchievementCardProps {
  achievement: AchievementWithStatus;
  progress?: number; // 0-100 for progress towards unlocking
  onPress?: () => void;
}

export function AchievementCard({
  achievement,
  progress,
  onPress,
}: AchievementCardProps) {
  const rarityColor = getRarityColor(achievement.rarity);
  const isUnlocked = achievement.unlocked;

  return (
    <Card
      onPress={onPress}
      style={[styles.container, !isUnlocked ? styles.locked : undefined]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isUnlocked ? `${rarityColor}30` : colors.surfaceLight },
          ]}
        >
          <Ionicons
            name={(achievement.icon as keyof typeof Ionicons.glyphMap) || 'trophy'}
            size={28}
            color={isUnlocked ? rarityColor : colors.textMuted}
          />
          {!isUnlocked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <Text
              style={[styles.name, !isUnlocked && styles.textLocked]}
              numberOfLines={1}
            >
              {achievement.name}
            </Text>
            <Badge
              label={achievement.rarity}
              size="sm"
              color={isUnlocked ? rarityColor : colors.surfaceLight}
            />
          </View>

          <Text
            style={[styles.description, !isUnlocked && styles.textLocked]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>

          {!isUnlocked && progress !== undefined && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress}
                color={rarityColor}
                height={4}
                showPercentage
              />
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.points}>
              <Ionicons
                name="star"
                size={14}
                color={isUnlocked ? colors.gold : colors.textMuted}
              />
              <Text
                style={[styles.pointsText, !isUnlocked && styles.textLocked]}
              >
                {achievement.points} pts
              </Text>
            </View>
            {isUnlocked && achievement.unlocked_at && (
              <Text style={styles.unlockedDate}>
                Unlocked{' '}
                {new Date(achievement.unlocked_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  locked: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 4,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  textLocked: {
    color: colors.textMuted,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  unlockedDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
