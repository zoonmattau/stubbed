import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { FriendWithProfile, Profile, TaggedUser } from '@/types';

export function useFriends() {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch accepted friendships
      const { data: friendships, error: fetchError } = await supabase
        .from('friendships')
        .select(
          `
          *,
          requester:profiles!friendships_requester_id_fkey(*),
          addressee:profiles!friendships_addressee_id_fkey(*)
        `
        )
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (fetchError) throw fetchError;

      const formattedFriends = (friendships || []).map((f) => ({
        ...f,
        profile:
          f.requester_id === user.id
            ? (f.addressee as Profile)
            : (f.requester as Profile),
      }));

      setFriends(formattedFriends);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select(
          `
          *,
          requester:profiles!friendships_requester_id_fkey(*)
        `
        )
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((f) => ({
        ...f,
        profile: f.requester as Profile,
      }));

      setPendingRequests(formatted);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, [user?.id]);

  const fetchSentRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select(
          `
          *,
          addressee:profiles!friendships_addressee_id_fkey(*)
        `
        )
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((f) => ({
        ...f,
        profile: f.addressee as Profile,
      }));

      setSentRequests(formatted);
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
    }
  }, [user?.id]);

  const sendRequest = useCallback(
    async (username: string) => {
      if (!user?.id) return { success: false, error: 'Not authenticated' };

      try {
        // Find user by username
        const { data: targetUser, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (findError || !targetUser) {
          return { success: false, error: 'User not found' };
        }

        if (targetUser.id === user.id) {
          return { success: false, error: "You can't add yourself" };
        }

        // Check if friendship already exists
        const { data: existing } = await supabase
          .from('friendships')
          .select('id, status')
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},addressee_id.eq.${user.id})`
          )
          .single();

        if (existing) {
          if (existing.status === 'accepted') {
            return { success: false, error: 'Already friends' };
          }
          if (existing.status === 'pending') {
            return { success: false, error: 'Request already sent' };
          }
        }

        // Create friendship request
        const { error: createError } = await supabase.from('friendships').insert({
          requester_id: user.id,
          addressee_id: targetUser.id,
          status: 'pending',
        });

        if (createError) throw createError;

        await fetchSentRequests();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [user?.id]
  );

  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', friendshipId);

        if (updateError) throw updateError;

        await Promise.all([fetchFriends(), fetchPendingRequests()]);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [fetchFriends, fetchPendingRequests]
  );

  const declineRequest = useCallback(
    async (friendshipId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', friendshipId);

        if (updateError) throw updateError;

        await fetchPendingRequests();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [fetchPendingRequests]
  );

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);

        if (deleteError) throw deleteError;

        await fetchFriends();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [fetchFriends]
  );

  // Search friends by username or display name (local filtering)
  const searchFriends = useCallback(
    (query: string): Profile[] => {
      if (!query.trim()) return friends.map((f) => f.profile!).filter(Boolean);

      const lowerQuery = query.toLowerCase();
      return friends
        .filter((f) => {
          const profile = f.profile;
          if (!profile) return false;
          return (
            profile.username.toLowerCase().includes(lowerQuery) ||
            (profile.display_name?.toLowerCase().includes(lowerQuery) ?? false)
          );
        })
        .map((f) => f.profile!)
        .filter(Boolean);
    },
    [friends]
  );

  // Fetch profiles by user IDs (for displaying tagged users)
  const fetchUsersByIds = useCallback(
    async (userIds: string[]): Promise<TaggedUser[]> => {
      if (!userIds.length) return [];

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (error) throw error;
        return (data as TaggedUser[]) || [];
      } catch (err) {
        console.error('Error fetching users by IDs:', err);
        return [];
      }
    },
    []
  );

  // Get all friend profiles for easy access
  const friendProfiles = useMemo(
    () => friends.map((f) => f.profile!).filter(Boolean),
    [friends]
  );

  return {
    friends,
    friendProfiles,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    refresh: fetchFriends,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    searchFriends,
    fetchUsersByIds,
  };
}
