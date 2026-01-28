import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSportColor } from '@/constants/sports';
import { parseLocalDate } from '@/utils/dates';
import type { AttendedEventWithDetails } from '@/types';

interface TeamStats {
  teamName: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  venues: string[];
  lastSeen: string;
}

export default function TeamsStatsScreen() {
  const { attendedEvents } = useEventsStore();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get events for a specific team
  const getTeamEvents = (teamName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      return event.home_team?.name === teamName || event.away_team?.name === teamName;
    });
  };

  const openTeamModal = (teamName: string) => {
    setSelectedTeam(teamName);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeam(null);
  };

  const teamStats = useMemo(() => {
    const stats: Record<string, TeamStats> = {};

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const homeTeam = event.home_team?.name || 'Unknown';
      const awayTeam = event.away_team?.name || 'Unknown';
      const venue = event.venue?.name || 'Unknown Venue';
      const eventDate = event.event_date || attended.created_at;

      // Process home team
      if (!stats[homeTeam]) {
        stats[homeTeam] = {
          teamName: homeTeam,
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          venues: [],
          lastSeen: eventDate,
        };
      }
      stats[homeTeam].totalGames++;
      if (!stats[homeTeam].venues.includes(venue)) {
        stats[homeTeam].venues.push(venue);
      }
      if (parseLocalDate(eventDate) > parseLocalDate(stats[homeTeam].lastSeen)) {
        stats[homeTeam].lastSeen = eventDate;
      }

      // Process away team
      if (!stats[awayTeam]) {
        stats[awayTeam] = {
          teamName: awayTeam,
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          venues: [],
          lastSeen: eventDate,
        };
      }
      stats[awayTeam].totalGames++;
      if (!stats[awayTeam].venues.includes(venue)) {
        stats[awayTeam].venues.push(venue);
      }
      if (parseLocalDate(eventDate) > parseLocalDate(stats[awayTeam].lastSeen)) {
        stats[awayTeam].lastSeen = eventDate;
      }

      // Track wins/losses/draws
      if (event.is_draw) {
        stats[homeTeam].draws++;
        stats[awayTeam].draws++;
      } else if (event.winner_team_id) {
        if (event.winner_team_id === event.home_team_id) {
          stats[homeTeam].wins++;
          stats[awayTeam].losses++;
        } else {
          stats[awayTeam].wins++;
          stats[homeTeam].losses++;
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.totalGames - a.totalGames);
  }, [attendedEvents]);

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/stats');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teams You've Seen</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.summaryText}>
          You've watched {teamStats.length} different teams play
        </Text>

        {teamStats.map((team, index) => (
          <Card key={team.teamName} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <TouchableOpacity style={styles.teamInfo} onPress={() => openTeamModal(team.teamName)}>
                <Text style={styles.teamName}>{team.teamName}</Text>
                <Text style={styles.teamMeta}>
                  Last seen: {formatDate(team.lastSeen)} • Tap to see games
                </Text>
              </TouchableOpacity>
              <View style={styles.gamesCount}>
                <Text style={styles.gamesNumber}>{team.totalGames}</Text>
                <Text style={styles.gamesLabel}>games</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>{team.wins}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.textSecondary }]}>{team.draws}</Text>
                <Text style={styles.statLabel}>Draws</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.error }]}>{team.losses}</Text>
                <Text style={styles.statLabel}>Losses</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{team.venues.length}</Text>
                <Text style={styles.statLabel}>Venues</Text>
              </View>
            </View>

            {team.wins + team.losses + team.draws > 0 && (
              <View style={styles.winRateContainer}>
                <Text style={styles.winRateLabel}>Win Rate (when you attend)</Text>
                <View style={styles.winRateBar}>
                  <View
                    style={[
                      styles.winRateFill,
                      {
                        width: `${(team.wins / (team.wins + team.losses + team.draws)) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.winRatePercent}>
                  {Math.round((team.wins / (team.wins + team.losses + team.draws)) * 100)}%
                </Text>
              </View>
            )}
          </Card>
        ))}

        {teamStats.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No teams yet</Text>
            <Text style={styles.emptyText}>
              Add events to start tracking the teams you've seen
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Team Games Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTeam}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            {selectedTeam ? getTeamEvents(selectedTeam).length : 0} game{selectedTeam && getTeamEvents(selectedTeam).length !== 1 ? 's' : ''} attended
          </Text>
          <FlatList
            data={selectedTeam ? getTeamEvents(selectedTeam) : []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => {
              const event = item.event;
              if (!event) return null;
              const sportColor = getSportColor(event.sport?.name?.toLowerCase() || '');
              const isHomeTeam = event.home_team?.name === selectedTeam;
              return (
                <TouchableOpacity
                  style={styles.modalEventCard}
                  onPress={() => {
                    closeModal();
                    router.push(`/event/${item.event_id}`);
                  }}
                >
                  <View style={[styles.modalEventIndicator, { backgroundColor: sportColor }]} />
                  <View style={styles.modalEventContent}>
                    <View style={styles.modalEventTop}>
                      <Badge label={event.sport?.name || 'Sport'} size="sm" color={sportColor} />
                      <Badge
                        label={isHomeTeam ? 'Home' : 'Away'}
                        size="sm"
                        color={isHomeTeam ? colors.info : colors.textSecondary}
                      />
                    </View>
                    <Text style={styles.modalEventTeams} numberOfLines={1}>
                      {event.home_team?.short_name || event.home_team?.name || 'Home'} vs {event.away_team?.short_name || event.away_team?.name || 'Away'}
                    </Text>
                    <View style={styles.modalEventBottom}>
                      {(event.home_score !== null && event.away_score !== null) && (
                        <Text style={styles.modalEventScore}>{event.home_score} - {event.away_score}</Text>
                      )}
                      <Text style={styles.modalEventDate}>
                        {parseLocalDate(event.event_date).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={styles.modalEmptyText}>No games found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  summaryText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  teamCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  teamMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  gamesCount: {
    alignItems: 'center',
  },
  gamesNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  gamesLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  winRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  winRateLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
  },
  winRateBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  winRateFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  winRatePercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    width: 40,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  modalClose: {
    padding: spacing.sm,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalList: {
    padding: spacing.lg,
  },
  modalEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  modalEventIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  modalEventContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalEventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalEventTeams: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalEventBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalEventScore: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalEventDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  modalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  modalEmptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
