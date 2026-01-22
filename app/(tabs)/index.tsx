import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Avatar, Footer } from '@/components/ui';
import { EventCard } from '@/components/events';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useStatsStore } from '@/stores/statsStore';
import { usePoints } from '@/hooks/usePoints';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

// Level definitions
const LEVELS = [
  { level: 1, name: 'Rookie', minPoints: 0, icon: 'ticket-outline', color: '#6B7280' },
  { level: 2, name: 'Fan', minPoints: 50, icon: 'star-outline', color: '#10B981' },
  { level: 3, name: 'Supporter', minPoints: 150, icon: 'star-half', color: '#3B82F6' },
  { level: 4, name: 'Superfan', minPoints: 300, icon: 'star', color: '#8B5CF6' },
  { level: 5, name: 'Legend', minPoints: 500, icon: 'medal-outline', color: '#F59E0B' },
  { level: 6, name: 'Hall of Famer', minPoints: 800, icon: 'trophy', color: '#EF4444' },
  { level: 7, name: 'Icon', minPoints: 1200, icon: 'diamond', color: '#EC4899' },
];

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents } = useEventsStore();
  const { fetchStats, fetchAchievements } = useStatsStore();

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

  // Calculate user points from attendance history
  const { totalPoints: userPoints } = usePoints(attendedEvents);

  // Calculate local stats from attendedEvents (handles both FK and text fields)
  const localStats = useMemo(() => {
    const uniqueSports = new Set<string>();
    const uniqueTeams = new Set<string>();
    const uniqueVenues = new Set<string>();

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      // Sport - use FK or text field
      const sportName = event.sport?.name || event.sport_name;
      if (sportName) uniqueSports.add(sportName.toLowerCase());

      // Teams - use FK or text field
      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) uniqueTeams.add(homeTeam.toLowerCase());
      if (awayTeam) uniqueTeams.add(awayTeam.toLowerCase());

      // Venue - use FK or text field
      const venue = event.venue?.name || event.venue_name;
      if (venue) uniqueVenues.add(venue.toLowerCase());
    });

    return {
      totalEvents: attendedEvents.length,
      totalSports: uniqueSports.size,
      totalTeams: uniqueTeams.size,
      totalVenues: uniqueVenues.size,
    };
  }, [attendedEvents]);

  const currentLevel = useMemo(() => {
    let level = LEVELS[0];
    for (const l of LEVELS) {
      if (userPoints >= l.minPoints) {
        level = l;
      }
    }
    return level;
  }, [userPoints]);

  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const progressToNext = nextLevel
    ? ((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

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

      {/* Hero Stats Card with Stadium Background */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/stats')}
      >
        <ImageBackground
          source={require('@/assets/images/stadium-hero.jpg')}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
        >
          {/* Dark overlay for readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          >
            {/* Main stat - Events */}
            <View style={styles.heroMain}>
              <Text style={styles.heroNumber}>{localStats.totalEvents}</Text>
              <Text style={styles.heroLabel}>Events Attended</Text>
            </View>

            {/* Divider */}
            <View style={styles.heroDivider} />

            {/* Secondary stats in column */}
            <View style={styles.heroSecondary}>
              {/* Sports */}
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatIcon}>
                  <Ionicons name="basketball" size={16} color={colors.info} />
                </View>
                <Text style={styles.heroStatValue}>{localStats.totalSports}</Text>
                <Text style={styles.heroStatLabel}>sports</Text>
              </View>

              {/* Teams */}
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatIcon}>
                  <Ionicons name="shield" size={16} color={colors.warning} />
                </View>
                <Text style={styles.heroStatValue}>{localStats.totalTeams}</Text>
                <Text style={styles.heroStatLabel}>teams</Text>
              </View>

              {/* Venues */}
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatIcon}>
                  <Ionicons name="location" size={16} color={colors.success} />
                </View>
                <Text style={styles.heroStatValue}>{localStats.totalVenues}</Text>
                <Text style={styles.heroStatLabel}>venues</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>

      {/* Level Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/achievements')}
        style={styles.levelCard}
      >
        <LinearGradient
          colors={[currentLevel.color, `${currentLevel.color}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCardGradient}
        >
          <View style={styles.levelCardHeader}>
            <View style={styles.levelIconContainer}>
              <Ionicons name={currentLevel.icon as any} size={28} color={colors.white} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level {currentLevel.level}</Text>
              <Text style={styles.levelName}>{currentLevel.name}</Text>
            </View>
            <View style={styles.levelPoints}>
              <Text style={styles.levelPointsValue}>{userPoints}</Text>
              <Text style={styles.levelPointsLabel}>points</Text>
            </View>
          </View>

          {nextLevel && (
            <View style={styles.levelProgress}>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
              </View>
              <Text style={styles.levelProgressText}>
                {nextLevel.minPoints - userPoints} pts to {nextLevel.name}
              </Text>
            </View>
          )}

          <View style={styles.levelTips}>
            <Text style={styles.levelTipsTitle}>Ways to earn points:</Text>
            <View style={styles.levelTipsGrid}>
              <View style={styles.levelTipItem}>
                <Ionicons name="ticket" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.levelTipText}>Attend event (+10)</Text>
              </View>
              <View style={styles.levelTipItem}>
                <Ionicons name="trophy" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.levelTipText}>Team wins (+15)</Text>
              </View>
              <View style={styles.levelTipItem}>
                <Ionicons name="flame" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.levelTipText}>3-win streak (+25)</Text>
              </View>
              <View style={styles.levelTipItem}>
                <Ionicons name="star" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.levelTipText}>New team (+5)</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

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
                mini
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

      {/* Explore Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore</Text>
        </View>
        <View style={styles.exploreGrid}>
          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.success }]}
            onPress={() => router.push('/(tabs)/stats')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="stats-chart" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>Your Stats</Text>
              <Text style={styles.exploreCardSubtitle}>View detailed analytics</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.info }]}
            onPress={() => router.push('/friends')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="people" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>Friends</Text>
              <Text style={styles.exploreCardSubtitle}>Connect with fans</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.gold }]}
            onPress={() => router.push('/achievements')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="trophy" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>Achievements</Text>
              <Text style={styles.exploreCardSubtitle}>Unlock rewards</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/stats/map')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="globe" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>World Map</Text>
              <Text style={styles.exploreCardSubtitle}>Places you've been</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>

      <Footer />
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
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroCardImage: {
    borderRadius: borderRadius.xl,
  },
  heroOverlay: {
    flexDirection: 'row',
    padding: spacing.lg,
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

  // Explore Grid
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  exploreCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  exploreCardContent: {
    padding: spacing.md,
    minHeight: 100,
  },
  exploreCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  exploreCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  exploreCardSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Level Card
  levelCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  levelCardGradient: {
    padding: spacing.lg,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  levelPoints: {
    alignItems: 'flex-end',
  },
  levelPointsValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  levelPointsLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  levelProgress: {
    marginTop: spacing.md,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  levelTips: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  levelTipsTitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  levelTipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  levelTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '48%',
    marginBottom: 2,
  },
  levelTipText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
});
