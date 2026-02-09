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
import { parseLocalDate } from '@/utils/dates';
import type { EventWithDetails } from '@/types';

export default function DateOverviewScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const { user } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents, isLoading } = useEventsStore();
  const [hasFetched, setHasFetched] = useState(false);
  const [otherEvents, setOtherEvents] = useState<EventWithDetails[]>([]);
  const [loadingOther, setLoadingOther] = useState(false);

  const dateString = dateParam || '';

  const formattedDate = useMemo(() => {
    if (!dateString) return '';
    const d = parseLocalDate(dateString);
    return d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [dateString]);

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

  // Filter user's events on this date
  const dateEvents = useMemo(() => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      return event.event_date === dateString;
    });
  }, [attendedEvents, dateString]);

  // Compute stats
  const stats = useMemo(() => {
    const sports = new Set<string>();
    const venues = new Set<string>();

    dateEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const sport = event.sport?.name || event.sport_name;
      if (sport) sports.add(sport);

      const venue = event.venue?.name || event.venue_name;
      if (venue) venues.add(venue);
    });

    return {
      eventsAttended: dateEvents.length,
      sportCount: sports.size,
      sports: Array.from(sports),
      venueCount: venues.size,
    };
  }, [dateEvents]);

  // Fetch other public events on this date
  useEffect(() => {
    const fetchOtherEvents = async () => {
      if (!dateString) return;
      setLoadingOther(true);
      try {
        const userEventIds = dateEvents.map((a) => a.event_id);

        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            sport:sports(*),
            home_team:teams!events_home_team_id_fkey(*),
            away_team:teams!events_away_team_id_fkey(*),
            venue:venues(*)
          `)
          .eq('event_date', dateString)
          .order('event_time', { ascending: true })
          .limit(30);

        if (error) throw error;

        // Exclude user's own events
        const filtered = (data || []).filter(
          (e: any) => !userEventIds.includes(e.id)
        );

        setOtherEvents(filtered as EventWithDetails[]);
      } catch (err) {
        console.error('Error fetching other date events:', err);
      } finally {
        setLoadingOther(false);
      }
    };

    fetchOtherEvents();
  }, [dateString, dateEvents]);

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
        <Text style={styles.headerTitle}>Date</Text>
      </View>

      {/* Date Header */}
      <View style={styles.dateHeader}>
        <View style={styles.dateIcon}>
          <Ionicons name="calendar" size={36} color={colors.white} />
        </View>
        <Text style={styles.dateName}>{formattedDate}</Text>
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
          <Text style={styles.statValue}>{stats.eventsAttended}</Text>
          <Text style={styles.statLabel}>Events Attended</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.sportCount}</Text>
          <Text style={styles.statLabel}>Sports</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.venueCount}</Text>
          <Text style={styles.statLabel}>Venues</Text>
        </Card>
      </View>

      {/* Your Events */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Your Events</Text>
        {dateEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events attended on this date</Text>
          </Card>
        ) : (
          dateEvents.map((attended) => (
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

      {/* Other Events That Day */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Other Events That Day</Text>
        {loadingOther ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : otherEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No other events found on this date</Text>
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
  dateHeader: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateName: {
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
    minWidth: '28%',
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
    textAlign: 'center',
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
