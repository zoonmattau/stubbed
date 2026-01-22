import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge, Footer } from '@/components/ui';
import { ProgressBar, InteractiveBarChart, BarChartItem, DonutChart, DonutSegment } from '@/components/stats';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSportColor } from '@/constants/sports';
import type { AttendedEventWithDetails } from '@/types';

const { width } = Dimensions.get('window');

type FilterType = 'wins' | 'draws' | 'losses' | 'month' | 'sport' | 'team' | 'venue' | null;

export default function StatsScreen() {
  const { user } = useAuthStore();
  const {
    fetchStats,
    isLoading,
  } = useStatsStore();
  const { attendedEvents, fetchAttendedEvents } = useEventsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
      // Also fetch attended events if not already loaded
      if (attendedEvents.length === 0) {
        fetchAttendedEvents(user.id);
      }
    }
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchStats(user.id);
    setRefreshing(false);
  };

  // Calculate win/loss/draw stats from attended events using the result field
  const winLossStats = React.useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    attendedEvents.forEach((attended) => {
      // Use the result field which properly tracks based on supported team
      if (attended.result === 'win') {
        wins++;
      } else if (attended.result === 'loss') {
        losses++;
      } else if (attended.result === 'draw') {
        draws++;
      }
    });

    const total = wins + losses + draws;
    return { wins, losses, draws, total };
  }, [attendedEvents]);

  // Calculate local stats from attendedEvents (handles both FK and text fields)
  const localStats = useMemo(() => {
    const uniqueSports = new Set<string>();
    const uniqueTeams = new Set<string>();
    const uniqueVenues = new Set<string>();

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      // Sport - use FK or text field
      const sportName = event.sport?.name || event.sport_name;
      if (sportName) uniqueSports.add(sportName.toLowerCase());

      // Teams - use FK or text field
      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) uniqueTeams.add(homeTeam.toLowerCase());
      if (awayTeam) uniqueTeams.add(awayTeam.toLowerCase());

      // Venue - use FK or text field
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

  // Calculate sport breakdown from attendedEvents
  const localSportBreakdown = useMemo(() => {
    const sportCounts: Record<string, { name: string; count: number }> = {};

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const sportName = event.sport?.name || event.sport_name;
      if (sportName) {
        const key = sportName.toLowerCase();
        if (!sportCounts[key]) {
          sportCounts[key] = { name: sportName, count: 0 };
        }
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

  // Calculate team breakdown from attendedEvents
  const localTeamBreakdown = useMemo(() => {
    const teamCounts: Record<string, { name: string; count: number }> = {};

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;

      if (homeTeam) {
        const key = homeTeam.toLowerCase();
        if (!teamCounts[key]) {
          teamCounts[key] = { name: homeTeam, count: 0 };
        }
        teamCounts[key].count++;
      }

      if (awayTeam) {
        const key = awayTeam.toLowerCase();
        if (!teamCounts[key]) {
          teamCounts[key] = { name: awayTeam, count: 0 };
        }
        teamCounts[key].count++;
      }
    });

    return Object.entries(teamCounts)
      .map(([key, data]) => ({
        teamId: key,
        teamName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [attendedEvents]);

  // Calculate venue breakdown from attendedEvents
  const localVenueBreakdown = useMemo(() => {
    const venueCounts: Record<string, { name: string; count: number }> = {};

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const venue = event.venue?.name || event.venue_name;

      if (venue) {
        const key = venue.toLowerCase();
        if (!venueCounts[key]) {
          venueCounts[key] = { name: venue, count: 0 };
        }
        venueCounts[key].count++;
      }
    });

    return Object.entries(venueCounts)
      .map(([key, data]) => ({
        venueId: key,
        venueName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [attendedEvents]);

  // Get events filtered by result type using the result field
  const getEventsByResult = (type: 'wins' | 'draws' | 'losses'): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      if (type === 'wins') return attended.result === 'win';
      if (type === 'losses') return attended.result === 'loss';
      if (type === 'draws') return attended.result === 'draw';
      return false;
    });
  };

  // Helper to get the supported team name for an event
  const getSupportedTeamName = (attended: AttendedEventWithDetails): string | null => {
    if (!attended.supported_team || attended.supported_team === 'neutral') return null;
    const event = attended.event;
    if (!event) return null;

    if (attended.supported_team === 'home') {
      return event.home_team?.short_name || event.home_team?.name || event.home_team_name || 'Home';
    } else {
      return event.away_team?.short_name || event.away_team?.name || event.away_team_name || 'Away';
    }
  };

  // Get events filtered by month
  const getEventsByMonth = (monthKey: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event?.event_date) return false;
      const date = new Date(event.event_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === monthKey;
    });
  };

  // Get filtered events based on current filter
  // Get events filtered by sport (checks both FK and text field)
  const getEventsBySport = (sportName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const eventSport = event.sport?.name || event.sport_name || '';
      return eventSport.toLowerCase() === sportName.toLowerCase();
    });
  };

  // Get events filtered by team (checks both FK and text field)
  const getEventsByTeam = (teamName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const homeTeam = (event.home_team?.name || event.home_team_name || '').toLowerCase();
      const awayTeam = (event.away_team?.name || event.away_team_name || '').toLowerCase();
      return homeTeam === teamName.toLowerCase() || awayTeam === teamName.toLowerCase();
    });
  };

  // Get events filtered by venue (checks both FK and text field)
  const getEventsByVenue = (venueName: string): AttendedEventWithDetails[] => {
    return attendedEvents.filter((attended) => {
      const event = attended.event;
      if (!event) return false;
      const eventVenue = event.venue?.name || event.venue_name || '';
      return eventVenue.toLowerCase() === venueName.toLowerCase();
    });
  };

  const filteredEvents = useMemo(() => {
    if (!filterType || !filterValue) return [];
    if (filterType === 'month') {
      return getEventsByMonth(filterValue);
    }
    if (filterType === 'sport') {
      return getEventsBySport(filterValue);
    }
    if (filterType === 'team') {
      return getEventsByTeam(filterValue);
    }
    if (filterType === 'venue') {
      return getEventsByVenue(filterValue);
    }
    return getEventsByResult(filterType as 'wins' | 'draws' | 'losses');
  }, [filterType, filterValue, attendedEvents]);

  // Get modal title
  const getModalTitle = () => {
    if (filterType === 'wins') return 'Wins';
    if (filterType === 'draws') return 'Draws';
    if (filterType === 'losses') return 'Losses';
    if (filterType === 'sport') return filterValue || 'Sport';
    if (filterType === 'team') return filterValue || 'Team';
    if (filterType === 'venue') return filterValue || 'Venue';
    if (filterType === 'month' && filterValue) {
      const [year, month] = filterValue.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    }
    return 'Events';
  };

  const openFilter = (type: FilterType, value: string) => {
    setFilterType(type);
    setFilterValue(value);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFilterType(null);
    setFilterValue(null);
  };

  // Transform breakdowns into chart data (using local breakdowns)
  const sportChartData: BarChartItem[] = useMemo(() => {
    return localSportBreakdown.map((sport) => ({
      id: sport.sportId || sport.sportName,
      label: sport.sportName,
      value: sport.count,
      color: sport.color || colors.primary,
      icon: 'basketball' as const,
    }));
  }, [localSportBreakdown]);

  // Donut chart data for sports
  const sportDonutData: DonutSegment[] = useMemo(() => {
    return localSportBreakdown.map((sport) => ({
      id: sport.sportId || sport.sportName,
      label: sport.sportName,
      value: sport.count,
      color: sport.color || colors.primary,
    }));
  }, [localSportBreakdown]);

  // Win/Loss chart data
  const winLossChartData: DonutSegment[] = useMemo(() => {
    const data: DonutSegment[] = [];
    if (winLossStats.wins > 0) {
      data.push({ id: 'wins', label: 'Wins', value: winLossStats.wins, color: colors.success });
    }
    if (winLossStats.draws > 0) {
      data.push({ id: 'draws', label: 'Draws', value: winLossStats.draws, color: colors.textSecondary });
    }
    if (winLossStats.losses > 0) {
      data.push({ id: 'losses', label: 'Losses', value: winLossStats.losses, color: colors.error });
    }
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

  // Monthly events breakdown
  const monthlyChartData: BarChartItem[] = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    const monthOrder: string[] = [];

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event?.event_date) return;

      const date = new Date(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });

      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = 0;
        monthOrder.push(monthKey);
      }
      monthCounts[monthKey]++;
    });

    // Sort by date (most recent first)
    monthOrder.sort((a, b) => b.localeCompare(a));

    return monthOrder.map((key) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });

      return {
        id: key,
        label,
        value: monthCounts[key],
        color: colors.primary,
        icon: 'calendar' as const,
      };
    });
  }, [attendedEvents]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Win Record</Text>
        <Text style={styles.sectionSubtitle}>Your team's performance when you're in the crowd</Text>
        <Card>
          <View style={styles.streakContainer}>
            <TouchableOpacity
              style={styles.streakItem}
              onPress={() => winLossStats.wins > 0 && openFilter('wins', 'wins')}
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
              onPress={() => winLossStats.draws > 0 && openFilter('draws', 'draws')}
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
              onPress={() => winLossStats.losses > 0 && openFilter('losses', 'losses')}
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

      {/* Win/Loss Record - Visual Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Results</Text>
        <Text style={styles.sectionSubtitle}>Win/loss/draw breakdown of games you've attended</Text>
        <Card>
          {winLossStats.total > 0 ? (
            <DonutChart
              data={winLossChartData}
              centerValue={winLossStats.total}
              centerLabel="games with results"
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>Add game scores to see win/loss stats</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Sports Breakdown - Visual Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events by Sport</Text>
        <Text style={styles.sectionSubtitle}>Tap a sport to see those events</Text>
        <Card>
          {sportDonutData.length > 0 ? (
            <DonutChart
              data={sportDonutData}
              centerValue={localStats.totalEvents}
              centerLabel="total events"
              onSegmentPress={(segment) => openFilter('sport', segment.label)}
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No events recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Teams - Clickable */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/stats/teams')}
        >
          <View>
            <Text style={styles.sectionTitle}>Teams You've Seen</Text>
            <Text style={styles.sectionSubtitle}>Tap to see detailed breakdown with win records</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card>
          {teamChartData.length > 0 ? (
            <InteractiveBarChart
              data={teamChartData}
              maxItems={5}
              onItemPress={(item) => openFilter('team', item.label)}
              onSeeAllPress={() => router.push('/stats/teams')}
              showSeeAll={localTeamBreakdown.length > 5}
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No teams recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Venues - Clickable */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/stats/venues')}
        >
          <View>
            <Text style={styles.sectionTitle}>Venues You've Visited</Text>
            <Text style={styles.sectionSubtitle}>Tap to see all venues and details</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card>
          {venueChartData.length > 0 ? (
            <InteractiveBarChart
              data={venueChartData}
              maxItems={5}
              onItemPress={(item) => openFilter('venue', item.label)}
              onSeeAllPress={() => router.push('/stats/venues')}
              showSeeAll={localVenueBreakdown.length > 5}
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No venues recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      {/* World Map - Places You've Been */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/stats/map')}
        >
          <View>
            <Text style={styles.sectionTitle}>Places You've Been</Text>
            <Text style={styles.sectionSubtitle}>Explore your events on a world map</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Card onPress={() => router.push('/stats/map')}>
          <View style={styles.mapPreview}>
            <Ionicons name="globe-outline" size={32} color={colors.primary} />
            <View style={styles.mapPreviewContent}>
              <Text style={styles.mapPreviewText}>View your events by location</Text>
              <Text style={styles.mapPreviewStatText}>
                {new Set(attendedEvents.map(e => e.event?.venue?.name || e.event?.venue_name).filter(Boolean)).size} venues visited
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>
      </View>

      {/* Monthly Events Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events by Month</Text>
        <Text style={styles.sectionSubtitle}>Tap a month to see events</Text>
        <Card>
          {monthlyChartData.length > 0 ? (
            <InteractiveBarChart
              data={monthlyChartData}
              maxItems={12}
              showSeeAll={monthlyChartData.length > 12}
              onItemPress={(item) => openFilter('month', item.id)}
              compact
            />
          ) : (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyBreakdownText}>No events recorded yet</Text>
            </View>
          )}
        </Card>
      </View>

      <Footer />

      {/* Events Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
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
                  style={styles.modalEventCard}
                  onPress={() => {
                    closeModal();
                    router.push(`/event/${item.event_id}`);
                  }}
                >
                  <View style={[styles.modalEventIndicator, { backgroundColor: sportColor }]} />
                  <View style={styles.modalEventContent}>
                    <View style={styles.modalEventTop}>
                      <Badge label={sportName} size="sm" color={sportColor} />
                      {event.competition && (
                        <Text style={styles.modalEventLeague} numberOfLines={1}>{event.competition}</Text>
                      )}
                    </View>
                    <View style={styles.modalTeamsRow}>
                      <Text style={[
                        styles.modalEventTeam,
                        item.supported_team === 'home' && styles.modalEventTeamSupported
                      ]} numberOfLines={1}>
                        {homeTeamName}
                        {item.supported_team === 'home' && ' ★'}
                      </Text>
                      <Text style={styles.modalVsText}> vs </Text>
                      <Text style={[
                        styles.modalEventTeam,
                        item.supported_team === 'away' && styles.modalEventTeamSupported
                      ]} numberOfLines={1}>
                        {awayTeamName}
                        {item.supported_team === 'away' && ' ★'}
                      </Text>
                    </View>
                    {item.supported_team && item.supported_team !== 'neutral' && (
                      <Text style={styles.supportedTeamLabel}>
                        Supporting: {getSupportedTeamName(item)}
                      </Text>
                    )}
                    {venueName && (
                      <View style={styles.modalVenueRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.modalVenueText} numberOfLines={1}>{venueName}</Text>
                      </View>
                    )}
                    <View style={styles.modalEventBottom}>
                      {(event.home_score !== null && event.away_score !== null) && (
                        <Text style={styles.modalEventScore}>{event.home_score} - {event.away_score}</Text>
                      )}
                      <Text style={styles.modalEventDate}>
                        {new Date(event.event_date).toLocaleDateString('en-AU', {
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
                <Text style={styles.modalEmptyText}>No events found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  // Hero Card
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyBreakdown: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyBreakdownText: {
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
  modalEventLeague: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  modalEventTeams: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  modalEventTeam: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  modalEventTeamSupported: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  modalVsText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  supportedTeamLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  modalVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modalVenueText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
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
