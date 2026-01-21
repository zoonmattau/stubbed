import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import {
  fetchNextEvents,
  fetchPastEvents,
  fetchLeagueStandings,
  SportsDBSearchResult,
  StandingResult,
  SPORTSDB_LEAGUES,
  SportsDBLeagueKey,
} from '@/lib/thesportsdb';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useEventsStore } from '@/stores/eventsStore';
import { useAuthStore } from '@/stores/authStore';
import { useIsMounted } from '@/hooks/useSafeAsync';

interface SportConfig {
  title: string;
  icon: string;
  color: string;
  leagues: SportsDBLeagueKey[];
  sportName: string;
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  cricket: {
    title: 'Cricket',
    icon: 'baseball',
    color: '#22c55e',
    leagues: ['bbl', 'ipl', 'the_hundred', 'psl', 't20_blast'],
    sportName: 'Cricket',
  },
  afl: {
    title: 'AFL',
    icon: 'football',
    color: '#3b82f6',
    leagues: ['afl_sdb'],
    sportName: 'AFL',
  },
  nrl: {
    title: 'NRL',
    icon: 'football-outline',
    color: '#8b5cf6',
    leagues: ['nrl_sdb'],
    sportName: 'NRL',
  },
  aleague: {
    title: 'A-League',
    icon: 'football',
    color: '#a855f7',
    leagues: ['aleague_sdb'],
    sportName: 'A-League',
  },
  netball: {
    title: 'Netball',
    icon: 'people',
    color: '#ec4899',
    leagues: ['super_netball'],
    sportName: 'Netball',
  },
  motorsport: {
    title: 'Motorsport',
    icon: 'car-sport',
    color: '#ef4444',
    leagues: ['formula_1', 'motogp', 'v8_supercars', 'nascar', 'indycar', 'wrc'],
    sportName: 'Motorsport',
  },
  combat: {
    title: 'UFC & Boxing',
    icon: 'fitness',
    color: '#f97316',
    leagues: ['ufc', 'boxing'],
    sportName: 'MMA / UFC',
  },
  golf: {
    title: 'Golf',
    icon: 'golf',
    color: '#10b981',
    leagues: ['pga_tour', 'lpga_tour', 'european_tour'],
    sportName: 'Golf',
  },
  rugby: {
    title: 'Rugby Union',
    icon: 'american-football',
    color: '#f59e0b',
    leagues: ['super_rugby_sdb', 'six_nations', 'rugby_championship'],
    sportName: 'Super Rugby',
  },
  basketball: {
    title: 'Basketball',
    icon: 'basketball',
    color: '#f97316',
    leagues: ['wnba_sdb', 'euroleague'],
    sportName: 'Basketball',
  },
};

type TabType = 'upcoming' | 'results' | 'ladder';

