import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui';
import { ProgressBar, InteractiveBarChart, BarChartItem, DonutChart, DonutSegment } from '@/components/stats';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { user } = useAuthStore();
  const {
    stats,
    sportBreakdown,
    teamBreakdown,
    venueBreakdown,
    fetchStats,
    isLoading,
  } = useStatsStore();
  const { attendedEvents } = useEventsStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchStats(user.id);
    setRefreshing(false);
  };

  // Calculate win/loss/draw stats from attended events
  const winLossStats = React.useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      if (event.is_draw) {
        draws++;
      } else if (event.winner_team_id) {
        wins++;
      } else if (event.home_score && event.away_score) {
        // Has scores but no winner_team_id set
        const homeScore = parseInt(event.home_score, 10);
        const awayScore = parseInt(event.away_score, 10);
        if (!isNaN(homeScore) && !isNaN(awayScore)) {
          if (homeScore === awayScore) {
            draws++;
          } else {
            wins++; // Count as a win since we saw a result
          }
        }
      }
    });

    const total = wins + losses + draws;
    return { wins, losses, draws, total };
  }, [attendedEvents]);

  // Transform breakdowns into chart data
  const sportChartData: BarChartItem[] = useMemo(() => {
    return sportBreakdown.map((sport) => ({
      id: sport.sportId || sport.sportName,
      label: sport.sportName,
      value: sport.count,
      color: sport.color || colors.primary,
      icon: 'basketball' as const,
    }));
  }, [sportBreakdown]);

  // Donut chart data for sports
  const sportDonutData: DonutSegment[] = useMemo(() => {
    return sportBreakdown.map((sport) => ({
      id: sport.sportId || sport.sportName,
      label: sport.sportName,
      value: sport.count,
      color: sport.color || colors.primary,
    }));
  }, [sportBreakdown]);

  // Win/Loss chart data
  const winLossChartData: DonutSegment[] = useMemo(() => {
    const data: DonutSegment[] = [];
    if (winLossStats.wins > 0) {
      data.push({ id: 'wins', label: 'Wins', value: winLossStats.wins, color: colors.success });
    }
    if (winLossStats.draws > 0) {
      data.push({ id: 'draws', label: 'Draws', value: winLossStats.draws, color: colors.textSecondary });
    }
    if (winLossStats.losses > 0) {
      data.push({ id: 'losses', label: 'Losses', value: winLossStats.losses, color: colors.error });
    }
    return data;
  }, [winLossStats]);

  const teamChartData: BarChartItem[] = useMemo(() => {
    return teamBreakdown.map((team) => ({
      id: team.teamId || team.teamName,
      label: team.teamName,
      value: team.count,
      color: colors.info,
      icon: 'shield' as const,
      subLabel: `${team.count} games`,
    }));
  }, [teamBreakdown]);

  const venueChartData: BarChartItem[] = useMemo(() => {
    return venueBreakdown.map((venue) => ({
      id: venue.venueId || venue.venueName,
      label: venue.venueName,
      value: venue.count,
      color: colors.success,
      icon: 'location' as const,
      subLabel: `${venue.count} visits`,
    }));
  }, [venueBreakdown]);

  // Monthly events breakdown
  const monthlyChartData: BarChartItem[] = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    const monthOrder: string[] = [];

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event?.event_date) return;

      const date = new Date(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });

      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = 0;
        monthOrder.push(monthKey);
      }
      monthCounts[monthKey]++;
    });

    // Sort by date (most recent first)
    monthOrder.sort((a, b) => b.localeCompare(a));

    return monthOrder.map((key) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });

      return {
        id: key,
        label,
        value: monthCounts[key],
        color: colors.primary,
        icon: 'calendar' as const,
      };
    });
  }, [attendedEvents]);

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
      {/* Hero Stats Card */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark || '#1a365d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroMain}>
          <Text style={styles.heroNumber}>{stats?.total_events || attendedEvents.length}</Text>
          <Text style={styles.heroLabel}>Events Attended</Text>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroSecondary}>
          <View style={styles.heroStatRow}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="basketball" size={16} color={colors.sportBasketball} />
            </View>
            <Text style={styles.heroStatValue}>{stats?.total_sports || 0}</Text>
            <Text style={styles.heroStatLabel}>sports</Text>
          </View>

          <View style={styles.heroStatRow}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="people" size={16} color={colors.info} />
            </View>
            <Text style={styles.heroStatValue}>{stats?.total_teams || 0}</Text>
            <Text style={styles.heroStatLabel}>teams</Text>
          </View>

          <View style={styles.heroStatRow}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="location" size={16} color={colors.success} />
            </View>
            <Text style={styles.heroStatValue}>{stats?.total_venues || 0}</Text>
            <Text style={styles.heroStatLabel}>venues</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <Text style={styles.sectionSubtitle}>Consecutive weeks attending at least one event</Text>
        <Card>
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <View style={[styles.streakIcon, { backgroundColor: `${colors.warning}20` }]}>
                <Ionicons name="flame" size={24} color={colors.warning} />
              </View>
              <View>
                <Text style={styles.streakValue}>{stats?.current_streak || 0}</Text>
                <Text style={styles.streakLabel}>Weekly Streak</Text>
              </View>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <View style={[styles.streakIcon, { backgroundColor: `${colors.gold}20` }]}>
                <Ionicons name="trophy" size={24} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.streakValue}>{stats?.longest_streak || 0}</Text>
                <Text style={styles.streakLabel}>Best Weekly</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Monthly Events Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events by Month</Text>
        <Text style={styles.sectionSubtitle}>Your attendance history over time</Text>
        <Card>
          {monthlyChartData.length > 0 ? (
            <InteractiveBarChart
              data={monthlyChartData}
              maxItems={12}
              showSeeAll={monthlyChartData.length > 12}
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No events recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Win/Loss Record - Visual Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Results</Text>
        <Text style={styles.sectionSubtitle}>Win/loss/draw breakdown of games you've attended</Text>
        <Card>
          {winLossStats.total > 0 ? (
            <DonutChart
              data={winLossChartData}
              centerValue={winLossStats.total}
              centerLabel="games with results"
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>Add game scores to see win/loss stats</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Sports Breakdown - Visual Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events by Sport</Text>
        <Text style={styles.sectionSubtitle}>Breakdown of all sports you've attended</Text>
        <Card>
          {sportDonutData.length > 0 ? (
            <DonutChart
              data={sportDonutData}
              centerValue={stats?.total_events || attendedEvents.length}
              centerLabel="total events"
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No events recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Teams - Clickable */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/stats/teams')}
        >
          <View>
            <Text style={styles.sectionTitle}>Teams You've Seen</Text>
            <Text style={styles.sectionSubtitle}>Tap to see detailed breakdown with win records</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card>
          {teamChartData.length > 0 ? (
            <InteractiveBarChart
              data={teamChartData}
              maxItems={5}
              onItemPress={() => router.push('/stats/teams')}
              onSeeAllPress={() => router.push('/stats/teams')}
              showSeeAll={teamBreakdown.length > 5}
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No teams recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Venues - Clickable */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/stats/venues')}
        >
          <View>
            <Text style={styles.sectionTitle}>Venues You've Visited</Text>
            <Text style={styles.sectionSubtitle}>Tap to see all venues and details</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card>
          {venueChartData.length > 0 ? (
            <InteractiveBarChart
              data={venueChartData}
              maxItems={5}
              onItemPress={() => router.push('/stats/venues')}
              onSeeAllPress={() => router.push('/stats/venues')}
              showSeeAll={venueBreakdown.length > 5}
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No venues recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* World Map - Places You've Been */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/stats/map')}
        >
          <View>
            <Text style={styles.sectionTitle}>Places You've Been</Text>
            <Text style={styles.sectionSubtitle}>Explore your events on a world map</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card onPress={() => router.push('/stats/map')}>
          <View style={styles.mapPreview}>
            <Ionicons name="globe-outline" size={48} color={colors.primary} />
            <Text style={styles.mapPreviewText}>
              View your events by location
            </Text>
            <View style={styles.mapPreviewStats}>
              <View style={styles.mapPreviewStat}>
                <Ionicons name="flag" size={16} color={colors.info} />
                <Text style={styles.mapPreviewStatText}>
                  {new Set(attendedEvents.map(e => e.event?.venue?.city).filter(Boolean)).size} cities
                </Text>
              </View>
            </View>
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
  // Hero Card
  heroCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  streakLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyBreakdown: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyBreakdownText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  mapPreview: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  mapPreviewText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: fontWeight.medium,
  },
  mapPreviewStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  mapPreviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapPreviewStatText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
