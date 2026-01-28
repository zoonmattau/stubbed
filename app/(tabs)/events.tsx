import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventList } from '@/components/events';
import { Card, Badge } from '@/components/ui';
import { InteractiveBarChart, BarChartItem, DonutChart, DonutSegment } from '@/components/stats';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { sortByDate, parseLocalDate } from '@/utils/dates';
import { getSportColor } from '@/constants/sports';
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

// Sorted alphabetically - A-League is inside Soccer, not separate
const LIVE_SPORTS: SportCategory[] = [
  { id: 'afl', name: 'AFL', icon: 'football', color: '#3b82f6', route: '/sports/afl' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball', color: '#f97316', route: '/sports/basketball' },
  { id: 'cricket', name: 'Cricket', icon: 'baseball', color: '#22c55e', route: '/sports/cricket' },
  { id: 'golf', name: 'Golf', icon: 'golf', color: '#10b981', route: '/sports/golf' },
  { id: 'hockey', name: 'Ice Hockey', icon: 'snow', color: '#0ea5e9', route: '/sports/hockey' },
  { id: 'motorsport', name: 'Motorsport', icon: 'car-sport', color: '#ef4444', route: '/sports/motorsport' },
  { id: 'netball', name: 'Netball', icon: 'people', color: '#ec4899', route: '/sports/netball' },
  { id: 'nrl', name: 'NRL', icon: 'football-outline', color: '#8b5cf6', route: '/sports/nrl' },
  { id: 'rugby', name: 'Rugby Union', icon: 'american-football', color: '#f59e0b', route: '/sports/rugby' },
  { id: 'soccer', name: 'Soccer', icon: 'football', color: '#16a34a', route: '/sports/soccer' },
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

  // Stats tab state
  const [statsFilterType, setStatsFilterType] = useState<'wins' | 'draws' | 'losses' | 'month' | 'sport' | 'team' | 'venue' | null>(null);
  const [statsFilterValue, setStatsFilterValue] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const isMounted = useIsMounted();

  // Calculate win/loss/draw stats
  const winLossStats = useMemo(() => {
    let wins = 0, losses = 0, draws = 0;
    attendedEvents.forEach((attended) => {
      if (attended.result === 'win') wins++;
      else if (attended.result === 'loss') losses++;
      else if (attended.result === 'draw') draws++;
    });
    return { wins, losses, draws, total: wins + losses + draws };
  }, [attendedEvents]);

  // Calculate local stats
  const localStats = useMemo(() => {
    const uniqueSports = new Set<string>();
    const uniqueTeams = new Set<string>();
    const uniqueVenues = new Set<string>();

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;
      const sportName = event.sport?.name || event.sport_name;
      if (sportName) uniqueSports.add(sportName.toLowerCase());
      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) uniqueTeams.add(homeTeam.toLowerCase());
      if (awayTeam) uniqueTeams.add(awayTeam.toLowerCase());
      const venue = event.venue?.name || event.venue_name;
      if (venue) uniqueVenues.add(venue.toLowerCase());
    });

    return {
      totalEvents: attendedEvents.length,
      totalSports: uniqueSports.size,
      totalTeams: uniqueTeams.size,
      totalVenues: uniqueVenues.size,
    };
  }, [attendedEvents]);

  // Sport breakdown
  const localSportBreakdown = useMemo(() => {
    const sportCounts: Record<string, { name: string; count: number }> = {};
    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;
      const sportName = event.sport?.name || event.sport_name;
      if (sportName) {
        const key = sportName.toLowerCase();
        if (!sportCounts[key]) sportCounts[key] = { name: sportName, count: 0 };
        sportCounts[key].count++;
      }
    });
    return Object.entries(sportCounts)
      .map(([key, data]) => ({
        sportId: key,
        sportName: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        count: data.count,
        color: getSportColor(key),
      }))
      .sort((a, b) => b.count - a.count);
  }, [attendedEvents]);

  // Team breakdown
  const localTeamBreakdown = useMemo(() => {
    const teamCounts: Record<string, { name: string; count: number }> = {};
    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;
      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) {
        const key = homeTeam.toLowerCase();
        if (!teamCounts[key]) teamCounts[key] = { name: homeTeam, count: 0 };
        teamCounts[key].count++;
      }
      if (awayTeam) {
        const key = awayTeam.toLowerCase();
        if (!teamCounts[key]) teamCounts[key] = { name: awayTeam, count: 0 };
        teamCounts[key].count++;
      }
    });
    return Object.entries(teamCounts)
      .map(([key, data]) => ({ teamId: key, teamName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count);
  }, [attendedEvents]);

  // Venue breakdown
  const localVenueBreakdown = useMemo(() => {
    const venueCounts: Record<string, { name: string; count: number }> = {};
    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;
      const venue = event.venue?.name || event.venue_name;
      if (venue) {
        const key = venue.toLowerCase();
        if (!venueCounts[key]) venueCounts[key] = { name: venue, count: 0 };
        venueCounts[key].count++;
      }
    });
    return Object.entries(venueCounts)
      .map(([key, data]) => ({ venueId: key, venueName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count);
  }, [attendedEvents]);

  // Chart data
  const sportDonutData: DonutSegment[] = useMemo(() => {
    return localSportBreakdown.map((sport) => ({
      id: sport.sportId || sport.sportName,
      label: sport.sportName,
      value: sport.count,
      color: sport.color || colors.primary,
    }));
  }, [localSportBreakdown]);

  const winLossChartData: DonutSegment[] = useMemo(() => {
    const data: DonutSegment[] = [];
    if (winLossStats.wins > 0) data.push({ id: 'wins', label: 'Wins', value: winLossStats.wins, color: colors.success });
    if (winLossStats.draws > 0) data.push({ id: 'draws', label: 'Draws', value: winLossStats.draws, color: colors.textSecondary });
    if (winLossStats.losses > 0) data.push({ id: 'losses', label: 'Losses', value: winLossStats.losses, color: colors.error });
    return data;
  }, [winLossStats]);

  const teamChartData: BarChartItem[] = useMemo(() => {
    return localTeamBreakdown.map((team) => ({
      id: team.teamId || team.teamName,
      label: team.teamName,
      value: team.count,
      color: colors.info,
      icon: 'shield' as const,
      subLabel: `${team.count} games`,
    }));
  }, [localTeamBreakdown]);

  const venueChartData: BarChartItem[] = useMemo(() => {
    return localVenueBreakdown.map((venue) => ({
      id: venue.venueId || venue.venueName,
      label: venue.venueName,
      value: venue.count,
      color: colors.success,
      icon: 'location' as const,
      subLabel: `${venue.count} visits`,
    }));
  }, [localVenueBreakdown]);

  const monthlyChartData: BarChartItem[] = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    const monthOrder: string[] = [];
    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event?.event_date) return;
      const date = parseLocalDate(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = 0;
        monthOrder.push(monthKey);
      }
      monthCounts[monthKey]++;
    });
    monthOrder.sort((a, b) => b.localeCompare(a));
    return monthOrder.map((key) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
      return { id: key, label, value: monthCounts[key], color: colors.primary, icon: 'calendar' as const };
    });
  }, [attendedEvents]);

  // Stats filter helpers
  const getEventsByResult = (type: 'wins' | 'draws' | 'losses'): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      if (type === 'wins') return attended.result === 'win';
      if (type === 'losses') return attended.result === 'loss';
      if (type === 'draws') return attended.result === 'draw';
      return false;
    });
  };

  const getEventsByMonth = (monthKey: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event?.event_date) return false;
      const date = parseLocalDate(event.event_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === monthKey;
    });
  };

  const getEventsBySport = (sportName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const eventSport = event.sport?.name || event.sport_name || '';
      return eventSport.toLowerCase() === sportName.toLowerCase();
    });
  };

  const getEventsByTeam = (teamName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const homeTeam = (event.home_team?.name || event.home_team_name || '').toLowerCase();
      const awayTeam = (event.away_team?.name || event.away_team_name || '').toLowerCase();
      return homeTeam === teamName.toLowerCase() || awayTeam === teamName.toLowerCase();
    });
  };

  const getEventsByVenue = (venueName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const eventVenue = event.venue?.name || event.venue_name || '';
      return eventVenue.toLowerCase() === venueName.toLowerCase();
    });
  };

  const statsFilteredEvents = useMemo(() => {
    if (!statsFilterType || !statsFilterValue) return [];
    if (statsFilterType === 'month') return getEventsByMonth(statsFilterValue);
    if (statsFilterType === 'sport') return getEventsBySport(statsFilterValue);
    if (statsFilterType === 'team') return getEventsByTeam(statsFilterValue);
    if (statsFilterType === 'venue') return getEventsByVenue(statsFilterValue);
    return getEventsByResult(statsFilterType as 'wins' | 'draws' | 'losses');
  }, [statsFilterType, statsFilterValue, attendedEvents]);

  const getStatsModalTitle = () => {
    if (statsFilterType === 'wins') return 'Wins';
    if (statsFilterType === 'draws') return 'Draws';
    if (statsFilterType === 'losses') return 'Losses';
    if (statsFilterType === 'sport') return statsFilterValue || 'Sport';
    if (statsFilterType === 'team') return statsFilterValue || 'Team';
    if (statsFilterType === 'venue') return statsFilterValue || 'Venue';
    if (statsFilterType === 'month' && statsFilterValue) {
      const [year, month] = statsFilterValue.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    }
    return 'Events';
  };

  const openStatsFilter = (type: typeof statsFilterType, value: string) => {
    setStatsFilterType(type);
    setStatsFilterValue(value);
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setStatsFilterType(null);
    setStatsFilterValue(null);
  };

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

  const renderStats = () => (
    <ScrollView
      style={styles.statsContainer}
      contentContainerStyle={styles.statsContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Hero Stats Card */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark || '#1a365d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroMain}>
          <Text style={styles.heroNumber}>{localStats.totalEvents}</Text>
          <Text style={styles.heroLabel}>Events Attended</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroSecondary}>
          <View style={styles.heroStatRow}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="basketball" size={16} color={colors.sportBasketball} />
            </View>
            <Text style={styles.heroStatValue}>{localStats.totalSports}</Text>
            <Text style={styles.heroStatLabel}>sports</Text>
          </View>
          <View style={styles.heroStatRow}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="people" size={16} color={colors.info} />
            </View>
            <Text style={styles.heroStatValue}>{localStats.totalTeams}</Text>
            <Text style={styles.heroStatLabel}>teams</Text>
          </View>
          <View style={styles.heroStatRow}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="location" size={16} color={colors.success} />
            </View>
            <Text style={styles.heroStatValue}>{localStats.totalVenues}</Text>
            <Text style={styles.heroStatLabel}>venues</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Win Record */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Win Record</Text>
        <Text style={styles.statsSectionSubtitle}>Your team's performance when you're in the crowd</Text>
        <Card>
          <View style={styles.streakContainer}>
            <TouchableOpacity
              style={styles.streakItem}
              onPress={() => winLossStats.wins > 0 && openStatsFilter('wins', 'wins')}
              activeOpacity={winLossStats.wins > 0 ? 0.7 : 1}
            >
              <View style={[styles.streakIcon, { backgroundColor: `${colors.success}20` }]}>
                <Ionicons name="trophy" size={24} color={colors.success} />
              </View>
              <View>
                <Text style={styles.streakValue}>{winLossStats.wins}</Text>
                <Text style={styles.streakLabel}>Wins</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.streakDivider} />
            <TouchableOpacity
              style={styles.streakItem}
              onPress={() => winLossStats.draws > 0 && openStatsFilter('draws', 'draws')}
              activeOpacity={winLossStats.draws > 0 ? 0.7 : 1}
            >
              <View style={[styles.streakIcon, { backgroundColor: `${colors.textSecondary}20` }]}>
                <Ionicons name="remove" size={24} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.streakValue}>{winLossStats.draws}</Text>
                <Text style={styles.streakLabel}>Draws</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.streakDivider} />
            <TouchableOpacity
              style={styles.streakItem}
              onPress={() => winLossStats.losses > 0 && openStatsFilter('losses', 'losses')}
              activeOpacity={winLossStats.losses > 0 ? 0.7 : 1}
            >
              <View style={[styles.streakIcon, { backgroundColor: `${colors.error}20` }]}>
                <Ionicons name="close" size={24} color={colors.error} />
              </View>
              <View>
                <Text style={styles.streakValue}>{winLossStats.losses}</Text>
                <Text style={styles.streakLabel}>Losses</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* Game Results Chart */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Game Results</Text>
        <Text style={styles.statsSectionSubtitle}>Win/loss/draw breakdown</Text>
        <Card>
          {winLossStats.total > 0 ? (
            <DonutChart
              data={winLossChartData}
              centerValue={winLossStats.total}
              centerLabel="games with results"
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>Add game scores to see win/loss stats</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Events by Sport */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Events by Sport</Text>
        <Text style={styles.statsSectionSubtitle}>Tap a sport to see those events</Text>
        <Card>
          {sportDonutData.length > 0 ? (
            <DonutChart
              data={sportDonutData}
              centerValue={localStats.totalEvents}
              centerLabel="total events"
              onSegmentPress={(segment) => openStatsFilter('sport', segment.label)}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No events recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Teams */}
      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statsSectionHeader} onPress={() => router.push('/stats/teams')}>
          <View>
            <Text style={styles.statsSectionTitle}>Teams You've Seen</Text>
            <Text style={styles.statsSectionSubtitle}>Tap to see detailed breakdown</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card>
          {teamChartData.length > 0 ? (
            <InteractiveBarChart
              data={teamChartData}
              maxItems={5}
              onItemPress={(item) => openStatsFilter('team', item.label)}
              onSeeAllPress={() => router.push('/stats/teams')}
              showSeeAll={localTeamBreakdown.length > 5}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No teams recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Venues */}
      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statsSectionHeader} onPress={() => router.push('/stats/venues')}>
          <View>
            <Text style={styles.statsSectionTitle}>Venues You've Visited</Text>
            <Text style={styles.statsSectionSubtitle}>Tap to see all venues</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card>
          {venueChartData.length > 0 ? (
            <InteractiveBarChart
              data={venueChartData}
              maxItems={5}
              onItemPress={(item) => openStatsFilter('venue', item.label)}
              onSeeAllPress={() => router.push('/stats/venues')}
              showSeeAll={localVenueBreakdown.length > 5}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No venues recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* World Map */}
      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statsSectionHeader} onPress={() => router.push('/stats/map')}>
          <View>
            <Text style={styles.statsSectionTitle}>Places You've Been</Text>
            <Text style={styles.statsSectionSubtitle}>Explore your events on a map</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card onPress={() => router.push('/stats/map')}>
          <View style={styles.mapPreview}>
            <Ionicons name="globe-outline" size={32} color={colors.primary} />
            <View style={styles.mapPreviewContent}>
              <Text style={styles.mapPreviewText}>View your events by location</Text>
              <Text style={styles.mapPreviewStatText}>{localStats.totalVenues} venues visited</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>
      </View>

      {/* Monthly Events */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Events by Month</Text>
        <Text style={styles.statsSectionSubtitle}>Tap a month to see events</Text>
        <Card>
          {monthlyChartData.length > 0 ? (
            <InteractiveBarChart
              data={monthlyChartData}
              maxItems={12}
              showSeeAll={monthlyChartData.length > 12}
              onItemPress={(item) => openStatsFilter('month', item.id)}
              compact
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No events recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Achievements Link */}
      <TouchableOpacity style={styles.achievementsLink} onPress={() => router.push('/achievements')}>
        <View style={[styles.statsLinkIcon, { backgroundColor: `${colors.gold}20` }]}>
          <Ionicons name="trophy" size={24} color={colors.gold} />
        </View>
        <View style={styles.achievementsLinkContent}>
          <Text style={styles.achievementsLinkTitle}>View Achievements</Text>
          <Text style={styles.achievementsLinkSubtitle}>Track your progress and unlock badges</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStatsEventsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeStatsModal}
    >
      <View style={styles.statsModalContainer}>
        <View style={styles.statsModalHeader}>
          <Text style={styles.statsModalTitle}>{getStatsModalTitle()}</Text>
          <TouchableOpacity onPress={closeStatsModal} style={styles.statsModalClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.statsModalSubtitle}>
          {statsFilteredEvents.length} event{statsFilteredEvents.length !== 1 ? 's' : ''}
        </Text>
        <FlatList
          data={statsFilteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.statsModalList}
          renderItem={({ item }) => {
            const event = item.event;
            if (!event) return null;
            const sportName = event.sport?.name || event.sport_name || 'Sport';
            const sportColor = getSportColor(sportName.toLowerCase());
            const homeTeamName = event.home_team?.short_name || event.home_team?.name || event.home_team_name || 'Home';
            const awayTeamName = event.away_team?.short_name || event.away_team?.name || event.away_team_name || 'Away';
            const venueName = event.venue?.name || event.venue_name;
            return (
              <TouchableOpacity
                style={styles.statsModalEventCard}
                onPress={() => {
                  closeStatsModal();
                  router.push(`/event/${item.event_id}`);
                }}
              >
                <View style={[styles.statsModalEventIndicator, { backgroundColor: sportColor }]} />
                <View style={styles.statsModalEventContent}>
                  <View style={styles.statsModalEventTop}>
                    <Badge label={sportName} size="sm" color={sportColor} />
                    {event.competition && (
                      <Text style={styles.statsModalEventLeague} numberOfLines={1}>{event.competition}</Text>
                    )}
                  </View>
                  <Text style={styles.statsModalEventTeams} numberOfLines={1}>
                    {homeTeamName} vs {awayTeamName}
                  </Text>
                  {venueName && (
                    <View style={styles.statsModalVenueRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.statsModalVenueText} numberOfLines={1}>{venueName}</Text>
                    </View>
                  )}
                  <View style={styles.statsModalEventBottom}>
                    {(event.home_score !== null && event.away_score !== null) && (
                      <Text style={styles.statsModalEventScore}>{event.home_score} - {event.away_score}</Text>
                    )}
                    <Text style={styles.statsModalEventDate}>
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
            <View style={styles.statsModalEmpty}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={styles.statsModalEmptyText}>No events found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderMainTabs()}

      {mainTab === 'my_events' && renderMyEvents()}
      {mainTab === 'stats' && renderStats()}
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
      {renderStatsEventsModal()}
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
    paddingBottom: spacing['3xl'],
  },
  heroCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroMain: {
    flex: 1,
    justifyContent: 'center',
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.white,
    lineHeight: 52,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.lg,
  },
  heroSecondary: {
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    minWidth: 20,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statsSectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  streakLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  emptyChart: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  mapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  mapPreviewContent: {
    flex: 1,
  },
  mapPreviewText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  mapPreviewStatText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  achievementsLinkContent: {
    flex: 1,
  },
  achievementsLinkTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  achievementsLinkSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Stats Modal styles
  statsModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statsModalClose: {
    padding: spacing.sm,
  },
  statsModalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  statsModalList: {
    padding: spacing.lg,
  },
  statsModalEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  statsModalEventIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  statsModalEventContent: {
    flex: 1,
    padding: spacing.md,
  },
  statsModalEventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statsModalEventLeague: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  statsModalEventTeams: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statsModalVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  statsModalVenueText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
  },
  statsModalEventBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statsModalEventScore: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statsModalEventDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statsModalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  statsModalEmptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
