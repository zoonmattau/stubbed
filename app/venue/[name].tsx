import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { EventCard } from '@/components/events/EventCard';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate } from '@/utils/dates';
import type { EventWithDetails } from '@/types';

export default function VenueOverviewScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { user } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents, isLoading } = useEventsStore();
  const [hasFetched, setHasFetched] = useState(false);
  const [otherEvents, setOtherEvents] = useState<EventWithDetails[]>([]);
  const [loadingOther, setLoadingOther] = useState(false);

  const venueName = decodeURIComponent(name || '');

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

  // Filter user's events at this venue
  const venueEvents = useMemo(() => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const eventVenue = event.venue?.name || event.venue_name || '';
      return eventVenue.toLowerCase() === venueName.toLowerCase();
    });
  }, [attendedEvents, venueName]);

  // Compute stats
  const stats = useMemo(() => {
    const sports = new Set<string>();
    const teams = new Set<string>();
    let firstVisit: string | null = null;
    let lastVisit: string | null = null;

    venueEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const sport = event.sport?.name || event.sport_name;
      if (sport) sports.add(sport);

      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) teams.add(homeTeam);
      if (awayTeam) teams.add(awayTeam);

      const date = event.event_date;
      if (!firstVisit || date < firstVisit) firstVisit = date;
      if (!lastVisit || date > lastVisit) lastVisit = date;
    });

    return {
      totalVisits: venueEvents.length,
      sportCount: sports.size,
      sports: Array.from(sports),
      teamCount: teams.size,
      firstVisit,
      lastVisit,
    };
  }, [venueEvents]);

  // Fetch other public events at this venue
  useEffect(() => {
    const fetchOtherEvents = async () => {
      if (!venueName) return;
      setLoadingOther(true);
      try {
        const userEventIds = venueEvents.map((a) => a.event_id);
        const allEvents: any[] = [];
        const seenIds = new Set<string>();

        // Search by venue record
        const { data: venueData } = await supabase
          .from('venues')
          .select('id')
          .ilike('name', venueName)
          .limit(1) as { data: { id: string }[] | null };

        if (venueData && venueData.length > 0) {
          const venueId = venueData[0].id;
          const { data } = await supabase
            .from('events')
            .select(`
              *,
              sport:sports(*),
              home_team:teams!events_home_team_id_fkey(*),
              away_team:teams!events_away_team_id_fkey(*),
              venue:venues(*)
            `)
            .eq('venue_id', venueId)
            .order('event_date', { ascending: false })
            .limit(20);

          if (data) {
            data.forEach((e: any) => {
              if (!seenIds.has(e.id)) {
                seenIds.add(e.id);
                allEvents.push(e);
              }
            });
          }
        }

        // Also search by venue_name text field
        const { data: nameData } = await supabase
          .from('events')
          .select(`
            *,
            sport:sports(*),
            home_team:teams!events_home_team_id_fkey(*),
            away_team:teams!events_away_team_id_fkey(*),
            venue:venues(*)
          `)
          .ilike('venue_name', venueName)
          .order('event_date', { ascending: false })
          .limit(20);

        if (nameData) {
          nameData.forEach((e: any) => {
            if (!seenIds.has(e.id)) {
              seenIds.add(e.id);
              allEvents.push(e);
            }
          });
        }

        // Exclude user's own events
        const filtered = allEvents.filter(
          (e: any) => !userEventIds.includes(e.id)
        );

        setOtherEvents(filtered as EventWithDetails[]);
      } catch (err) {
        console.error('Error fetching other venue events:', err);
      } finally {
        setLoadingOther(false);
      }
    };

    fetchOtherEvents();
  }, [venueName, venueEvents]);

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.headerTitle}>Venue</Text>
      </View>

      {/* Venue Name */}
      <View style={styles.venueHeader}>
        <View style={styles.venueIcon}>
          <Ionicons name="location" size={36} color={colors.white} />
        </View>
        <Text style={styles.venueName}>{venueName}</Text>
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
          <Text style={styles.statValue}>{stats.totalVisits}</Text>
          <Text style={styles.statLabel}>Your Visits</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.sportCount}</Text>
          <Text style={styles.statLabel}>Sports</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.teamCount}</Text>
          <Text style={styles.statLabel}>Teams</Text>
        </Card>
        {stats.firstVisit && (
          <Card style={styles.statCard}>
            <Text style={styles.statValueSmall}>{formatDate(stats.firstVisit)}</Text>
            <Text style={styles.statLabel}>First Visit</Text>
          </Card>
        )}
      </View>

      {/* Your Events */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Your Events</Text>
        {venueEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events found at this venue</Text>
          </Card>
        ) : (
          venueEvents.map((attended) => (
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

      {/* Other Events Here */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Other Events Here</Text>
        {loadingOther ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : otherEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No other events found at this venue</Text>
          </Card>
        ) : (
          otherEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => handleEventPress(event.id)}
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
    gap: spacing.md,
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
  venueHeader: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  venueIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  sportsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  statValueSmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  eventsSection: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
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
