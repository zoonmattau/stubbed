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
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Avatar } from '@/components/ui';
import { EventCard } from '@/components/events';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useStatsStore } from '@/stores/statsStore';
import { useAchievements } from '@/hooks/useAchievements';
import { ProgressBar } from '@/components/stats';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { RARITY_COLORS } from '@/constants/achievements';

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents } = useEventsStore();
  const { stats, fetchStats, fetchAchievements } = useStatsStore();
  const { achievements, closestAchievement } = useAchievements();

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
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            G'day, {profile?.first_name || profile?.display_name || profile?.username || 'Fan'}!
          </Text>
          <Text style={styles.subGreeting}>Ready for your next event?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Avatar
            source={profile?.avatar_url}
            name={profile?.display_name || profile?.username}
            size="lg"
          />
        </TouchableOpacity>
      </View>

      {/* Hero Stats Card - Compact horizontal layout */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/stats')}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#1a365d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Main stat - Events */}
          <View style={styles.heroMain}>
            <Text style={styles.heroNumber}>{stats?.total_events || 0}</Text>
            <Text style={styles.heroLabel}>Events Attended</Text>
          </View>

          {/* Divider */}
          <View style={styles.heroDivider} />

          {/* Secondary stats in column */}
          <View style={styles.heroSecondary}>
            {/* Streak */}
            <View style={styles.heroStatRow}>
              <View style={styles.heroStatIcon}>
                <Ionicons name="flame" size={16} color={colors.warning} />
              </View>
              <Text style={styles.heroStatValue}>{stats?.current_streak || 0}</Text>
              <Text style={styles.heroStatLabel}>week streak</Text>
            </View>

            {/* Sports */}
            <View style={styles.heroStatRow}>
              <View style={styles.heroStatIcon}>
                <Ionicons name="basketball" size={16} color={colors.info} />
              </View>
              <Text style={styles.heroStatValue}>{stats?.total_sports || 0}</Text>
              <Text style={styles.heroStatLabel}>sports</Text>
            </View>

            {/* Venues */}
            <View style={styles.heroStatRow}>
              <View style={styles.heroStatIcon}>
                <Ionicons name="location" size={16} color={colors.success} />
              </View>
              <Text style={styles.heroStatValue}>{stats?.total_venues || 0}</Text>
              <Text style={styles.heroStatLabel}>venues</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Next Achievement Card */}
      {closestAchievement ? (
        <TouchableOpacity
          style={styles.nextAchievementCard}
          onPress={() => router.push('/achievements')}
          activeOpacity={0.7}
        >
          <View style={styles.nextAchievementHeader}>
            <View style={[
              styles.nextAchievementIcon,
              { backgroundColor: `${RARITY_COLORS[closestAchievement.achievement.rarity]}20` }
            ]}>
              <Ionicons
                name={closestAchievement.achievement.icon as any}
                size={20}
                color={RARITY_COLORS[closestAchievement.achievement.rarity]}
              />
            </View>
            <View style={styles.nextAchievementInfo}>
              <Text style={styles.nextAchievementLabel}>Almost there!</Text>
              <Text style={styles.nextAchievementName}>{closestAchievement.achievement.name}</Text>
            </View>
            <View style={[
              styles.nextAchievementBadge,
              { backgroundColor: `${RARITY_COLORS[closestAchievement.achievement.rarity]}20` }
            ]}>
              <Text style={[
                styles.nextAchievementRemaining,
                { color: RARITY_COLORS[closestAchievement.achievement.rarity] }
              ]}>
                {closestAchievement.remaining} to go
              </Text>
            </View>
          </View>
          <View style={styles.nextAchievementProgress}>
            <ProgressBar
              progress={closestAchievement.percent}
              color={RARITY_COLORS[closestAchievement.achievement.rarity]}
              height={6}
            />
            <Text style={styles.nextAchievementDesc}>{closestAchievement.description}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.achievementsRow}
          onPress={() => router.push('/achievements')}
          activeOpacity={0.7}
        >
          <View style={styles.achievementsIcon}>
            <Ionicons name="trophy" size={24} color={colors.gold} />
          </View>
          <View style={styles.achievementsInfo}>
            <Text style={styles.achievementsTitle}>Achievements</Text>
            <Text style={styles.achievementsSubtitle}>
              {unlockedCount} of {achievements.length} unlocked
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Quick Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/add')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.success, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add-circle" size={24} color={colors.white} />
          <Text style={styles.addButtonText}>Add New Event</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Recent Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {recentEvents.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
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
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyText}>
                Tap the button above to add your first event
              </Text>
            </View>
          </Card>
        )}
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore</Text>
        </View>
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <Ionicons name="stats-chart" size={20} color={colors.success} />
            <Text style={styles.quickLinkText}>Your Stats</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/friends')}
          >
            <Ionicons name="people" size={20} color={colors.info} />
            <Text style={styles.quickLinkText}>Friends</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickLink, styles.quickLinkLast]}
            onPress={() => router.push('/achievements')}
          >
            <Ionicons name="trophy" size={20} color={colors.gold} />
            <Text style={styles.quickLinkText}>All Achievements</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Hero Card
  heroCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroMain: {
    flex: 1,
    justifyContent: 'center',
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.white,
    lineHeight: 52,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.lg,
  },
  heroSecondary: {
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    minWidth: 20,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },

  // Achievements Row
  achievementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  achievementsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.gold}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsInfo: {
    flex: 1,
  },
  achievementsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  achievementsSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  achievementsProgress: {
    backgroundColor: `${colors.gold}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  achievementsPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gold,
  },

  // Next Achievement Card
  nextAchievementCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  nextAchievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nextAchievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAchievementInfo: {
    flex: 1,
  },
  nextAchievementLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  nextAchievementName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  nextAchievementBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  nextAchievementRemaining: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  nextAchievementProgress: {
    marginTop: spacing.md,
  },
  nextAchievementDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Add Button
  addButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  addButtonText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },

  // Sections
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

  // Empty State
  emptyCard: {
    padding: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Quick Links
  quickLinks: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  quickLinkLast: {
    borderBottomWidth: 0,
  },
  quickLinkText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