export default function SportScreen() {
  const { sport } = useLocalSearchParams<{ sport: string }>();
  const config = SPORT_CONFIGS[sport || ''] || SPORT_CONFIGS.cricket;

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [selectedLeague, setSelectedLeague] = useState<SportsDBLeagueKey>(config.leagues[0]);
  const [upcomingEvents, setUpcomingEvents] = useState<SportsDBSearchResult[]>([]);
  const [pastEvents, setPastEvents] = useState<SportsDBSearchResult[]>([]);
  const [standings, setStandings] = useState<StandingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingEventIds, setAddingEventIds] = useState<Set<string>>(new Set());

  const { addAttendedEvent, sports, fetchSports } = useEventsStore();
  const { user } = useAuthStore();
  const isMounted = useIsMounted();

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      if (activeTab === 'upcoming') {
        const result = await fetchNextEvents(selectedLeague, 20);
        if (!isMounted()) return;
        if (result.success) {
          setUpcomingEvents(result.data);
        } else {
          setError(result.error || 'Failed to load upcoming events');
          setUpcomingEvents([]);
        }
      } else if (activeTab === 'results') {
        const result = await fetchPastEvents(selectedLeague, 20);
        if (!isMounted()) return;
        if (result.success) {
          setPastEvents(result.data);
        } else {
          setError(result.error || 'Failed to load results');
          setPastEvents([]);
        }
      } else if (activeTab === 'ladder') {
        const result = await fetchLeagueStandings(selectedLeague);
        if (!isMounted()) return;
        if (result.success) {
          setStandings(result.data);
        } else {
          setError(result.error || 'Failed to load standings');
          setStandings([]);
        }
      }
    } catch (err) {
      if (!isMounted()) return;
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      if (isMounted()) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeTab, selectedLeague, isMounted]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [activeTab, selectedLeague, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddToEvents = async (event: SportsDBSearchResult) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add events to your tracker.');
      return;
    }

    const sportRecord = sports.find(s =>
      s.name.toLowerCase() === config.sportName.toLowerCase() ||
      s.name.toLowerCase().includes(event.sport.toLowerCase())
    );

    if (!sportRecord) {
      Alert.alert('Error', 'Sport not found. Please try again later.');
      return;
    }

    setAddingEventIds(prev => new Set(prev).add(event.id));

    try {
      const eventDate = new Date(event.date).toISOString().split('T')[0];

      const result = await addAttendedEvent(
        user.id,
        {
          sport_id: sportRecord.id,
          event_date: eventDate,
          home_team_name: event.homeTeam.name,
          away_team_name: event.awayTeam.name,
          venue_name: event.venue?.name || event.league,
          home_score: event.homeScore || undefined,
          away_score: event.awayScore || undefined,
          competition: event.league,
          round: event.round || undefined,
        },
        {
          notes: event.name,
        }
      );

      if (result.success) {
        Alert.alert('Added!', 'Event added to your tracker.');
      } else {
        Alert.alert('Error', result.error || 'Failed to add event.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add event. Please try again.');
    } finally {
      setAddingEventIds(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
    }
  };

  const renderLeagueTabs = () => {
    // Don't show tabs if there's only one league
    if (config.leagues.length <= 1) return null;

    return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.leagueTabsContainer}
      contentContainerStyle={styles.leagueTabs}
    >
      {config.leagues.map((leagueKey) => {
        const league = SPORTSDB_LEAGUES[leagueKey];
        return (
          <TouchableOpacity
            key={leagueKey}
            style={[styles.leagueTab, selectedLeague === leagueKey && styles.leagueTabActive]}
            onPress={() => setSelectedLeague(leagueKey)}
          >
            <Text style={[
              styles.leagueTabText,
              selectedLeague === leagueKey && styles.leagueTabTextActive
            ]}>
              {league.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
  };

  const renderTypeTabs = () => (
    <View style={styles.typeTabsContainer}>
      <TouchableOpacity
        style={[styles.typeTab, activeTab === 'upcoming' && styles.typeTabActive]}
        onPress={() => setActiveTab('upcoming')}
      >
        <Ionicons
          name="calendar-outline"
          size={14}
          color={activeTab === 'upcoming' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.typeTabText, activeTab === 'upcoming' && styles.typeTabTextActive]}>
          Upcoming
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.typeTab, activeTab === 'results' && styles.typeTabActive]}
        onPress={() => setActiveTab('results')}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={14}
          color={activeTab === 'results' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.typeTabText, activeTab === 'results' && styles.typeTabTextActive]}>
          Results
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.typeTab, activeTab === 'ladder' && styles.typeTabActive]}
        onPress={() => setActiveTab('ladder')}
      >
        <Ionicons
          name="podium-outline"
          size={14}
          color={activeTab === 'ladder' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.typeTabText, activeTab === 'ladder' && styles.typeTabTextActive]}>
          Ladder
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStandingsTable = () => {
    if (standings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="podium-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No standings available</Text>
          <Text style={styles.emptyText}>Ladder not available for this league</Text>
        </View>
      );
    }

    return (
      <Card style={styles.standingsCard}>
        {/* Header */}
        <View style={styles.standingsHeader}>
          <Text style={[styles.standingsHeaderCell, styles.rankCell]}>#</Text>
          <Text style={[styles.standingsHeaderCell, styles.teamCell]}>Team</Text>
          <Text style={styles.standingsHeaderCell}>P</Text>
          <Text style={styles.standingsHeaderCell}>W</Text>
          <Text style={styles.standingsHeaderCell}>L</Text>
          <Text style={styles.standingsHeaderCell}>+/-</Text>
          <Text style={[styles.standingsHeaderCell, styles.ptsCell]}>Pts</Text>
        </View>

        {/* Rows */}
        {standings.map((team, index) => (
          <View
            key={team.teamId}
            style={[
              styles.standingsRow,
              index % 2 === 0 && styles.standingsRowAlt,
              index < 4 && styles.standingsRowTop,
              index >= standings.length - 2 && styles.standingsRowBottom,
            ]}
          >
            <Text style={[styles.standingsCell, styles.rankCell, styles.rankText]}>
              {team.rank}
            </Text>
            <View style={[styles.teamCell, styles.teamInfo]}>
              {team.teamBadge ? (
                <Image source={{ uri: team.teamBadge }} style={styles.standingsTeamLogo} />
              ) : (
                <View style={styles.standingsTeamLogoPlaceholder}>
                  <Text style={styles.standingsTeamInitial}>{team.teamName[0]}</Text>
                </View>
              )}
              <Text style={styles.standingsTeamName} numberOfLines={1}>{team.teamName}</Text>
            </View>
            <Text style={styles.standingsCell}>{team.played}</Text>
            <Text style={styles.standingsCell}>{team.won}</Text>
            <Text style={styles.standingsCell}>{team.lost}</Text>
            <Text style={[styles.standingsCell, team.goalDifference > 0 && styles.positiveDiff, team.goalDifference < 0 && styles.negativeDiff]}>
              {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
            </Text>
            <Text style={[styles.standingsCell, styles.ptsCell, styles.ptsText]}>{team.points}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const formatRound = (round: string | undefined): string | null => {
    if (!round) return null;
    const roundNum = parseInt(round, 10);
    if (roundNum >= 500) return 'Preseason';
    if (roundNum === 0) return 'Finals';
    return `Round ${round}`;
  };

  const renderEventCard = (event: SportsDBSearchResult) => {
    const isAdding = addingEventIds.has(event.id);
    const eventDate = new Date(event.date);
    const isCompleted = event.status === 'completed';
    const roundDisplay = formatRound(event.round);

    return (
      <Card key={event.id} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Text style={styles.leagueName}>{event.league}</Text>
          {roundDisplay && <Text style={styles.roundText}>{roundDisplay}</Text>}
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            {event.homeTeam.logo ? (
              <Image source={{ uri: event.homeTeam.logo }} style={styles.teamLogo} />
            ) : (
              <View style={styles.teamLogoPlaceholder}>
                <Text style={styles.teamInitial}>{event.homeTeam.name[0]}</Text>
              </View>
            )}
            <Text style={[styles.teamName, isCompleted && event.homeScore && event.awayScore &&
              parseInt(event.homeScore) > parseInt(event.awayScore) && styles.teamNameWinner]}
              numberOfLines={1}
            >
              {event.homeTeam.name}
            </Text>
            {isCompleted && event.homeScore && (
              <Text style={[styles.score, parseInt(event.homeScore) > parseInt(event.awayScore || '0') && styles.scoreWinner]}>
                {event.homeScore}
              </Text>
            )}
          </View>

          <View style={styles.teamRow}>
            {event.awayTeam.logo ? (
              <Image source={{ uri: event.awayTeam.logo }} style={styles.teamLogo} />
            ) : (
              <View style={styles.teamLogoPlaceholder}>
                <Text style={styles.teamInitial}>{event.awayTeam.name[0]}</Text>
              </View>
            )}
            <Text style={[styles.teamName, isCompleted && event.homeScore && event.awayScore &&
              parseInt(event.awayScore) > parseInt(event.homeScore) && styles.teamNameWinner]}
              numberOfLines={1}
            >
              {event.awayTeam.name}
            </Text>
            {isCompleted && event.awayScore && (
              <Text style={[styles.score, parseInt(event.awayScore) > parseInt(event.homeScore || '0') && styles.scoreWinner]}>
                {event.awayScore}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.dateText}>
              {eventDate.toLocaleDateString('en-AU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
          {eventDate.getHours() !== 0 && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.dateText}>
                {eventDate.toLocaleTimeString('en-AU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          {event.venue && (
            <View style={styles.venueContainer}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={styles.venueText} numberOfLines={1}>{event.venue.name}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={() => handleAddToEvents(event)}
          disabled={isAdding}
          activeOpacity={0.7}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const events = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'ladder') {
      return renderStandingsTable();
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name={config.icon as any} size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'upcoming'
              ? 'No upcoming events scheduled'
              : 'No recent results available'}
          </Text>
        </View>
      );
    }

    return events.map(renderEventCard);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: config.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        {renderLeagueTabs()}
        {renderTypeTabs()}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {renderContent()}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  leagueTabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leagueTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  leagueTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  leagueTabActive: {
    backgroundColor: colors.primary,
  },
  leagueTabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  leagueTabTextActive: {
    color: colors.white,
  },
  typeTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    gap: 4,
  },
  typeTabActive: {
    backgroundColor: colors.primary,
  },
  typeTabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  typeTabTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
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
  eventCard: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leagueName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  roundText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  teamsContainer: {
    gap: spacing.xs,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInitial: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  teamName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  teamNameWinner: {
    fontWeight: fontWeight.bold,
  },
  score: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    minWidth: 24,
    textAlign: 'right',
  },
  scoreWinner: {
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dateText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  venueText: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  // Standings table styles
  standingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  standingsHeaderCell: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    width: 28,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  standingsRowAlt: {
    backgroundColor: colors.surfaceLight,
  },
  standingsRowTop: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  standingsRowBottom: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  standingsCell: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 28,
  },
  rankCell: {
    width: 24,
  },
  rankText: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  teamCell: {
    flex: 1,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  standingsTeamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  standingsTeamLogoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standingsTeamInitial: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  standingsTeamName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  ptsCell: {
    width: 32,
  },
  ptsText: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  positiveDiff: {
    color: colors.success,
  },
  negativeDiff: {
    color: colors.error,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
