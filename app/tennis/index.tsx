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
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import {
  fetchTennisLiveScores,
  fetchTennisMatches,
  fetchTennisRankings,
  getDateRange,
  isApiKeyConfigured,
  TennisMatchResult,
  TennisRankingResult,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
} from '@/lib/apitennis';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { parseLocalDate } from '@/utils/dates';

type TabType = 'live' | 'upcoming' | 'atp' | 'wta';

export default function TennisScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [liveMatches, setLiveMatches] = useState<TennisMatchResult[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<TennisMatchResult[]>([]);
  const [atpRankings, setAtpRankings] = useState<TennisRankingResult[]>([]);
  const [wtaRankings, setWtaRankings] = useState<TennisRankingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Collapsible state: { "tournamentName": true/false, "tournamentName:category": true/false }
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { user } = useAuthStore();

  const handleAddToEvents = async (match: TennisMatchResult) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add events to your tracker.');
      return;
    }

    // Build the full set score string from setScores array (e.g., "6-4, 6-3, 7-5")
    const fullScoreString = match.setScores.length > 0
      ? match.setScores.map(set => {
          let scoreStr = `${set.player1}-${set.player2}`;
          // Add tiebreak notation if present
          if (set.player1Tiebreak || set.player2Tiebreak) {
            scoreStr += `(${set.player1Tiebreak || set.player2Tiebreak})`;
          }
          return scoreStr;
        }).join(', ')
      : '';

    // Navigate to manual form with prefilled data so user can review/edit
    router.push({
      pathname: '/event/manual',
      params: {
        espnEvent: JSON.stringify({
          sport: 'tennis',
          league: match.tournament.name,
          date: `${match.date}T${match.time || '12:00'}`,
          status: match.status,
          homeTeam: { name: match.player1.name, logo: match.player1.logo },
          awayTeam: { name: match.player2.name, logo: match.player2.logo },
          homeScore: fullScoreString,
          awayScore: '', // Tennis uses single score field
          venue: { name: match.tournament.name },
        }),
      },
    });
  };

  const toggleTournament = (tournament: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [tournament]: prev[tournament] === undefined ? false : !prev[tournament],
    }));
  };

  const toggleCategory = (tournament: string, category: string) => {
    const key = `${tournament}:${category}`;
    setExpandedSections((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isTournamentExpanded = (tournament: string) => {
    return expandedSections[tournament] !== false; // default to expanded
  };

  const isCategoryExpanded = (tournament: string, category: string) => {
    return expandedSections[`${tournament}:${category}`] !== false; // default to expanded
  };

  const loadData = useCallback(async () => {
    setApiError(null);

    // Check if API key is configured
    if (!isApiKeyConfigured()) {
      setApiError('Tennis API key not configured. Please add EXPO_PUBLIC_APITENNIS_KEY to your environment.');
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (activeTab === 'live') {
        const matches = await fetchTennisLiveScores();
        setLiveMatches(matches);
      } else if (activeTab === 'upcoming') {
        const { start, end } = getDateRange(7);
        const matches = await fetchTennisMatches({ dateStart: start, dateStop: end });
        // Filter to only scheduled matches
        setUpcomingMatches(matches.filter(m => m.status === 'scheduled'));
      } else if (activeTab === 'atp') {
        const rankings = await fetchTennisRankings('ATP');
        setAtpRankings(rankings.slice(0, 100));
      } else if (activeTab === 'wta') {
        const rankings = await fetchTennisRankings('WTA');
        setWtaRankings(rankings.slice(0, 100));
      }
    } catch (error) {
      console.error('Error loading tennis data:', error);
      setApiError('Failed to load tennis data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [activeTab, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Normalize tournament name by removing ATP/WTA/ITF/Boys/Girls prefixes
  const normalizeTournamentName = (name: string): string => {
    return name
      .replace(/^(ATP|WTA|ITF)\s+/i, '')
      .replace(/^(Boys|Girls|Men'?s?|Women'?s?|Mixed)\s+/i, '')
      .replace(/\s+(ATP|WTA|ITF)$/i, '')
      .trim();
  };

  // Group matches by tournament, then by category
  const groupMatchesByTournamentAndCategory = (matches: TennisMatchResult[]) => {
    const grouped: Record<string, Record<string, TennisMatchResult[]>> = {};

    matches.forEach((match) => {
      // Normalize tournament name to group all ATP/WTA/Boys/Girls under same tournament
      const tournamentName = normalizeTournamentName(match.tournament.name);
      const category = match.category;

      if (!grouped[tournamentName]) {
        grouped[tournamentName] = {};
      }
      if (!grouped[tournamentName][category]) {
        grouped[tournamentName][category] = [];
      }
      grouped[tournamentName][category].push(match);
    });

    // Sort tournaments alphabetically, then categories within each tournament
    const sortedGrouped: typeof grouped = {};
    Object.keys(grouped).sort().forEach((tournament) => {
      sortedGrouped[tournament] = {};
      CATEGORY_ORDER.forEach((cat) => {
        if (grouped[tournament][cat]) {
          sortedGrouped[tournament][cat] = grouped[tournament][cat];
        }
      });
    });

    return sortedGrouped;
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {[
          { key: 'live', label: 'Live', icon: 'radio' },
          { key: 'upcoming', label: 'Upcoming', icon: 'calendar' },
          { key: 'atp', label: 'ATP', icon: 'trophy' },
          { key: 'wta', label: 'WTA', icon: 'trophy' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'live' && liveMatches.length > 0 && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{liveMatches.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMatchCard = (match: TennisMatchResult, showTournament = true, showAddButton = false) => {
    return (
    <Card key={match.id} style={styles.matchCard}>
      <View style={styles.matchHeader}>
        {showTournament ? (
          <Text style={styles.tournamentName} numberOfLines={1}>
            {match.tournament.name}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={styles.matchMeta}>
          <Text style={styles.roundText}>{match.tournament.round}</Text>
          {match.isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.matchPlayers}>
        {/* Player 1 */}
        <View style={styles.playerRow}>
          {match.player1.logo ? (
            <Image source={{ uri: match.player1.logo }} style={styles.playerLogo} />
          ) : (
            <View style={styles.playerLogoPlaceholder}>
              <Text style={styles.playerInitial}>{match.player1.name[0]}</Text>
            </View>
          )}
          <Text
            style={[
              styles.playerName,
              match.winner === match.player1.name && styles.playerNameWinner,
            ]}
            numberOfLines={1}
          >
            {match.player1.name}
          </Text>
          {match.status !== 'scheduled' && (
            <View style={styles.setsContainer}>
              {match.setScores.map((set, i) => {
                const p1 = parseInt(set.player1) || 0;
                const p2 = parseInt(set.player2) || 0;
                // Set is complete if someone has 6+ and leads by 2, or won tiebreak (7-6)
                const setComplete =
                  ((p1 >= 6 || p2 >= 6) && Math.abs(p1 - p2) >= 2) ||
                  (p1 === 7 && p2 === 6) ||
                  (p1 === 6 && p2 === 7);
                const p1Won = setComplete && p1 > p2;
                return (
                  <Text
                    key={i}
                    style={[
                      styles.setScore,
                      p1Won && styles.setScoreWinner,
                    ]}
                  >
                    {set.player1}
                    {set.player1Tiebreak && (
                      <Text style={styles.tiebreakScore}>({set.player1Tiebreak})</Text>
                    )}
                  </Text>
                );
              })}
            </View>
          )}
        </View>

        {/* Player 2 */}
        <View style={styles.playerRow}>
          {match.player2.logo ? (
            <Image source={{ uri: match.player2.logo }} style={styles.playerLogo} />
          ) : (
            <View style={styles.playerLogoPlaceholder}>
              <Text style={styles.playerInitial}>{match.player2.name[0]}</Text>
            </View>
          )}
          <Text
            style={[
              styles.playerName,
              match.winner === match.player2.name && styles.playerNameWinner,
            ]}
            numberOfLines={1}
          >
            {match.player2.name}
          </Text>
          {match.status !== 'scheduled' && (
            <View style={styles.setsContainer}>
              {match.setScores.map((set, i) => {
                const p1 = parseInt(set.player1) || 0;
                const p2 = parseInt(set.player2) || 0;
                // Set is complete if someone has 6+ and leads by 2, or won tiebreak (7-6)
                const setComplete =
                  ((p1 >= 6 || p2 >= 6) && Math.abs(p1 - p2) >= 2) ||
                  (p1 === 7 && p2 === 6) ||
                  (p1 === 6 && p2 === 7);
                const p2Won = setComplete && p2 > p1;
                return (
                  <Text
                    key={i}
                    style={[
                      styles.setScore,
                      p2Won && styles.setScoreWinner,
                    ]}
                  >
                    {set.player2}
                    {set.player2Tiebreak && (
                      <Text style={styles.tiebreakScore}>({set.player2Tiebreak})</Text>
                    )}
                  </Text>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {match.status === 'scheduled' && (
        <View style={styles.matchFooter}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={styles.matchTime}>
            {parseLocalDate(match.date + 'T' + match.time).toLocaleString('en-AU', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {match.surface && (
        <View style={styles.surfaceBadge}>
          <Text style={styles.surfaceText}>{match.surface}</Text>
        </View>
      )}

      {showAddButton && (
        <View style={styles.addButtonFooter}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToEvents(match)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addButtonText}>Add to My Events</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
  };

  const renderRankingRow = (ranking: TennisRankingResult, index: number) => {
    if (!ranking || !ranking.playerName) return null;

    return (
      <View
        key={ranking.playerId || index}
        style={[styles.rankingRow, index % 2 === 0 && styles.rankingRowAlt]}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankNumber}>{ranking.rank || '-'}</Text>
          {ranking.movement && ranking.movement !== '0' && (
            <Ionicons
              name={ranking.movement.startsWith('-') ? 'caret-down' : 'caret-up'}
              size={12}
              color={ranking.movement.startsWith('-') ? colors.error : colors.success}
            />
          )}
        </View>
        {ranking.logo ? (
          <Image source={{ uri: ranking.logo }} style={styles.rankingLogo} />
        ) : (
          <View style={styles.rankingLogoPlaceholder}>
            <Text style={styles.rankingInitial}>{ranking.playerName?.[0] || '?'}</Text>
          </View>
        )}
        <View style={styles.rankingInfo}>
          <Text style={styles.rankingName} numberOfLines={1}>{ranking.playerName}</Text>
          <Text style={styles.rankingCountry}>{ranking.country || ''}</Text>
        </View>
        <Text style={styles.rankingPoints}>
          {isNaN(ranking.points) ? '0' : ranking.points.toLocaleString()} pts
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tennis data...</Text>
        </View>
      );
    }

    if (apiError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>API Error</Text>
          <Text style={styles.emptyText}>{apiError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'live') {
      if (liveMatches.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="tennisball-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No live matches</Text>
            <Text style={styles.emptyText}>Check back later for live tennis action</Text>
          </View>
        );
      }
      const grouped = groupMatchesByTournamentAndCategory(liveMatches);
      return (
        <>
          {Object.entries(grouped).map(([tournament, categories]) => (
            <View key={tournament} style={styles.tournamentSection}>
              <TouchableOpacity
                style={styles.tournamentHeader}
                onPress={() => toggleTournament(tournament)}
                activeOpacity={0.7}
              >
                <Ionicons name="tennisball" size={18} color={colors.primary} />
                <Text style={styles.tournamentTitle}>{tournament}</Text>
                <Ionicons
                  name={isTournamentExpanded(tournament) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {isTournamentExpanded(tournament) && Object.entries(categories).map(([category, matches]) => (
                <View key={category} style={styles.categorySection}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(tournament, category)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category] || category}</Text>
                    <View style={styles.categoryMeta}>
                      <View style={styles.matchCountBadge}>
                        <Text style={styles.matchCountText}>
                          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isCategoryExpanded(tournament, category) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                  {isCategoryExpanded(tournament, category) && matches.map((m) => renderMatchCard(m, false, true))}
                </View>
              ))}
            </View>
          ))}
        </>
      );
    }

    if (activeTab === 'upcoming') {
      if (upcomingMatches.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No upcoming matches</Text>
            <Text style={styles.emptyText}>No scheduled matches in the next 7 days</Text>
          </View>
        );
      }
      const grouped = groupMatchesByTournamentAndCategory(upcomingMatches);
      return (
        <>
          {Object.entries(grouped).map(([tournament, categories]) => (
            <View key={tournament} style={styles.tournamentSection}>
              <TouchableOpacity
                style={styles.tournamentHeader}
                onPress={() => toggleTournament(tournament)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text style={styles.tournamentTitle}>{tournament}</Text>
                <Ionicons
                  name={isTournamentExpanded(tournament) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {isTournamentExpanded(tournament) && Object.entries(categories).map(([category, matches]) => (
                <View key={category} style={styles.categorySection}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(tournament, category)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category] || category}</Text>
                    <View style={styles.categoryMeta}>
                      <View style={styles.matchCountBadge}>
                        <Text style={styles.matchCountText}>
                          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isCategoryExpanded(tournament, category) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                  {isCategoryExpanded(tournament, category) && matches.map((m) => renderMatchCard(m, false, true))}
                </View>
              ))}
            </View>
          ))}
        </>
      );
    }

    if (activeTab === 'atp') {
      if (atpRankings.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Rankings unavailable</Text>
            <Text style={styles.emptyText}>Could not load ATP rankings</Text>
          </View>
        );
      }
      return (
        <Card style={styles.rankingsCard}>
          <Text style={styles.rankingsTitle}>ATP Singles Rankings</Text>
          {atpRankings.map((r, i) => renderRankingRow(r, i))}
        </Card>
      );
    }

    if (activeTab === 'wta') {
      if (wtaRankings.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Rankings unavailable</Text>
            <Text style={styles.emptyText}>Could not load WTA rankings</Text>
          </View>
        );
      }
      return (
        <Card style={styles.rankingsCard}>
          <Text style={styles.rankingsTitle}>WTA Singles Rankings</Text>
          {wtaRankings.map((r, i) => renderRankingRow(r, i))}
        </Card>
      );
    }

    return null;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tennis',
        }}
      />
      <View style={styles.container}>
        {renderTabs()}
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
  tabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  liveBadge: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    minWidth: 18,
    alignItems: 'center',
  },
  liveBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
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
  matchCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tournamentName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    flex: 1,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roundText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  liveText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  matchPlayers: {
    gap: spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  playerLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  playerName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  playerNameWinner: {
    fontWeight: fontWeight.bold,
  },
  setsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  setScore: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    minWidth: 20,
    textAlign: 'center',
  },
  setScoreWinner: {
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  tiebreakScore: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.normal,
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  surfaceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surfaceLighter,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  surfaceText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  rankingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  rankingsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  rankingRowAlt: {
    backgroundColor: colors.surfaceLight,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 36,
    gap: 2,
  },
  rankNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rankingLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rankingLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingInitial: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  rankingCountry: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  rankingPoints: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  // Tournament and category grouping styles
  tournamentSection: {
    marginBottom: spacing.xl,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tournamentTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  categoryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  matchCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  addButtonFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  retryButton: {
    marginTop: spacing.lg,
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
