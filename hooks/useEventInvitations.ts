import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { EventTagInvitationWithDetails } from '@/types';

export function useEventInvitations() {
  const { user } = useAuthStore();
  const [pendingInvitations, setPendingInvitations] = useState<EventTagInvitationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingInvitations = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('event_tag_invitations')
        .select(
          `
          *,
          from_user:profiles!event_tag_invitations_from_user_id_fkey(
            id, username, display_name, avatar_url
          ),
          attended_event:attended_events(
            *,
            event:events(
              *,
              sport:sports(*),
              home_team:teams!events_home_team_id_fkey(*),
              away_team:teams!events_away_team_id_fkey(*),
              venue:venues(*)
            )
          )
        `
        )
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPendingInvitations((data as EventTagInvitationWithDetails[]) || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchPendingInvitations();
    }
  }, [user?.id, fetchPendingInvitations]);

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      if (!user?.id) return { success: false, error: 'Not authenticated' };

      try {
        // Get the invitation details first
        const invitation = pendingInvitations.find((inv) => inv.id === invitationId);
        if (!invitation) {
          return { success: false, error: 'Invitation not found' };
        }

        // Update invitation status
        const { error: updateError } = await supabase
          .from('event_tag_invitations')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        if (updateError) throw updateError;

        // Copy the event to the accepting user's attended_events
        // with their own entry (they can add their own notes/rating later)
        const attendedEvent = invitation.attended_event;
        if (attendedEvent) {
          const { error: copyError } = await supabase.from('attended_events').insert({
            user_id: user.id,
            event_id: attendedEvent.event_id,
            section: attendedEvent.section,
            seat_info: attendedEvent.seat_info,
            // Don't copy personal fields like rating, notes, ticket_price
            // Let user fill those in themselves
          });

          if (copyError) {
            // If duplicate, that's fine - user already has this event
            if (!copyError.message.includes('duplicate')) {
              console.error('Error copying event:', copyError);
            }
          }
        }

        await fetchPendingInvitations();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [user?.id, pendingInvitations, fetchPendingInvitations]
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      if (!user?.id) return { success: false, error: 'Not authenticated' };

      try {
        const { error: updateError } = await supabase
          .from('event_tag_invitations')
          .update({
            status: 'declined',
            responded_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        if (updateError) throw updateError;

        await fetchPendingInvitations();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [user?.id, fetchPendingInvitations]
  );

  // Create invitations for tagged users when saving an event
  const createInvitations = useCallback(
    async (attendedEventId: string, taggedUserIds: string[]) => {
      if (!user?.id || !taggedUserIds.length) return { success: true };

      try {
        const invitations = taggedUserIds.map((toUserId) => ({
          attended_event_id: attendedEventId,
          from_user_id: user.id,
          to_user_id: toUserId,
          status: 'pending',
        }));

        const { error: insertError } = await supabase
          .from('event_tag_invitations')
          .insert(invitations);

        if (insertError) throw insertError;

        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [user?.id]
  );

  return {
    pendingInvitations,
    pendingCount: pendingInvitations.length,
    isLoading,
    error,
    refresh: fetchPendingInvitations,
    acceptInvitation,
    declineInvitation,
    createInvitations,
  };
}
