import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore, TrendingEvent } from '@/stores/exploreStore';
import { ReviewCard, FeedToggle, SportFilter, FollowButton } from '@/components/explore';
import { useFollows } from '@/hooks/useFollows';
import { Avatar, Badge, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSportIcon, getSportColor, SPORTS } from '@/constants/sports';
import { parseLocalDate } from '@/utils/dates';
import { parseTennisScore } from '@/utils/scores';
import { ActivityItem } from '@/components/social/ActivityItem';
import type { ReviewWithDetails, UserSuggestion, ActivityFeed, Profile } from '@/types';

function getSportDisplayName(sportCode: string | null | undefined): string {
  if (!sportCode) return 'Sport';
  const sport = SPORTS.find(s => s.id.toLowerCase() === sportCode.toLowerCase());
  if (sport) return sport.name;
  return sportCode.charAt(0).toUpperCase() + sportCode.slice(1);
}

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

type SortField = 'events' | 'xp' | 'followers' | 'reviews';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_events: number;
  total_points: number;
  followers_count: number;
  reviews_count: number;
}

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const {
    feedType,
    trendingEvents,
    followingReviews,
    selectedSportId,
    sports,
    isLoadingTrending,
    isLoadingFollowing,
    hasMoreTrending,
    hasMoreFollowing,
    error,
    setFeedType,
    setSportFilter,
    fetchTrendingEvents,
    fetchFollowingFeed,
    fetchSports,
  } = useExploreStore();

  const [refreshing, setRefreshing] = useState(false);

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState<UserSuggestion[]>([]);
  const { getSuggestedUsers } = useFollows();

  // Recent activity & hot reviews state
  const [recentActivity, setRecentActivity] = useState<(ActivityFeed & { profile?: Profile })[]>([]);
  const [hotReviews, setHotReviews] = useState<ReviewWithDetails[]>([]);

  // Live sports state
  const [hiddenSports, setHiddenSports] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('events');

  // Get current feed based on type
  const reviews = followingReviews; // Only used for following feed now
  const isLoading = feedType === 'trending' ? isLoadingTrending : isLoadingFollowing;
  const hasMore = feedType === 'trending' ? hasMoreTrending : hasMoreFollowing;

  // Initial fetch - also retry on error
  useFocusEffect(
    useCallback(() => {
      fetchSports();
      if (feedType === 'trending') {
        // Fetch if no data or if there was an error
        if (trendingEvents.length === 0 || error) {
          fetchTrendingEvents(true);
        }
        // Fetch suggested users for Discover Fans section
        getSuggestedUsers(6).then(setSuggestedUsers);
        // Fetch recent activity
        supabase
          .from('activity_feed')
          .select('*, profile:profiles(*)')
          .order('created_at', { ascending: false })
          .limit(8)
          .then(({ data, error: actErr }) => {
            if (actErr) console.error('[Explore] Activity fetch error:', actErr);
            if (data) setRecentActivity(data as any);
          });
        // Fetch hot reviews
        // @ts-expect-error - Supabase RPC type inference issue
        supabase.rpc('get_trending_reviews', { p_limit: 5, p_offset: 0 }).then(({ data, error: revErr }) => {
          if (revErr) console.error('[Explore] Hot reviews fetch error:', revErr);
          if (data) setHotReviews(data as ReviewWithDetails[]);
        });
      } else if (feedType === 'following' && user?.id) {
        if (followingReviews.length === 0 || error) {
          fetchFollowingFeed(user.id, true);
        }
      }
    }, [feedType, user?.id, error])
  );

  // Load saved sports filter preferences
  useEffect(() => {
    const loadSportsFilter = async () => {
      try {
        const saved = await AsyncStorage.getItem(SPORTS_FILTER_KEY);
        if (saved) {
          setHiddenSports(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error('Error loading sports filter:', error);
      }
    };
    loadSportsFilter();
  }, []);

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

  // Community stats computed from trending events
  const communityStats = useMemo(() => {
    if (trendingEvents.length === 0) return null;
    const totalAttendance = trendingEvents.reduce((sum, e) => sum + (e.attendance_count || 0), 0);
    const uniqueSports = new Set(trendingEvents.map(e => e.sport_name).filter(Boolean)).size;
    return { totalAttendance, uniqueSports, trendingCount: trendingEvents.length };
  }, [trendingEvents]);

  // Fetch leaderboard when tab or sort changes
  useEffect(() => {
    if (feedType === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [feedType, sortField]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: 50 });

      if (error) {
        console.error('[Explore] Leaderboard RPC error:', error);
        throw error;
      }

      const entries: LeaderboardEntry[] = ((data || []) as any[]).map((row: any) => ({
        user_id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        total_events: row.total_events || 0,
        total_points: row.total_xp || 0,
        followers_count: row.followers_count || 0,
        reviews_count: row.reviews_count || 0,
      }));

      // Re-sort by selected field
      entries.sort((a, b) => {
        switch (sortField) {
          case 'events': return b.total_events - a.total_events;
          case 'xp': return b.total_points - a.total_points;
          case 'followers': return b.followers_count - a.followers_count;
          case 'reviews': return b.reviews_count - a.reviews_count;
          default: return 0;
        }
      });

      setLeaderboard(entries);
    } catch (err) {
      console.error('[Explore] Leaderboard fetch error:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Handle feed type change
  const handleFeedTypeChange = (type: 'trending' | 'following' | 'leaderboard' | 'live') => {
    setFeedType(type);
    if (type === 'trending') {
      if (trendingEvents.length === 0) {
        fetchTrendingEvents(true);
      }
    } else if (type === 'following' && user?.id && followingReviews.length === 0) {
      fetchFollowingFeed(user.id, true);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (feedType === 'trending') {
      await fetchTrendingEvents(true);
      getSuggestedUsers(6).then(setSuggestedUsers);
      supabase
        .from('activity_feed')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(8)
        .then(({ data, error: actErr }) => {
          if (actErr) console.error('[Explore] Activity refresh error:', actErr);
          if (data) setRecentActivity(data as any);
        });
      // @ts-expect-error - Supabase RPC type inference issue
      supabase.rpc('get_trending_reviews', { p_limit: 5, p_offset: 0 }).then(({ data, error: revErr }) => {
        if (revErr) console.error('[Explore] Hot reviews refresh error:', revErr);
        if (data) setHotReviews(data as ReviewWithDetails[]);
      });
    } else if (feedType === 'following' && user?.id) {
      await fetchFollowingFeed(user.id, true);
    } else if (feedType === 'leaderboard') {
      await fetchLeaderboard();
    }
    setRefreshing(false);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (feedType === 'leaderboard') return;
    if (isLoading || !hasMore) return;
    if (feedType === 'trending') {
      fetchTrendingEvents();
    } else if (user?.id) {
      fetchFollowingFeed(user.id);
    }
  };

  // Get sort value for display
  const getSortValue = (entry: LeaderboardEntry): number => {
    switch (sortField) {
      case 'events': return entry.total_events;
      case 'xp': return entry.total_points;
      case 'followers': return entry.followers_count;
      case 'reviews': return entry.reviews_count;
      default: return 0;
    }
  };

  const getSortLabel = (field: SortField): string => {
    switch (field) {
      case 'events': return 'Events';
      case 'xp': return 'XP';
      case 'followers': return 'Followers';
      case 'reviews': return 'Reviews';
    }
  };

  // Helper to parse score value for comparison (handles cricket scores like "103/6")
  const parseScoreValue = (score: string | null): number | null => {
    if (!score) return null;
    // For cricket scores like "103/6", take the runs (before /)
    const cricketMatch = score.match(/^(\d+)\/\d+/);
    if (cricketMatch) return parseInt(cricketMatch[1], 10);
    // For simple numeric scores
    const num = parseInt(score, 10);
    return isNaN(num) ? null : num;
  };

  // Generate score summary with winner
  const getScoreSummary = (item: TrendingEvent): string | null => {
    if (!item.home_score && !item.away_score) return null;

    const sport = item.sport_name?.toLowerCase() || '';
    const homeScore = item.home_score || '';
    const awayScore = item.away_score || '';
    const homeName = item.home_team_name?.split(' ').pop() || 'Home'; // Last word of team name
    const awayName = item.away_team_name?.split(' ').pop() || 'Away';

    // Tennis: scores stored in home_score field as "6-4, 6-3, 7-6"
    if (sport === 'tennis') {
      // Tennis stores the full match score in home_score field
      const tennisResult = parseTennisScore(homeScore);
      if (tennisResult && tennisResult.sets.length > 0) {
        const setScores = tennisResult.sets.map(s => `${s.player1}-${s.player2}`).join(', ');
        const p1Sets = tennisResult.player1Sets;
        const p2Sets = tennisResult.player2Sets;

        if (tennisResult.winner === 'home') {
          return `${homeName} won ${p1Sets}-${p2Sets} (${setScores})`;
        } else if (tennisResult.winner === 'away') {
          return `${awayName} won ${p2Sets}-${p1Sets} (${setScores})`;
        }
        return `${homeName} vs ${awayName}: ${setScores}`;
      }
      // Fallback if parsing fails
      if (homeScore) {
        return `${homeName} vs ${awayName}: ${homeScore}`;
      }
      return null;
    }

    const homeVal = parseScoreValue(homeScore);
    const awayVal = parseScoreValue(awayScore);

    // Can't determine winner
    if (homeVal === null || awayVal === null) {
      if (homeScore && awayScore) {
        return `${homeScore} - ${awayScore}`;
      }
      return homeScore || awayScore;
    }

    // Cricket format
    if (sport === 'cricket' && (homeScore.includes('/') || awayScore.includes('/'))) {
      const diff = Math.abs(homeVal - awayVal);
      if (homeVal > awayVal) {
        return `${homeName} won by ${diff} runs - ${homeScore} v ${awayScore}`;
      } else if (awayVal > homeVal) {
        return `${awayName} won by ${diff} runs - ${awayScore} v ${homeScore}`;
      }
      return `Tied - ${homeScore} v ${awayScore}`;
    }

    // Standard team sports (AFL, Soccer, etc.)
    const diff = Math.abs(homeVal - awayVal);
    if (homeVal > awayVal) {
      return `${homeName} won ${homeScore} - ${awayScore}`;
    } else if (awayVal > homeVal) {
      return `${awayName} won ${awayScore} - ${homeScore}`;
    }
    return `Draw ${homeScore} - ${awayScore}`;
  };

  // Render trending event item
  const renderTrendingEventItem = ({ item }: { item: TrendingEvent }) => {
    const eventDate = parseLocalDate(item.event_date);
    const scoreSummary = getScoreSummary(item);
    // Convert sport name to ID format (lowercase, no spaces) for constants lookup
    const sportId = item.sport_name?.toLowerCase().replace(/\s+/g, '-') || '';
    // Prioritize constants for consistent styling, fall back to database values
    const constantIcon = getSportIcon(sportId);
    const constantColor = getSportColor(sportId);
    const sportIcon = (constantIcon !== 'trophy' ? constantIcon : (item.sport_icon || 'trophy-outline')) as keyof typeof Ionicons.glyphMap;
    const sportColor = constantColor !== colors.sportDefault ? constantColor : (item.sport_color || colors.primary);

    return (
      <TouchableOpacity
        style={styles.trendingEventCard}
        onPress={() => router.push(`/event/${item.event_id}`)}
        activeOpacity={0.7}
      >
        {/* Header with Sport Badge */}
        <View style={styles.trendingEventHeader}>
          <Text style={styles.trendingEventName} numberOfLines={1}>
            {item.event_name}
          </Text>
          {item.sport_name && (
            <View style={[styles.trendingEventSportBadge, { backgroundColor: `${sportColor}20` }]}>
              <Ionicons name={sportIcon} size={12} color={sportColor} />
              <Text style={[styles.trendingEventSportText, { color: sportColor }]}>
                {item.sport_name.charAt(0).toUpperCase() + item.sport_name.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Date, Time & Result Row */}
        <View style={styles.trendingEventMeta}>
          <View style={styles.trendingEventDateTime}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.trendingEventMetaText}>
              {eventDate.toLocaleDateString('en-AU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              {item.event_time && ` at ${item.event_time.slice(0, 5)}`}
            </Text>
          </View>
        </View>

        {/* Score Summary */}
        {scoreSummary && (
          <View style={styles.trendingEventScoreSummary}>
            <Ionicons name="trophy-outline" size={14} color={colors.gold} />
            <Text style={styles.trendingEventScoreText} numberOfLines={1}>
              {scoreSummary}
            </Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.trendingEventStats}>
          {/* Popularity */}
          <View style={styles.trendingEventStat}>
            <Ionicons name="trending-up" size={16} color={colors.primary} />
            <Text style={styles.trendingEventStatValue}>{Math.round(item.trending_score)}</Text>
            <Text style={styles.trendingEventStatLabel}>Popularity</Text>
          </View>

          {/* Attendance */}
          <View style={styles.trendingEventStat}>
            <Ionicons name="people" size={16} color={colors.info} />
            <Text style={styles.trendingEventStatValue}>{item.attendance_count}</Text>
            <Text style={styles.trendingEventStatLabel}>Attended</Text>
          </View>

          {/* Overall Rating */}
          <View style={styles.trendingEventStat}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={styles.trendingEventStatValue}>
              {item.avg_overall_rating ? item.avg_overall_rating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.trendingEventStatLabel}>Overall</Text>
          </View>

          {/* Atmosphere Rating */}
          <View style={styles.trendingEventStat}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={styles.trendingEventStatValue}>
              {item.avg_atmosphere_rating ? item.avg_atmosphere_rating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.trendingEventStatLabel}>Atmosphere</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render review item
  const renderReviewItem = ({ item }: { item: ReviewWithDetails }) => (
    <View style={styles.reviewWrapper}>
      <ReviewCard review={item} />
    </View>
  );

  // Render leaderboard item
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isTop3 = rank <= 3;
    const isCurrentUser = item.user_id === user?.id;
    const medalColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

    return (
      <TouchableOpacity
        style={[styles.leaderboardItem, isCurrentUser && styles.leaderboardItemCurrent]}
        onPress={() => router.push(`/profile/${item.user_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.rankContainer}>
          {isTop3 ? (
            <View style={[styles.medalBadge, { backgroundColor: medalColors[rank] }]}>
              <Text style={styles.medalText}>{rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>{rank}</Text>
          )}
        </View>

        <Avatar
          source={item.avatar_url}
          name={item.display_name || item.username}
          size="sm"
        />

        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName} numberOfLines={1}>
            {item.display_name || item.username || 'Anonymous'}
          </Text>
          <Text style={styles.leaderboardUsername}>@{item.username}</Text>
        </View>

        <View style={styles.leaderboardValue}>
          <Text style={[styles.leaderboardValueText, isTop3 && { color: colors.primary }]}>
            {getSortValue(item).toLocaleString()}
          </Text>
          <Text style={styles.leaderboardValueLabel}>{getSortLabel(sortField)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filter modal for live sports
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

  // Render live sports grid
  const renderLiveSports = () => (
    <ScrollView
      style={styles.liveContainer}
      contentContainerStyle={styles.liveContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.liveHeader}>
        <View>
          <Text style={styles.liveTitle}>Browse Live Sports</Text>
          <Text style={styles.liveSubtitle}>Scores, fixtures, standings & more</Text>
        </View>
        <TouchableOpacity
          style={styles.liveFilterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={18} color={colors.primary} />
          {hiddenSports.size > 0 && (
            <View style={styles.liveFilterBadge}>
              <Text style={styles.liveFilterBadgeText}>{hiddenSports.size}</Text>
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

  // Render trending header with Browse Sports, Discover Fans, Community Stats
  const renderTrendingHeader = () => {
    if (feedType !== 'trending') return null;

    return (
      <View style={styles.trendingHeaderContainer}>
        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.recentActivityCard}>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  {index > 0 && <View style={styles.recentActivityDivider} />}
                  <TouchableOpacity
                    style={styles.recentActivityItem}
                    onPress={() => {
                      if (activity.activity_type === 'attended_event' && activity.reference_id) {
                        // reference_id is attended_event id — look up event_id from metadata
                        const eventId = (activity.metadata as any)?.event_id;
                        if (eventId) {
                          router.push(`/event/${eventId}` as any);
                        }
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <ActivityItem activity={activity} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Discover Fans */}
        {suggestedUsers.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Discover Fans</Text>
              <TouchableOpacity onPress={() => router.push('/explore/discover')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.discoverFansRow}
            >
              {suggestedUsers.map((u) => (
                <TouchableOpacity
                  key={u.user_id}
                  style={styles.fanCard}
                  onPress={() => router.push(`/profile/${u.user_id}` as any)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    source={u.avatar_url}
                    name={u.display_name || u.username}
                    size="lg"
                  />
                  <Text style={styles.fanName} numberOfLines={1}>
                    {u.display_name || u.username}
                  </Text>
                  <Text style={styles.fanUsername} numberOfLines={1}>
                    @{u.username}
                  </Text>
                  <FollowButton userId={u.user_id} size="sm" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Hot Reviews */}
        {hotReviews.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Hot Reviews</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hotReviewsRow}
            >
              {hotReviews.map((review) => {
                const sportName = getSportDisplayName(review.sport_name);
                const sportColor = getSportColor(sportName.toLowerCase());

                return (
                  <TouchableOpacity
                    key={review.review_id}
                    style={styles.hotReviewCard}
                    onPress={() => router.push(`/event/${review.event_id}` as any)}
                    activeOpacity={0.7}
                  >
                    {/* Sport accent top border */}
                    <View style={[styles.hotReviewAccent, { backgroundColor: sportColor }]} />
                    <View style={styles.hotReviewBody}>
                      <Badge label={sportName} size="sm" color={sportColor} />
                      <View style={styles.hotReviewHeader}>
                        <Avatar
                          source={review.avatar_url}
                          name={review.display_name || review.username}
                          size="sm"
                        />
                        <Text style={styles.hotReviewName} numberOfLines={1}>
                          {review.display_name || review.username}
                        </Text>
                      </View>
                      <Text style={styles.hotReviewEvent} numberOfLines={1}>
                        {review.home_team_name && review.away_team_name
                          ? `${review.home_team_name} vs ${review.away_team_name}`
                          : `Event`}
                      </Text>
                      <View style={styles.hotReviewRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= (review.rating || 0) ? 'star' : 'star-outline'}
                            size={14}
                            color={colors.gold}
                          />
                        ))}
                      </View>
                      {review.review_text && (
                        <Text style={styles.hotReviewText} numberOfLines={2}>
                          {review.review_text}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Community Stats */}
        {communityStats && (
          <View style={styles.communityStatsCard}>
            <View style={styles.communityStatsRow}>
              <View style={styles.communityStatItem}>
                <Ionicons name="people" size={20} color={colors.info} />
                <Text style={styles.communityStatValue}>
                  {communityStats.totalAttendance.toLocaleString()}
                </Text>
                <Text style={styles.communityStatLabel}>Total Attended</Text>
              </View>
              <View style={styles.communityStatDivider} />
              <View style={styles.communityStatItem}>
                <Ionicons name="football" size={20} color={colors.success} />
                <Text style={styles.communityStatValue}>{communityStats.uniqueSports}</Text>
                <Text style={styles.communityStatLabel}>Sports</Text>
              </View>
              <View style={styles.communityStatDivider} />
              <View style={styles.communityStatItem}>
                <Ionicons name="flame" size={20} color={colors.warning} />
                <Text style={styles.communityStatValue}>{communityStats.trendingCount}</Text>
                <Text style={styles.communityStatLabel}>Trending</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    // Show error state with retry button
    if (error && !isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySubtitle}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => {
              if (feedType === 'trending') {
                fetchTrendingEvents(true);
              } else if (feedType === 'following' && user?.id) {
                fetchFollowingFeed(user.id, true);
              } else if (feedType === 'leaderboard') {
                fetchLeaderboard();
              }
            }}
          >
            <Text style={styles.discoverButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (feedType === 'leaderboard') {
      if (leaderboardLoading) return null;
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="podium-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            The leaderboard will populate as users join
          </Text>
        </View>
      );
    }

    if (isLoading) return null;

    if (feedType === 'following') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Your Feed is Empty</Text>
          <Text style={styles.emptySubtitle}>
            You're not following anyone yet. Discover other fans and follow them to see their reviews here.
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => router.push('/explore/discover')}
          >
            <Text style={styles.discoverButtonText}>Discover Users</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="flame-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No Trending Events</Text>
        <Text style={styles.emptySubtitle}>
          There are no trending events yet. Be the first — add an event you attended!
        </Text>
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => router.push('/(tabs)/add')}
        >
          <Text style={styles.discoverButtonText}>Add an Event</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render footer (loading indicator)
  const renderFooter = () => {
    const loading = feedType === 'leaderboard' ? leaderboardLoading : isLoading;
    const data = feedType === 'leaderboard' ? leaderboard : reviews;
    if (!loading || data.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // Sort options for leaderboard
  const SORT_OPTIONS: { key: SortField; label: string; icon: string }[] = [
    { key: 'events', label: 'Events', icon: 'ticket' },
    { key: 'xp', label: 'XP', icon: 'flash' },
    { key: 'followers', label: 'Followers', icon: 'people' },
    { key: 'reviews', label: 'Reviews', icon: 'star' },
  ];

  // Header component with search and feed toggle
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push('/explore/search')}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Search reviews, users, teams...</Text>
      </TouchableOpacity>

      {/* Feed Toggle */}
      <View style={styles.feedToggleContainer}>
        <FeedToggle activeTab={feedType} onTabChange={handleFeedTypeChange} />
      </View>

      {/* Sport Filter - only for trending */}
      {feedType === 'trending' && sports.length > 0 && (
        <SportFilter
          sports={sports}
          selectedSportId={selectedSportId}
          onSelect={setSportFilter}
        />
      )}

      {/* Leaderboard sort options */}
      {feedType === 'leaderboard' && (
        <View style={styles.sortContainer}>
          <View style={styles.sortHeader}>
            <Ionicons name="podium" size={18} color={colors.primary} />
            <Text style={styles.sortTitle}>Worldwide Leaderboard</Text>
          </View>
          <View style={styles.sortOptions}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortField === opt.key && styles.sortOptionActive]}
                onPress={() => setSortField(opt.key)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={14}
                  color={sortField === opt.key ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.sortOptionText, sortField === opt.key && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // Determine data and renderers based on feed type
  const listData = feedType === 'leaderboard'
    ? leaderboard
    : feedType === 'trending'
      ? trendingEvents
      : reviews;
  const keyExtractor = feedType === 'leaderboard'
    ? (item: any) => item.user_id
    : feedType === 'trending'
      ? (item: any) => item.event_id
      : (item: any) => item.review_id;
  const renderItem = feedType === 'leaderboard'
    ? renderLeaderboardItem
    : feedType === 'trending'
      ? renderTrendingEventItem
      : renderReviewItem;

  return (
    <View style={styles.container}>
      {/* Fixed header — always pinned across all tabs */}
      {renderHeader()}

      {/* Scrollable content — conditional on feed type */}
      {feedType === 'live' ? (
        <>
          {renderLiveSports()}
          {renderFilterModal()}
        </>
      ) : (
        <FlatList
          data={listData as any}
          keyExtractor={keyExtractor}
          renderItem={renderItem as any}
          ListHeaderComponent={feedType === 'trending' ? renderTrendingHeader() : undefined}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    flex: 1,
  },
  feedToggleContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  reviewWrapper: {
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.4,
  },
  discoverButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  discoverButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  // Leaderboard styles
  sortContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderboardItemCurrent: {
    backgroundColor: `${colors.primary}10`,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  medalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  leaderboardUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  leaderboardValue: {
    alignItems: 'flex-end',
  },
  leaderboardValueText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  leaderboardValueLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Live sports styles
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
  liveFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  liveFilterBadge: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  liveFilterBadgeText: {
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

  // Trending Header sections
  trendingHeaderContainer: {
    paddingBottom: spacing.md,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },

  // Discover Fans
  discoverFansRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fanCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    width: 120,
    gap: spacing.xs,
  },
  fanName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  fanUsername: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  // Community Stats
  communityStatsCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  communityStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  communityStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  communityStatValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  communityStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  communityStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Recent Activity
  recentActivityCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  recentActivityItem: {},
  recentActivityDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Hot Reviews
  hotReviewsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  hotReviewCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  hotReviewAccent: {
    height: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  hotReviewBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  hotReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hotReviewName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  hotReviewEvent: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  hotReviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  hotReviewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.4,
  },
  // Trending Event Card styles
  trendingEventCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendingEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  trendingEventName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  trendingEventSportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  trendingEventSportText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  trendingEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  trendingEventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendingEventResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendingEventMetaText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  trendingEventScoreSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  trendingEventScoreText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  trendingEventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trendingEventStat: {
    alignItems: 'center',
    flex: 1,
  },
  trendingEventStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  trendingEventStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
