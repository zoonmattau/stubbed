import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore } from '@/stores/exploreStore';
import { ReviewCard, FeedToggle, SportFilter } from '@/components/explore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { ReviewWithDetails } from '@/types';

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const {
    feedType,
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
    fetchTrending,
    fetchFollowingFeed,
    fetchSports,
  } = useExploreStore();

  const [refreshing, setRefreshing] = useState(false);

  // Get current feed based on type
  const reviews = feedType === 'trending' ? trendingReviews : followingReviews;
  const isLoading = feedType === 'trending' ? isLoadingTrending : isLoadingFollowing;
  const hasMore = feedType === 'trending' ? hasMoreTrending : hasMoreFollowing;

  // Initial fetch
  useFocusEffect(
    useCallback(() => {
      fetchSports();
      if (feedType === 'trending') {
        if (trendingReviews.length === 0) {
          fetchTrending(true);
        }
      } else if (user?.id) {
        if (followingReviews.length === 0) {
          fetchFollowingFeed(user.id, true);
        }
      }
    }, [feedType, user?.id])
  );

  // Handle feed type change
  const handleFeedTypeChange = (type: 'trending' | 'following') => {
    setFeedType(type);
    if (type === 'trending') {
      if (trendingReviews.length === 0) {
        fetchTrending(true);
      }
    } else if (user?.id && followingReviews.length === 0) {
      fetchFollowingFeed(user.id, true);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (feedType === 'trending') {
      await fetchTrending(true);
    } else if (user?.id) {
      await fetchFollowingFeed(user.id, true);
    }
    setRefreshing(false);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (isLoading || !hasMore) return;
    if (feedType === 'trending') {
      fetchTrending();
    } else if (user?.id) {
      fetchFollowingFeed(user.id);
    }
  };

  // Render review item
  const renderReviewItem = ({ item }: { item: ReviewWithDetails }) => (
    <View style={styles.reviewWrapper}>
      <ReviewCard review={item} />
    </View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    if (feedType === 'following') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySubtitle}>
            Follow other users to see their reviews here
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
        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to share a review!
        </Text>
      </View>
    );
  };

  // Render footer (loading indicator)
  const renderFooter = () => {
    if (!isLoading || reviews.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

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
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.review_id}
        renderItem={renderReviewItem}
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
});
