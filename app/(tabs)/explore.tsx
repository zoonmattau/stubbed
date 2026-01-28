import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore, TrendingEvent } from '@/stores/exploreStore';
import { ReviewCard, FeedToggle, SportFilter } from '@/components/explore';
import { Avatar, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSportIcon, getSportColor } from '@/constants/sports';
import { parseLocalDate } from '@/utils/dates';
import type { ReviewWithDetails } from '@/types';

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
    trendingReviews,
    followingReviews,
    selectedSportId,
    sports,
    isLoadingTrending,
    isLoadingFollowing,
    hasMoreTrending,
    hasMoreFollowing,
    setFeedType,
    setSportFilter,
    fetchTrendingEvents,
    fetchTrending,
    fetchFollowingFeed,
    fetchSports,
  } = useExploreStore();

  const [refreshing, setRefreshing] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('events');

  // Get current feed based on type
  const reviews = followingReviews; // Only used for following feed now
  const isLoading = feedType === 'trending' ? isLoadingTrending : isLoadingFollowing;
  const hasMore = feedType === 'trending' ? hasMoreTrending : hasMoreFollowing;

  // Initial fetch
  useFocusEffect(
    useCallback(() => {
      fetchSports();
      if (feedType === 'trending') {
        if (trendingEvents.length === 0) {
          fetchTrendingEvents(true);
        }
      } else if (feedType === 'following' && user?.id) {
        if (followingReviews.length === 0) {
          fetchFollowingFeed(user.id, true);
        }
      }
    }, [feedType, user?.id])
  );

  // Fetch leaderboard when tab or sort changes
  useEffect(() => {
    if (feedType === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [feedType, sortField]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: 50 });

      if (error) {
        console.error('[Explore] Leaderboard RPC error:', error);
        throw error;
      }

      const entries: LeaderboardEntry[] = (data || []).map((row: any) => ({
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
  const handleFeedTypeChange = (type: 'trending' | 'following' | 'leaderboard') => {
    setFeedType(type as any);
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

    // Tennis: different format
    if (sport === 'tennis') {
      // For tennis, just show the scores
      if (homeScore && awayScore) {
        return `${homeName}: ${homeScore} | ${awayName}: ${awayScore}`;
      }
      return homeScore || awayScore;
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

  // Render empty state
  const renderEmptyState = () => {
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
        <FeedToggle activeTab={feedType as any} onTabChange={handleFeedTypeChange} />
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
      <FlatList
        data={listData as any}
        keyExtractor={keyExtractor}
        renderItem={renderItem as any}
        ListHeaderComponent={renderHeader}
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
