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
import { Card } from '@/components/ui';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { parseLocalDate } from '@/utils/dates';
import type { AttendedEventWithDetails } from '@/types';

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
  eventIds: string[];
}

export default function VenuesStatsScreen() {
  const { attendedEvents } = useEventsStore();
  const [selectedVenue, setSelectedVenue] = useState<VenueStats | null>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);

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
          city: city ?? undefined,
          totalVisits: 0,
          sports: [],
          teams: [],
          firstVisit: eventDate,
          lastVisit: eventDate,
          wins: 0,
          losses: 0,
          draws: 0,
          eventIds: [],
        };
      }

      stats[venueName].totalVisits++;
      stats[venueName].eventIds.push(attended.id);

      if (sport && !stats[venueName].sports.includes(sport)) {
        stats[venueName].sports.push(sport);
      }
      if (homeTeam && !stats[venueName].teams.includes(homeTeam)) {
        stats[venueName].teams.push(homeTeam);
      }
      if (awayTeam && !stats[venueName].teams.includes(awayTeam)) {
        stats[venueName].teams.push(awayTeam);
      }

      if (parseLocalDate(eventDate) < parseLocalDate(stats[venueName].firstVisit)) {
        stats[venueName].firstVisit = eventDate;
      }
      if (parseLocalDate(eventDate) > parseLocalDate(stats[venueName].lastVisit)) {
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

  // Get events for selected venue
  const venueEvents = useMemo(() => {
    if (!selectedVenue) return [];
    return attendedEvents.filter(e => selectedVenue.eventIds.includes(e.id))
      .sort((a, b) => parseLocalDate(b.event?.event_date || '').getTime() - parseLocalDate(a.event?.event_date || '').getTime());
  }, [selectedVenue, attendedEvents]);

  const handleVenuePress = (venue: VenueStats) => {
    setSelectedVenue(venue);
    setShowEventsModal(true);
  };

  const handleEventPress = (eventId: string) => {
    setShowEventsModal(false);
    router.push(`/event/${eventId}`);
  };

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
        <Text style={styles.headerTitle}>Venues You've Visited</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.summaryText}>
          You've been to {venueStats.length} different venues
        </Text>

        {venueStats.map((venue, index) => (
          <TouchableOpacity
            key={venue.venueName}
            onPress={() => handleVenuePress(venue)}
            activeOpacity={0.7}
          >
            <Card style={styles.venueCard}>
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

            <View style={styles.viewEventsHint}>
              <Text style={styles.viewEventsText}>Tap to view events</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
            </Card>
          </TouchableOpacity>
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

      {/* Events at Venue Modal */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedVenue?.venueName}</Text>
                {selectedVenue?.city && (
                  <Text style={styles.modalSubtitle}>{selectedVenue.city}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowEventsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={venueEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventItem}
                  onPress={() => handleEventPress(item.event_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTeams}>
                      {item.event?.home_team?.name || item.event?.home_team_name || 'Home'} vs{' '}
                      {item.event?.away_team?.name || item.event?.away_team_name || 'Away'}
                    </Text>
                    <View style={styles.eventMeta}>
                      <Text style={styles.eventDate}>{formatDate(item.event?.event_date || '')}</Text>
                      {item.event?.sport?.name && (
                        <View style={styles.sportBadge}>
                          <Text style={styles.sportBadgeText}>{item.event.sport.name}</Text>
                        </View>
                      )}
                    </View>
                    {item.event?.home_score && item.event?.away_score && (
                      <Text style={styles.eventScore}>
                        {item.event.home_score} - {item.event.away_score}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No events found</Text>
                </View>
              }
            />
          </View>
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
    backgroundColor: `${colors.success}20`,
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
  viewEventsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewEventsText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventInfo: {
    flex: 1,
  },
  eventTeams: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  eventDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sportBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sportBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  eventScore: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyList: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
