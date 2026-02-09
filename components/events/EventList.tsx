import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { EventCard, EventCardStats } from './EventCard';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize } from '@/constants/theme';
import type { AttendedEventWithDetails } from '@/types';

interface EventListProps {
  events: AttendedEventWithDetails[];
  onEventPress?: (eventId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
  compact?: boolean;
}

export function EventList({
  events,
  onEventPress,
  onRefresh,
  refreshing = false,
  emptyMessage = 'No events found',
  compact = false,
}: EventListProps) {
  const [statsMap, setStatsMap] = useState<Record<string, EventCardStats>>({});

  // Batch-fetch community stats for all events in one query
  useEffect(() => {
    const fetchAllStats = async () => {
      const eventIds = events.map(e => e.event_id).filter(Boolean);
      if (eventIds.length === 0) return;

      try {
        type StatsRow = {
          event_id: string;
          rating: number | null;
          atmosphere_rating: number | null;
        };
        const { data, error } = await supabase
          .from('attended_events')
          .select('event_id, rating, atmosphere_rating')
          .in('event_id', eventIds) as { data: StatsRow[] | null; error: any };

        if (error || !data) return;

        // Aggregate by event_id
        const map: Record<string, { count: number; ratings: number[]; atmospheres: number[] }> = {};
        for (const row of data) {
          if (!map[row.event_id]) {
            map[row.event_id] = { count: 0, ratings: [], atmospheres: [] };
          }
          map[row.event_id].count++;
          if (row.rating != null) map[row.event_id].ratings.push(row.rating);
          if (row.atmosphere_rating != null) map[row.event_id].atmospheres.push(row.atmosphere_rating);
        }

        const result: Record<string, EventCardStats> = {};
        for (const [eventId, agg] of Object.entries(map)) {
          result[eventId] = {
            attendeeCount: agg.count,
            avgRating: agg.ratings.length > 0
              ? agg.ratings.reduce((a, b) => a + b, 0) / agg.ratings.length
              : null,
            avgAtmosphere: agg.atmospheres.length > 0
              ? agg.atmospheres.reduce((a, b) => a + b, 0) / agg.atmospheres.length
              : null,
          };
        }
        setStatsMap(result);
      } catch {
        // Silently fail — stats are nice-to-have
      }
    };

    fetchAllStats();
  }, [events.map(e => e.event_id).join(',')]);

  const renderItem = ({ item }: { item: AttendedEventWithDetails }) => (
    <EventCard
      event={item.event!}
      attendance={item}
      onPress={() => onEventPress?.(item.event_id)}
      compact={compact}
      stats={statsMap[item.event_id]}
    />
  );

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
