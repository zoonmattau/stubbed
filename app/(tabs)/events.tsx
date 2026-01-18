import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EventList } from '@/components/events';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { sortByDate } from '@/utils/dates';
import type { AttendedEventWithDetails } from '@/types';

type FilterType = 'all' | 'favorites' | 'recent';
type SortType = 'date_desc' | 'date_asc' | 'rating';

export default function EventsScreen() {
  const { user } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents, isLoading } = useEventsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date_desc');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAttendedEvents(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchAttendedEvents(user.id);
    setRefreshing(false);
  };

  const filteredEvents = React.useMemo(() => {
    let events = [...attendedEvents];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      events = events.filter((e) => {
        const event = e.event;
        return (
          event?.home_team?.name?.toLowerCase().includes(query) ||
          event?.away_team?.name?.toLowerCase().includes(query) ||
          event?.venue?.name?.toLowerCase().includes(query) ||
          event?.sport?.name?.toLowerCase().includes(query) ||
          event?.competition?.toLowerCase().includes(query)
        );
      });
    }

    // Apply type filter
    if (filter === 'favorites') {
      events = events.filter((e) => e.is_favorite);
    }

    // Apply sort
    switch (sort) {
      case 'date_desc':
        events = sortByDate(events.map((e) => ({ ...e, event_date: e.event?.event_date })));
        break;
      case 'date_asc':
        events = sortByDate(
          events.map((e) => ({ ...e, event_date: e.event?.event_date })),
          true
        );
        break;
      case 'rating':
        events = events.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return events as AttendedEventWithDetails[];
  }, [attendedEvents, searchQuery, filter, sort]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterTabs}>
          {(['all', 'favorites'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f && styles.filterTabTextActive,
                ]}
              >
                {f === 'all' ? 'All Events' : 'Favorites'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            const sorts: SortType[] = ['date_desc', 'date_asc', 'rating'];
            const currentIndex = sorts.indexOf(sort);
            setSort(sorts[(currentIndex + 1) % sorts.length]);
          }}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.textSecondary} />
          <Text style={styles.sortText}>
            {sort === 'date_desc'
              ? 'Newest'
              : sort === 'date_asc'
              ? 'Oldest'
              : 'Rating'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Events List */}
      <EventList
        events={filteredEvents}
        onEventPress={(eventId) => router.push(`/event/${eventId}`)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        emptyMessage={
          searchQuery
            ? 'No events match your search'
            : filter === 'favorites'
            ? 'No favorite events yet'
            : 'No events tracked yet. Add your first event!'
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/event/manual')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  countContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  countText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
