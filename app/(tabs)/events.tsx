import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventList } from '@/components/events';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { sortByDate } from '@/utils/dates';
import { useIsMounted } from '@/hooks/useSafeAsync';
import type { AttendedEventWithDetails } from '@/types';

type MainTabType = 'my_events' | 'live' | 'stats';
type FilterType = 'all' | 'favorites';
type SortType = 'date_desc' | 'date_asc' | 'rating';

interface SportCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  route: string;
}

// Sorted alphabetically
const LIVE_SPORTS: SportCategory[] = [
  { id: 'afl', name: 'AFL', icon: 'football', color: '#3b82f6', route: '/sports/afl' },
  { id: 'aleague', name: 'A-League', icon: 'football', color: '#a855f7', route: '/sports/aleague' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball', color: '#f97316', route: '/sports/basketball' },
  { id: 'cricket', name: 'Cricket', icon: 'baseball', color: '#22c55e', route: '/sports/cricket' },
  { id: 'golf', name: 'Golf', icon: 'golf', color: '#10b981', route: '/sports/golf' },
  { id: 'hockey', name: 'Ice Hockey', icon: 'snow', color: '#0ea5e9', route: '/sports/hockey' },
  { id: 'motorsport', name: 'Motorsport', icon: 'car-sport', color: '#ef4444', route: '/sports/motorsport' },
  { id: 'netball', name: 'Netball', icon: 'people', color: '#ec4899', route: '/sports/netball' },
  { id: 'nrl', name: 'NRL', icon: 'football-outline', color: '#8b5cf6', route: '/sports/nrl' },
  { id: 'rugby', name: 'Rugby Union', icon: 'american-football', color: '#f59e0b', route: '/sports/rugby' },
  { id: 'soccer', name: 'Soccer Cups', icon: 'football', color: '#16a34a', route: '/sports/soccer' },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball', color: '#84cc16', route: '/tennis' },
  { id: 'combat', name: 'UFC & Boxing', icon: 'fitness', color: '#f97316', route: '/sports/combat' },
];

const SPORTS_FILTER_KEY = '@sports_filter';

export default function EventsScreen() {
  const { user } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents } = useEventsStore();

  const [mainTab, setMainTab] = useState<MainTabType>('my_events');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date_desc');
  const [refreshing, setRefreshing] = useState(false);
  const [hiddenSports, setHiddenSports] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);

  const isMounted = useIsMounted();

  // Load saved sports filter preferences
  useEffect(() => {
    const loadSportsFilter = async () => {
      try {
        const saved = await AsyncStorage.getItem(SPORTS_FILTER_KEY);
        if (saved && isMounted()) {
          setHiddenSports(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        if (isMounted()) {
          console.error('Error loading sports filter:', error);
        }
      }
    };
    loadSportsFilter();
  }, [isMounted]);

  // Save sports filter preferences
  const saveSportsFilter = useCallback(async (hidden: Set<string>) => {
    try {
      await AsyncStorage.setItem(SPORTS_FILTER_KEY, JSON.stringify([...hidden]));
    } catch (error) {
      console.error('Error saving sports filter:', error);
    }
  }, []);

  const toggleSportVisibility = useCallback((sportId: string) => {
    setHiddenSports(prev => {
      const next = new Set(prev);
      if (next.has(sportId)) {
        next.delete(sportId);
      } else {
        next.add(sportId);
      }
      saveSportsFilter(next);
      return next;
    });
  }, [saveSportsFilter]);

  const visibleSports = LIVE_SPORTS.filter(sport => !hiddenSports.has(sport.id));

  useEffect(() => {
    if (user?.id) {
      fetchAttendedEvents(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchAttendedEvents(user.id);
    if (isMounted()) {
      setRefreshing(false);
    }
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

  const renderMainTabs = () => (
    <View style={styles.mainTabsContainer}>
      <TouchableOpacity
        style={[styles.mainTab, mainTab === 'my_events' && styles.mainTabActive]}
        onPress={() => setMainTab('my_events')}
      >
        <Ionicons
          name="calendar"
          size={16}
          color={mainTab === 'my_events' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.mainTabText, mainTab === 'my_events' && styles.mainTabTextActive]}>
          My Events
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.mainTab, mainTab === 'stats' && styles.mainTabActive]}
        onPress={() => setMainTab('stats')}
      >
        <Ionicons
          name="stats-chart"
          size={16}
          color={mainTab === 'stats' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.mainTabText, mainTab === 'stats' && styles.mainTabTextActive]}>
          Stats
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.mainTab, mainTab === 'live' && styles.mainTabActive]}
        onPress={() => setMainTab('live')}
      >
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
        </View>
        <Text style={[styles.mainTabText, mainTab === 'live' && styles.mainTabTextActive]}>
          Live Sports
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Sports</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Toggle sports to show or hide them</Text>

          <ScrollView style={styles.modalList}>
            {LIVE_SPORTS.map((sport) => {
              const isVisible = !hiddenSports.has(sport.id);
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={styles.filterItem}
                  onPress={() => toggleSportVisibility(sport.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.filterIcon, { backgroundColor: sport.color + '20' }]}>
                    <Ionicons name={sport.icon as any} size={20} color={sport.color} />
                  </View>
                  <Text style={styles.filterItemName}>{sport.name}</Text>
                  <Ionicons
                    name={isVisible ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isVisible ? colors.success : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLiveSports = () => (
    <ScrollView
      style={styles.liveContainer}
      contentContainerStyle={styles.liveContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveHeader}>
        <View>
          <Text style={styles.liveTitle}>Browse Live Sports</Text>
          <Text style={styles.liveSubtitle}>Scores, fixtures, standings & more</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={18} color={colors.primary} />
          {hiddenSports.size > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{hiddenSports.size}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sportsGrid}>
        {visibleSports.map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={styles.sportCard}
            onPress={() => router.push(sport.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.sportIcon, { backgroundColor: sport.color + '20' }]}>
              <Ionicons name={sport.icon as any} size={24} color={sport.color} />
            </View>
            <Text style={styles.sportName}>{sport.name}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={styles.sportArrow} />
          </TouchableOpacity>
        ))}
      </View>

      {visibleSports.length === 0 && (
        <View style={styles.emptyFilter}>
          <Ionicons name="filter-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyFilterText}>All sports are hidden</Text>
          <TouchableOpacity
            style={styles.showAllButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.showAllText}>Manage Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderMyEvents = () => (
    <>
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
    </>
  );

  const renderStatsPreview = () => (
    <ScrollView
      style={styles.statsContainer}
      contentContainerStyle={styles.statsContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>Your Statistics</Text>
        <Text style={styles.statsSubtitle}>Track your sports attendance journey</Text>
      </View>

      {/* Quick Stats Summary */}
      <View style={styles.quickStatsGrid}>
        <View style={styles.quickStatCard}>
          <Ionicons name="ticket" size={24} color={colors.primary} />
          <Text style={styles.quickStatValue}>{attendedEvents.length}</Text>
          <Text style={styles.quickStatLabel}>Events</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Ionicons name="trophy" size={24} color={colors.gold} />
          <Text style={styles.quickStatValue}>
            {attendedEvents.filter(e => e.result === 'win').length}
          </Text>
          <Text style={styles.quickStatLabel}>Wins</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Ionicons name="location" size={24} color={colors.success} />
          <Text style={styles.quickStatValue}>
            {new Set(attendedEvents.map(e => e.event?.venue?.name || e.event?.venue_name).filter(Boolean)).size}
          </Text>
          <Text style={styles.quickStatLabel}>Venues</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Ionicons name="shield" size={24} color={colors.info} />
          <Text style={styles.quickStatValue}>
            {new Set(attendedEvents.flatMap(e => [
              e.event?.home_team?.name || e.event?.home_team_name,
              e.event?.away_team?.name || e.event?.away_team_name
            ].filter(Boolean))).size}
          </Text>
          <Text style={styles.quickStatLabel}>Teams</Text>
        </View>
      </View>

      {/* View Full Stats Button */}
      <TouchableOpacity
        style={styles.viewFullStatsButton}
        onPress={() => router.push('/stats')}
      >
        <Ionicons name="stats-chart" size={20} color={colors.white} />
        <Text style={styles.viewFullStatsText}>View Full Statistics</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.white} />
      </TouchableOpacity>

      {/* Quick Links */}
      <View style={styles.statsLinksContainer}>
        <TouchableOpacity
          style={styles.statsLinkCard}
          onPress={() => router.push('/stats/teams')}
        >
          <View style={[styles.statsLinkIcon, { backgroundColor: `${colors.info}20` }]}>
            <Ionicons name="shield" size={20} color={colors.info} />
          </View>
          <Text style={styles.statsLinkText}>Teams</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsLinkCard}
          onPress={() => router.push('/stats/venues')}
        >
          <View style={[styles.statsLinkIcon, { backgroundColor: `${colors.success}20` }]}>
            <Ionicons name="location" size={20} color={colors.success} />
          </View>
          <Text style={styles.statsLinkText}>Venues</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsLinkCard}
          onPress={() => router.push('/stats/map')}
        >
          <View style={[styles.statsLinkIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="globe" size={20} color={colors.primary} />
          </View>
          <Text style={styles.statsLinkText}>Map View</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsLinkCard}
          onPress={() => router.push('/achievements')}
        >
          <View style={[styles.statsLinkIcon, { backgroundColor: `${colors.gold}20` }]}>
            <Ionicons name="trophy" size={20} color={colors.gold} />
          </View>
          <Text style={styles.statsLinkText}>Achievements</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderMainTabs()}

      {mainTab === 'my_events' && renderMyEvents()}
      {mainTab === 'stats' && renderStatsPreview()}
      {mainTab === 'live' && renderLiveSports()}

      {/* FAB - only show on My Events */}
      {mainTab === 'my_events' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/event/manual')}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Main tabs
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xs,
  },
  mainTabActive: {
    backgroundColor: colors.primary,
  },
  mainTabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  mainTabTextActive: {
    color: colors.white,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  // Live sports section
  liveContainer: {
    flex: 1,
  },
  liveContent: {
    padding: spacing.lg,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  liveTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  liveSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  filterBadge: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  sportsGrid: {
    gap: spacing.sm,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  sportArrow: {
    marginLeft: 'auto',
  },
  // Search
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.xs,
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
  // Empty filter state
  emptyFilter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyFilterText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  showAllButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  showAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
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
    paddingBottom: spacing.xl,
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  filterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterItemName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalDoneText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  // Stats tab styles
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    padding: spacing.lg,
  },
  statsHeader: {
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statsSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStatValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  quickStatLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewFullStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  viewFullStatsText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  statsLinksContainer: {
    gap: spacing.sm,
  },
  statsLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  statsLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLinkText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});
