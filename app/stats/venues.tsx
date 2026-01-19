import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface VenueStats {
  venueName: string;
  city?: string;
  totalVisits: number;
  sports: string[];
  teams: string[];
  firstVisit: string;
  lastVisit: string;
  wins: number;
  losses: number;
  draws: number;
}

export default function VenuesStatsScreen() {
  const { attendedEvents } = useEventsStore();

  const venueStats = useMemo(() => {
    const stats: Record<string, VenueStats> = {};

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const venueName = event.venue?.name || 'Unknown Venue';
      const city = event.venue?.city;
      const sport = event.sport?.name || 'Unknown';
      const homeTeam = event.home_team?.name || '';
      const awayTeam = event.away_team?.name || '';
      const eventDate = event.event_date || attended.created_at;

      if (!stats[venueName]) {
        stats[venueName] = {
          venueName,
          city,
          totalVisits: 0,
          sports: [],
          teams: [],
          firstVisit: eventDate,
          lastVisit: eventDate,
          wins: 0,
          losses: 0,
          draws: 0,
        };
      }

      stats[venueName].totalVisits++;

      if (sport && !stats[venueName].sports.includes(sport)) {
        stats[venueName].sports.push(sport);
      }
      if (homeTeam && !stats[venueName].teams.includes(homeTeam)) {
        stats[venueName].teams.push(homeTeam);
      }
      if (awayTeam && !stats[venueName].teams.includes(awayTeam)) {
        stats[venueName].teams.push(awayTeam);
      }

      if (new Date(eventDate) < new Date(stats[venueName].firstVisit)) {
        stats[venueName].firstVisit = eventDate;
      }
      if (new Date(eventDate) > new Date(stats[venueName].lastVisit)) {
        stats[venueName].lastVisit = eventDate;
      }

      // Track wins/losses/draws at this venue
      if (event.is_draw) {
        stats[venueName].draws++;
      } else if (event.winner_team_id) {
        stats[venueName].wins++;
      }
    });

    return Object.values(stats).sort((a, b) => b.totalVisits - a.totalVisits);
  }, [attendedEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
        <Text style={styles.headerTitle}>Venues You've Visited</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.summaryText}>
          You've been to {venueStats.length} different venues
        </Text>

        {venueStats.map((venue, index) => (
          <Card key={venue.venueName} style={styles.venueCard}>
            <View style={styles.venueHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.venueName}</Text>
                {venue.city && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={colors.textMuted} />
                    <Text style={styles.venueMeta}>{venue.city}</Text>
                  </View>
                )}
              </View>
              <View style={styles.visitsCount}>
                <Text style={styles.visitsNumber}>{venue.totalVisits}</Text>
                <Text style={styles.visitsLabel}>visits</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="basketball" size={16} color={colors.primary} />
                <Text style={styles.detailText}>{venue.sports.length} sports</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={16} color={colors.info} />
                <Text style={styles.detailText}>{venue.teams.length} teams</Text>
              </View>
            </View>

            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>First visit</Text>
                <Text style={styles.dateValue}>{formatDate(venue.firstVisit)}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Last visit</Text>
                <Text style={styles.dateValue}>{formatDate(venue.lastVisit)}</Text>
              </View>
            </View>

            {venue.sports.length > 0 && (
              <View style={styles.tagsContainer}>
                {venue.sports.slice(0, 4).map((sport) => (
                  <View key={sport} style={styles.tag}>
                    <Text style={styles.tagText}>{sport}</Text>
                  </View>
                ))}
                {venue.sports.length > 4 && (
                  <View style={[styles.tag, styles.moreTag]}>
                    <Text style={styles.tagText}>+{venue.sports.length - 4}</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        ))}

        {venueStats.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No venues yet</Text>
            <Text style={styles.emptyText}>
              Add events to start tracking the venues you've visited
            </Text>
          </View>
        )}
      </ScrollView>
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
  venueCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successLight || `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  venueMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  visitsCount: {
    alignItems: 'center',
  },
  visitsNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  visitsLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  dateValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tag: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  moreTag: {
    backgroundColor: colors.textSecondary,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
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
});
