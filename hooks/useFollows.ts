import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { FollowCounts, FollowWithProfile, Profile, UserSuggestion } from '@/types';

export function useFollows() {
  const { user } = useAuthStore();
  const [followers, setFollowers] = useState<FollowWithProfile[]>([]);
  const [following, setFollowing] = useState<FollowWithProfile[]>([]);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers_count: 0, following_count: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user's followers
  const fetchFollowers = useCallback(async (userId?: string) => {
    const targetId = userId || user?.id;
    if (!targetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('follows')
        .select(`
          *,
          profile:profiles!follows_follower_id_fkey(*)
        `)
        .eq('following_id', targetId);

      if (fetchError) throw fetchError;

      setFollowers((data || []) as unknown as FollowWithProfile[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch users the current user is following
  const fetchFollowing = useCallback(async (userId?: string) => {
    const targetId = userId || user?.id;
    if (!targetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('follows')
        .select(`
          *,
          profile:profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', targetId);

      if (fetchError) throw fetchError;

      setFollowing((data || []) as unknown as FollowWithProfile[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Get follow counts for a user
  const getFollowCounts = useCallback(async (userId: string): Promise<FollowCounts> => {
    try {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc('get_follow_counts', {
        p_user_id: userId,
      });

      if (error) throw error;

      const counts = data?.[0] || { followers_count: 0, following_count: 0 };
      if (userId === user?.id) {
        setFollowCounts(counts);
      }
      return counts;
    } catch (err) {
      console.error('[useFollows] Error getting counts:', err);
      return { followers_count: 0, following_count: 0 };
    }
  }, [user?.id]);

  // Check if current user follows a specific user
  const isFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user?.id || user.id === targetUserId) return false;

    try {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc('is_following', {
        p_follower_id: user.id,
        p_following_id: targetUserId,
      });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('[useFollows] Error checking follow status:', err);
      return false;
    }
  }, [user?.id]);

  // Follow a user
  const followUser = useCallback(async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    if (user.id === targetUserId) return { success: false, error: "You can't follow yourself" };

    try {
      const table = supabase.from('follows');
      // @ts-ignore - Supabase table type inference issue with follows table
      const { error: insertError } = await table.insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'Already following this user' };
        }
        throw insertError;
      }

      // Update local state
      await Promise.all([
        fetchFollowing(),
        getFollowCounts(user.id),
      ]);

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id, fetchFollowing, getFollowCounts]);

  // Unfollow a user
  const unfollowUser = useCallback(async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (deleteError) throw deleteError;

      // Update local state
      await Promise.all([
        fetchFollowing(),
        getFollowCounts(user.id),
      ]);

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id, fetchFollowing, getFollowCounts]);

  // Toggle follow status
  const toggleFollow = useCallback(async (targetUserId: string): Promise<{ success: boolean; isNowFollowing: boolean; error?: string }> => {
    const currentlyFollowing = await isFollowing(targetUserId);

    if (currentlyFollowing) {
      const result = await unfollowUser(targetUserId);
      return { ...result, isNowFollowing: false };
    } else {
      const result = await followUser(targetUserId);
      return { ...result, isNowFollowing: result.success };
    }
  }, [isFollowing, followUser, unfollowUser]);

  // Get suggested users to follow
  const getSuggestedUsers = useCallback(async (limit = 10): Promise<UserSuggestion[]> => {
    if (!user?.id) return [];

    try {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc('get_suggested_users', {
        p_user_id: user.id,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as UserSuggestion[];
    } catch (err) {
      console.error('[useFollows] Error getting suggestions:', err);
      return [];
    }
  }, [user?.id]);

  // Search users
  const searchUsers = useCallback(async (query: string, limit = 20): Promise<UserSuggestion[]> => {
    if (!query.trim()) return [];

    try {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc('search_users', {
        p_query: query,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as UserSuggestion[];
    } catch (err) {
      console.error('[useFollows] Error searching users:', err);
      return [];
    }
  }, []);

  // Fetch lists for a specific user (for profile pages)
  const fetchUserFollowLists = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select(`*, profile:profiles!follows_follower_id_fkey(*)`)
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select(`*, profile:profiles!follows_following_id_fkey(*)`)
          .eq('follower_id', userId),
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;

      return {
        followers: (followersRes.data || []) as unknown as FollowWithProfile[],
        following: (followingRes.data || []) as unknown as FollowWithProfile[],
      };
    } catch (err) {
      setError((err as Error).message);
      return { followers: [], following: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchFollowers();
      fetchFollowing();
      getFollowCounts(user.id);
    }
  }, [user?.id]);

  return {
    // State
    followers,
    following,
    followCounts,
    isLoading,
    error,

    // Actions
    followUser,
    unfollowUser,
    toggleFollow,
    isFollowing,
    getFollowCounts,
    getSuggestedUsers,
    searchUsers,

    // Fetch methods
    fetchFollowers,
    fetchFollowing,
    fetchUserFollowLists,

    // Refresh all
    refresh: useCallback(async () => {
      if (user?.id) {
        await Promise.all([
          fetchFollowers(),
          fetchFollowing(),
          getFollowCounts(user.id),
        ]);
      }
    }, [user?.id, fetchFollowers, fetchFollowing, getFollowCounts]),
  };
}
