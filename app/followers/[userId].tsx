import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useFollows } from '@/hooks/useFollows';
import { Avatar } from '@/components/ui';
import { FollowButton } from '@/components/explore';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { FollowWithProfile, Profile } from '@/types';

type TabType = 'followers' | 'following';

export default function FollowersScreen() {
  const { userId, tab } = useLocalSearchParams<{ userId: string; tab?: string }>();
  const { fetchUserFollowLists } = useFollows();

  const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || 'followers');
  const [followers, setFollowers] = useState<FollowWithProfile[]>([]);
  const [following, setFollowing] = useState<FollowWithProfile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profile
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
      console.error('[Followers] Error fetching profile:', err);
    }
  }, [userId]);

  // Fetch follow lists
  const fetchFollowLists = useCallback(async () => {
    if (!userId) return;

    const lists = await fetchUserFollowLists(userId);
    setFollowers(lists.followers);
    setFollowing(lists.following);
  }, [userId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchProfile(), fetchFollowLists()]);
      setIsLoading(false);
    };
    load();
  }, [userId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFollowLists();
    setRefreshing(false);
  };

  // Get current list
  const currentList = activeTab === 'followers' ? followers : following;

  // Render user item
  const renderItem = ({ item }: { item: FollowWithProfile }) => {
    const userProfile = item.profile;
    if (!userProfile) return null;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push(`/profile/${userProfile.id}`)}
        activeOpacity={0.7}
      >
        <Avatar
          uri={userProfile.avatar_url || undefined}
          name={userProfile.display_name || userProfile.username}
          size={48}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {userProfile.display_name || userProfile.username}
          </Text>
          <Text style={styles.username}>@{userProfile.username}</Text>
        </View>
        <FollowButton userId={userProfile.id} size="sm" />
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
        size={64}
        color={colors.textMuted}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'followers' ? 'No Followers Yet' : 'Not Following Anyone'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'followers'
          ? 'When people follow this user, they will appear here'
          : 'When this user follows people, they will appear here'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: profile?.display_name || profile?.username || 'User',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.container}>
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
              Followers
            </Text>
            <Text style={[styles.tabCount, activeTab === 'followers' && styles.tabCountActive]}>
              {followers.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.tabActive]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
              Following
            </Text>
            <Text style={[styles.tabCount, activeTab === 'following' && styles.tabCountActive]}>
              {following.length}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </View>
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
  tabCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  tabCountActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
