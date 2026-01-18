import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { StatCard } from '@/components/stats';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock data - in real app this would come from API
  const profile = {
    id,
    username: 'sportsfan123',
    display_name: 'John Smith',
    avatar_url: null,
    bio: 'Die-hard AFL fan. Melbourne Victory supporter.',
    favorite_sport: 'AFL',
    favorite_team: 'Melbourne',
  };

  const stats = {
    total_events: 47,
    total_sports: 4,
    current_streak: 3,
    total_points: 850,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar
            source={profile.avatar_url}
            name={profile.display_name}
            size="xl"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>
        </View>

        <View style={styles.badges}>
          {profile.favorite_sport && (
            <Badge label={profile.favorite_sport} variant="info" />
          )}
          {profile.favorite_team && (
            <Badge label={profile.favorite_team} variant="success" />
          )}
        </View>

        <View style={styles.profileActions}>
          <Button
            title="Remove Friend"
            variant="outline"
            size="sm"
            onPress={() => {}}
          />
          <Button
            title="Compare Stats"
            variant="primary"
            size="sm"
            onPress={() => {}}
          />
        </View>
      </Card>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Events"
            value={stats.total_events}
            icon="ticket"
            iconColor={colors.primary}
          />
          <StatCard
            label="Sports"
            value={stats.total_sports}
            icon="basketball"
            iconColor={colors.sportBasketball}
          />
          <StatCard
            label="Streak"
            value={stats.current_streak}
            icon="flame"
            iconColor={colors.warning}
          />
          <StatCard
            label="Points"
            value={stats.total_points}
            icon="star"
            iconColor={colors.gold}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card>
          <View style={styles.emptyActivity}>
            <Ionicons name="time-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        </Card>
      </View>

      {/* Common Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events You Both Attended</Text>
        <Card>
          <View style={styles.emptyActivity}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No common events yet</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
