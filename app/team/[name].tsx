import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Button } from '@/components/ui';
import { EventCard } from '@/components/events/EventCard';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { AttendedEventWithDetails } from '@/types';

export default function TeamOverviewScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { user } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents, isLoading } = useEventsStore();
  const [hasFetched, setHasFetched] = useState(false);

  const teamName = decodeURIComponent(name || '');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  // Fetch events on mount if not loaded
  useEffect(() => {
    if (user?.id && attendedEvents.length === 0 && !hasFetched && !isLoading) {
      setHasFetched(true);
      fetchAttendedEvents(user.id);
    }
  }, [user?.id, attendedEvents.length, hasFetched, isLoading, fetchAttendedEvents]);

  // Filter events involving this team
  const teamEvents = useMemo(() => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const homeTeam = event.home_team?.name || event.home_team_name || '';
      const awayTeam = event.away_team?.name || event.away_team_name || '';
      return (
        homeTeam.toLowerCase() === teamName.toLowerCase() ||
        awayTeam.toLowerCase() === teamName.toLowerCase()
      );
    });
  }, [attendedEvents, teamName]);

  // Calculate stats
  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalGames = teamEvents.length;
    let homeGames = 0;
    let awayGames = 0;
    const venues = new Set<string>();
    const sports = new Set<string>();

    teamEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const homeTeam = event.home_team?.name || event.home_team_name || '';
      const isHome = homeTeam.toLowerCase() === teamName.toLowerCase();

      if (isHome) {
        homeGames++;
      } else {
        awayGames++;
      }

      // Track venue
      const venue = event.venue?.name || event.venue_name;
      if (venue) venues.add(venue);

      // Track sport
      const sport = event.sport?.name || event.sport_name;
      if (sport) sports.add(sport);

      // Calculate win/loss (simplified - assumes higher score wins)
      if (event.is_draw) {
        draws++;
      } else if (event.home_score !== null && event.away_score !== null) {
        const homeScore = parseInt(String(event.home_score), 10) || 0;
        const awayScore = parseInt(String(event.away_score), 10) || 0;
        if (isHome) {
          if (homeScore > awayScore) wins++;
          else if (awayScore > homeScore) losses++;
        } else {
          if (awayScore > homeScore) wins++;
          else if (homeScore > awayScore) losses++;
        }
      }
    });

    return {
      totalGames,
      wins,
      losses,
      draws,
      homeGames,
      awayGames,
      venueCount: venues.size,
      sportCount: sports.size,
      venues: Array.from(venues),
      sports: Array.from(sports),
    };
  }, [teamEvents, teamName]);

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Overview</Text>
      </View>

      {/* Team Name */}
      <View style={styles.teamHeader}>
        <View style={styles.teamLogo}>
          <Text style={styles.teamLogoText}>{teamName[0]?.toUpperCase() || 'T'}</Text>
        </View>
        <Text style={styles.teamName}>{teamName}</Text>
        {stats.sports.length > 0 && (
          <View style={styles.sportsRow}>
            {stats.sports.map((sport) => (
              <Badge key={sport} label={sport} size="sm" color={colors.primary} />
            ))}
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalGames}</Text>
          <Text style={styles.statLabel}>Games Attended</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.error }]}>{stats.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>{stats.draws}</Text>
          <Text style={styles.statLabel}>Draws</Text>
        </Card>
      </View>

      {/* Home/Away Split */}
      <Card style={styles.splitCard}>
        <Text style={styles.sectionTitle}>Home vs Away</Text>
        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <Ionicons name="home" size={24} color={colors.primary} />
            <Text style={styles.splitValue}>{stats.homeGames}</Text>
            <Text style={styles.splitLabel}>Home</Text>
          </View>
          <View style={styles.splitDivider} />
          <View style={styles.splitItem}>
            <Ionicons name="airplane" size={24} color={colors.secondary} />
            <Text style={styles.splitValue}>{stats.awayGames}</Text>
            <Text style={styles.splitLabel}>Away</Text>
          </View>
        </View>
      </Card>

      {/* Venues */}
      {stats.venues.length > 0 && (
        <Card style={styles.venuesCard}>
          <Text style={styles.sectionTitle}>Venues Visited</Text>
          <View style={styles.venuesList}>
            {stats.venues.map((venue) => (
              <View key={venue} style={styles.venueItem}>
                <Ionicons name="location" size={16} color={colors.textSecondary} />
                <Text style={styles.venueText}>{venue}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Event History */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Event History</Text>
        {teamEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events found for this team</Text>
          </Card>
        ) : (
          teamEvents.map((attended) => (
            <EventCard
              key={attended.id}
              event={attended.event!}
              attendance={attended}
              onPress={() => handleEventPress(attended.event_id)}
              mini
            />
          ))
        )}
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
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['3xl'],
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  teamHeader: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  teamLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  teamName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  sportsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  splitCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  splitItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  splitValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  splitLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  splitDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  venuesCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  venuesList: {
    gap: spacing.sm,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  venueText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  eventsSection: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
