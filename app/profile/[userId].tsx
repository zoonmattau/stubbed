import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useFollows } from '@/hooks/useFollows';
import { useReviews } from '@/hooks/useReviews';
import { Avatar, Card } from '@/components/ui';
import { FollowButton, ReviewCard } from '@/components/explore';
import { EventCard } from '@/components/events';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getCurrentLevel } from '@/constants/levels';
import type { Profile, ReviewWithDetails, FollowCounts, UserStats, AttendedEventWithDetails } from '@/types';

type TabType = 'reviews' | 'events';

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuthStore();
  const { getFollowCounts, isFollowing: checkIsFollowing } = useFollows();
  const { getUserReviews } = useReviews();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [privacySettings, setPrivacySettings] = useState<{ show_events: boolean; show_stats: boolean }>({ show_events: true, show_stats: true });
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers_count: 0, following_count: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [events, setEvents] = useState<AttendedEventWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = user?.id === userId;

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      console.error('[PublicProfile] Error fetching profile:', err);
    }
  }, [userId]);

  // Fetch user stats + privacy via RPC (bypasses RLS)
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.rpc('get_user_public_stats', {
        p_user_id: userId,
      });

      if (!error && data && data.length > 0) {
        const row = data[0];
        setUserStats({
          user_id: userId,
          total_events: row.total_events || 0,
          total_sports: row.total_sports || 0,
          total_teams: 0,
          total_venues: 0,
        } as UserStats);
        setUserXp(row.total_points || 0);
        setPrivacySettings({
          show_events: row.show_events ?? true,
          show_stats: row.show_stats ?? true,
        });
      }
    } catch (err) {
      console.error('[PublicProfile] Error fetching stats:', err);
    }
  }, [userId]);

  // Fetch follow counts and status
  const fetchFollowData = useCallback(async () => {
    if (!userId) return;

    const counts = await getFollowCounts(userId);
    setFollowCounts(counts);

    if (user?.id && user.id !== userId) {
      const following = await checkIsFollowing(userId);
      setIsFollowing(following);
    }
  }, [userId, user?.id]);

  // Fetch user reviews
  const fetchReviews = useCallback(async () => {
    if (!userId) return;
    const userReviews = await getUserReviews(userId);
    setReviews(userReviews);
  }, [userId]);

  // Fetch user events
  const fetchEvents = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('attended_events')
        .select(`
          *,
          event:events(
            *,
            sport:sports(*),
            home_team:teams!events_home_team_id_fkey(*),
            away_team:teams!events_away_team_id_fkey(*),
            venue:venues(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(data as AttendedEventWithDetails[]);
      }
    } catch (err) {
      console.error('[PublicProfile] Error fetching events:', err);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchStats(),
        fetchFollowData(),
        fetchReviews(),
        fetchEvents(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [userId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchStats(),
      fetchFollowData(),
      fetchReviews(),
      fetchEvents(),
    ]);
    setRefreshing(false);
  };

  // Handle follow change
  const handleFollowChange = (nowFollowing: boolean) => {
    setIsFollowing(nowFollowing);
    setFollowCounts(prev => ({
      ...prev,
      followers_count: nowFollowing ? prev.followers_count + 1 : prev.followers_count - 1,
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color={colors.textMuted} />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: profile.display_name || (profile.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : 'Profile'),
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar
            uri={profile.avatar_url || undefined}
            name={profile.display_name || profile.username}
            size={80}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profile.display_name || profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>

          {/* Level Badge */}
          {userXp > 0 && (() => {
            const level = getCurrentLevel(userXp);
            return (
              <View style={styles.levelRow}>
                <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
                  <Ionicons name={level.icon as any} size={14} color="#fff" />
                  <Text style={styles.levelBadgeText}>{level.name}</Text>
                </View>
                <Text style={styles.xpText}>{userXp.toLocaleString()} XP</Text>
              </View>
            );
          })()}

          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          {/* Follow button */}
          {!isOwnProfile && (
            <View style={styles.followButtonContainer}>
              <FollowButton
                userId={userId!}
                initialFollowing={isFollowing}
                size="lg"
                onFollowChange={handleFollowChange}
              />
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/followers/${userId}?tab=followers`)}
          >
            <Text style={styles.statValue}>{followCounts.followers_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/followers/${userId}?tab=following`)}
          >
            <Text style={styles.statValue}>{followCounts.following_count}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            {!isOwnProfile && !privacySettings.show_events ? (
              <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
            ) : (
              <Text style={styles.statValue}>{userStats?.total_events || 0}</Text>
            )}
            <Text style={styles.statLabel}>Events</Text>
          </View>

          <View style={styles.statItem}>
            {!isOwnProfile && !privacySettings.show_stats ? (
              <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
            ) : (
              <Text style={styles.statValue}>{userStats?.total_sports || 0}</Text>
            )}
            <Text style={styles.statLabel}>Sports</Text>
          </View>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={activeTab === 'events' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Ionicons
              name="document-text"
              size={20}
              color={activeTab === 'reviews' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'events' && (
            <>
              {!isOwnProfile && !privacySettings.show_events ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>Events are private</Text>
                  <Text style={styles.emptySubtext}>
                    This user's event history is not public
                  </Text>
                </View>
              ) : events.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No events yet</Text>
                </View>
              ) : (
                events.map((attended) => (
                  <View key={attended.id} style={styles.eventCardWrapper}>
                    <EventCard
                      event={attended.event!}
                      attendance={attended}
                      compact
                      onPress={() => router.push(`/event/${attended.event_id}`)}
                    />
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'reviews' && (
            <>
              {reviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No reviews yet</Text>
                </View>
              ) : (
                reviews.map((review) => (
                  <ReviewCard key={review.review_id} review={review} />
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  displayName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: 2,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  levelBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  xpText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: fontSize.md * 1.4,
  },
  followButtonContainer: {
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    padding: spacing.lg,
  },
  eventCardWrapper: {
    marginBottom: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
