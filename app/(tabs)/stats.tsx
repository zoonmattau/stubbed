import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { StatCard, ProgressBar } from '@/components/stats';
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
        // Check if user's favorite team won (simplified - would need more logic)
        wins++;
      }
    });

    const total = wins + losses + draws;
    return { wins, losses, draws, total };
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
      {/* Summary Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Numbers</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Events"
            value={stats?.total_events || attendedEvents.length}
            icon="ticket"
            iconColor={colors.primary}
          />
          <StatCard
            label="Sports"
            value={stats?.total_sports || 0}
            icon="basketball"
            iconColor={colors.sportBasketball}
          />
          <StatCard
            label="Teams Watched"
            value={stats?.total_teams || 0}
            icon="people"
            iconColor={colors.info}
          />
          <StatCard
            label="Venues Visited"
            value={stats?.total_venues || 0}
            icon="location"
            iconColor={colors.success}
          />
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <Card>
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <View style={[styles.streakIcon, { backgroundColor: `${colors.warning}20` }]}>
                <Ionicons name="flame" size={24} color={colors.warning} />
              </View>
              <View>
                <Text style={styles.streakValue}>{stats?.current_streak || 0}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <View style={[styles.streakIcon, { backgroundColor: `${colors.gold}20` }]}>
                <Ionicons name="trophy" size={24} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.streakValue}>{stats?.longest_streak || 0}</Text>
                <Text style={styles.streakLabel}>Best Streak</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Win/Loss Record */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>When You Attend</Text>
        <Card>
          <View style={styles.recordContainer}>
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, { color: colors.success }]}>
                {winLossStats.wins}
              </Text>
              <Text style={styles.recordLabel}>Wins</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, { color: colors.textSecondary }]}>
                {winLossStats.draws}
              </Text>
              <Text style={styles.recordLabel}>Draws</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, { color: colors.error }]}>
                {winLossStats.losses}
              </Text>
              <Text style={styles.recordLabel}>Losses</Text>
            </View>
          </View>
          {winLossStats.total > 0 && (
            <View style={styles.winPercentage}>
              <Text style={styles.winPercentageLabel}>Win Rate</Text>
              <ProgressBar
                progress={(winLossStats.wins / winLossStats.total) * 100}
                color={colors.success}
                showPercentage
              />
            </View>
          )}
        </Card>
      </View>

      {/* Sports Breakdown */}
      {sportBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Events by Sport</Text>
          <Card>
            {sportBreakdown.slice(0, 5).map((sport, index) => (
              <View key={sport.sportId || index} style={styles.breakdownItem}>
                <View style={styles.breakdownInfo}>
                  <View
                    style={[
                      styles.sportDot,
                      { backgroundColor: sport.color || colors.primary },
                    ]}
                  />
                  <Text style={styles.breakdownName}>{sport.sportName}</Text>
                </View>
                <Text style={styles.breakdownCount}>{sport.count}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Top Venues */}
      {venueBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Venues</Text>
          <Card>
            {venueBreakdown.slice(0, 5).map((venue, index) => (
              <View key={venue.venueId || index} style={styles.breakdownItem}>
                <View style={styles.breakdownInfo}>
                  <Ionicons name="location" size={16} color={colors.textSecondary} />
                  <Text style={styles.breakdownName}>{venue.venueName}</Text>
                </View>
                <Text style={styles.breakdownCount}>{venue.count} visits</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Top Teams */}
      {teamBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Watched Teams</Text>
          <Card>
            {teamBreakdown.slice(0, 5).map((team, index) => (
              <View key={team.teamId || index} style={styles.breakdownItem}>
                <View style={styles.breakdownInfo}>
                  <Ionicons name="shield" size={16} color={colors.textSecondary} />
                  <Text style={styles.breakdownName}>{team.teamName}</Text>
                </View>
                <Text style={styles.breakdownCount}>{team.count} games</Text>
              </View>
            ))}
          </Card>
        </View>
      )}
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
  recordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  recordItem: {
    alignItems: 'center',
  },
  recordValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  recordLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  winPercentage: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  winPercentageLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sportDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownName: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  breakdownCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
