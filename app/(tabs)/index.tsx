import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar } from '@/components/ui';
import { StatCard } from '@/components/stats';
import { ActivityItem } from '@/components/social';
import { EventCard } from '@/components/events';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useStatsStore } from '@/stores/statsStore';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents, isLoading: eventsLoading } = useEventsStore();
  const { stats, achievements, fetchStats, fetchAchievements } = useStatsStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    await Promise.all([
      fetchAttendedEvents(user.id),
      fetchStats(user.id),
      fetchAchievements(user.id),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const recentEvents = attendedEvents.slice(0, 3);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            G'day, {profile?.first_name || profile?.display_name || profile?.username || 'Fan'}!
          </Text>
          <Text style={styles.subGreeting}>Ready to track your next event?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Avatar
            source={profile?.avatar_url}
            name={profile?.display_name || profile?.username}
            size="lg"
          />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Events Attended"
          value={stats?.total_events || 0}
          icon="ticket"
          iconColor={colors.primary}
          onPress={() => router.push('/(tabs)/events')}
        />
        <StatCard
          label="Current Streak"
          value={stats?.current_streak || 0}
          icon="flame"
          iconColor={colors.warning}
        />
        <StatCard
          label="Achievements"
          value={`${unlockedCount}/${achievements.length}`}
          icon="trophy"
          iconColor={colors.gold}
          onPress={() => router.push('/achievements')}
        />
        <StatCard
          label="Total Points"
          value={stats?.total_points || 0}
          icon="star"
          iconColor={colors.secondary}
        />
      </View>

      {/* Recent Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {recentEvents.map((attended) => (
              <EventCard
                key={attended.id}
                event={attended.event!}
                attendance={attended}
                onPress={() => router.push(`/event/${attended.event_id}`)}
                compact
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyText}>
                Start tracking your sports events!
              </Text>
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={() => router.push('/(tabs)/add')}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.addEventText}>Add your first event</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/event/manual')}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.success}20` }]}>
              <Ionicons name="stats-chart" size={24} color={colors.success} />
            </View>
            <Text style={styles.actionText}>View Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/friends')}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.info}20` }]}>
              <Ionicons name="people" size={24} color={colors.info} />
            </View>
            <Text style={styles.actionText}>Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/achievements')}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.gold}20` }]}>
              <Ionicons name="trophy" size={24} color={colors.gold} />
            </View>
            <Text style={styles.actionText}>Achievements</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  eventsList: {
    gap: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 20,
  },
  addEventText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});
