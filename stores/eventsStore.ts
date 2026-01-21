import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useStatsStore } from '@/stores/statsStore';
import type {
  Event,
  AttendedEvent,
  EventWithDetails,
  AttendedEventWithDetails,
  Sport,
  Team,
  Venue,
} from '@/types';

interface EventsState {
  attendedEvents: AttendedEventWithDetails[];
  sports: Sport[];
  teams: Team[];
  venues: Venue[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAttendedEvents: (userId: string) => Promise<void>;
  fetchSports: () => Promise<void>;
  fetchTeams: (sportId?: string) => Promise<void>;
  fetchVenues: () => Promise<void>;
  addAttendedEvent: (
    userId: string,
    eventData: Partial<Event>,
    attendanceData: Partial<AttendedEvent>
  ) => Promise<{ success: boolean; error?: string; attendedEventId?: string }>;
  updateAttendedEvent: (
    attendanceId: string,
    updates: Partial<AttendedEvent>
  ) => Promise<{ success: boolean; error?: string }>;
  updateEvent: (
    eventId: string,
    updates: Partial<Event>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAttendedEvent: (attendanceId: string) => Promise<{ success: boolean; error?: string }>;
  searchEvents: (query: string) => Promise<EventWithDetails[]>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  attendedEvents: [],
  sports: [],
  teams: [],
  venues: [],
  isLoading: false,
  error: null,

  fetchAttendedEvents: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('attended_events')
        .select(
          `
          *,
          event:events(
            *,
            sport:sports(*),
            home_team:teams!events_home_team_id_fkey(*),
            away_team:teams!events_away_team_id_fkey(*),
            venue:venues(*)
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ attendedEvents: (data as AttendedEventWithDetails[]) || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSports: async () => {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name');

    if (!error && data) {
      set({ sports: data as Sport[] });
    }
  },

  fetchTeams: async (sportId) => {
    let query = supabase.from('teams').select('*').order('name');

    if (sportId) {
      query = query.eq('sport_id', sportId);
    }

    const { data, error } = await query;

    if (!error && data) {
      set({ teams: data as Team[] });
    }
  },

  fetchVenues: async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (!error && data) {
      set({ venues: data as Venue[] });
    }
  },

  addAttendedEvent: async (userId, eventData, attendanceData) => {
    try {
      // First, create or find the event
      let eventId: string;

      // Extract team/venue names that need special handling
      const { home_team_name, away_team_name, venue_name, ...restEventData } = eventData;

      // Check if this event already exists
      if (eventData.id) {
        eventId = eventData.id;
      } else {
        // Build the event insert data
        const insertData: Record<string, unknown> = {
          ...restEventData,
          created_by: userId,
        };

        // Add team and venue names as text fields if they exist
        // These are stored as text since we don't have foreign key relationships for manually entered teams
        if (home_team_name) {
          insertData.home_team_name = home_team_name;
        }
        if (away_team_name) {
          insertData.away_team_name = away_team_name;
        }
        if (venue_name) {
          insertData.venue_name = venue_name;
        }

        // Create new event
        const { data: newEvent, error: eventError } = await supabase
          .from('events')
          .insert(insertData)
          .select()
          .single();

        if (eventError) throw eventError;
        eventId = newEvent.id;
      }

      // Create attendance record
      const { data: newAttendance, error: attendanceError } = await supabase
        .from('attended_events')
        .insert({
          ...attendanceData,
          user_id: userId,
          event_id: eventId,
        })
        .select()
        .single();

      if (attendanceError) throw attendanceError;

      // Refresh events
      await get().fetchAttendedEvents(userId);

      return { success: true, attendedEventId: newAttendance.id };
    } catch (error) {
      console.error('Error in addAttendedEvent:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  updateAttendedEvent: async (attendanceId, updates) => {
    try {
      const { error } = await supabase
        .from('attended_events')
        .update(updates)
        .eq('id', attendanceId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        attendedEvents: state.attendedEvents.map((event) =>
          event.id === attendanceId ? { ...event, ...updates } : event
        ),
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  updateEvent: async (eventId, updates) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      // Update local state - update the event within attended events
      set((state) => ({
        attendedEvents: state.attendedEvents.map((attended) =>
          attended.event_id === eventId
            ? { ...attended, event: { ...attended.event!, ...updates } }
            : attended
        ),
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  deleteAttendedEvent: async (attendanceId) => {
    try {
      console.log('[Events] Deleting attendance:', attendanceId);

      // First verify the record exists and belongs to current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Events] Current user:', user?.id);

      if (!user) {
        return { success: false, error: 'You must be logged in to delete events' };
      }

      // Check if the record exists
      const { data: existing, error: checkError } = await supabase
        .from('attended_events')
        .select('id, user_id')
        .eq('id', attendanceId)
        .single();

      console.log('[Events] Existing record:', existing, 'Check error:', checkError);

      if (checkError || !existing) {
        return { success: false, error: 'Event not found' };
      }

      if (existing.user_id !== user.id) {
        return { success: false, error: 'You can only delete your own events' };
      }

      // Now delete
      const { error } = await supabase
        .from('attended_events')
        .delete()
        .eq('id', attendanceId);

      console.log('[Events] Delete result - error:', error);

      if (error) {
        console.error('[Events] Delete error:', error);
        throw error;
      }

      // Update local state
      set((state) => ({
        attendedEvents: state.attendedEvents.filter((event) => event.id !== attendanceId),
      }));

      console.log('[Events] Delete successful, local state updated');

      // Recalculate achievements after deletion
      console.log('[Events] Triggering achievement recalculation');
      useStatsStore.getState().recalculateAchievements(user.id);

      return { success: true };
    } catch (error) {
      console.error('[Events] Delete failed:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  searchEvents: async (query) => {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        sport:sports(*),
        home_team:teams!events_home_team_id_fkey(*),
        away_team:teams!events_away_team_id_fkey(*),
        venue:venues(*)
      `
      )
      .or(`home_team.name.ilike.%${query}%,away_team.name.ilike.%${query}%`)
      .order('event_date', { ascending: false })
      .limit(20);

    if (error) return [];
    return (data as EventWithDetails[]) || [];
  },
}));
