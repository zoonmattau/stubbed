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
  EventConsensus,
} from '@/types';

// Helper to parse score value for comparison (handles cricket scores like "103/6")
const parseScoreValue = (score: string | null | undefined): number | null => {
  if (!score) return null;
  // For cricket scores like "103/6", take the runs (before /)
  const cricketMatch = score.match(/^(\d+)\/\d+/);
  if (cricketMatch) return parseInt(cricketMatch[1], 10);
  // For simple numeric scores
  const num = parseInt(score, 10);
  return isNaN(num) ? null : num;
};

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
  ) => Promise<{ success: boolean; error?: string; attendedEventId?: string; eventId?: string }>;
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
  getEventConsensus: (eventId: string) => Promise<{ consensus: EventConsensus[]; hasConflicts: boolean }>;
  resolveEventConflict: (
    eventId: string,
    attendanceId: string,
    field: string,
    value: string
  ) => Promise<{ success: boolean; error?: string }>;
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

      // Calculate result (win/loss/draw) based on supported_team and scores
      const eventsWithResult = (data || []).map((attended: any) => {
        const event = attended.event;
        if (!event || !attended.supported_team || attended.supported_team === 'neutral') {
          return { ...attended, result: null };
        }

        const homeScore = parseScoreValue(event.home_score);
        const awayScore = parseScoreValue(event.away_score);

        if (homeScore === null || awayScore === null) {
          return { ...attended, result: null };
        }

        let result: 'win' | 'loss' | 'draw' | null = null;

        if (homeScore === awayScore) {
          result = 'draw';
        } else if (attended.supported_team === 'home') {
          result = homeScore > awayScore ? 'win' : 'loss';
        } else if (attended.supported_team === 'away') {
          result = awayScore > homeScore ? 'win' : 'loss';
        }

        return { ...attended, result };
      });

      set({ attendedEvents: eventsWithResult as AttendedEventWithDetails[] });
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

      // Extract team/venue/sport names that need special handling
      const { home_team_name, away_team_name, venue_name, sport_id, ...restEventData } = eventData;

      // Try to find matching teams in the database by name (case-insensitive)
      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;
      let venueId: string | null = null;

      if (home_team_name) {
        const { data: homeTeam } = await supabase
          .from('teams')
          .select('id')
          .ilike('name', home_team_name)
          .limit(1)
          .single();
        if (homeTeam) homeTeamId = homeTeam.id;
      }

      if (away_team_name) {
        const { data: awayTeam } = await supabase
          .from('teams')
          .select('id')
          .ilike('name', away_team_name)
          .limit(1)
          .single();
        if (awayTeam) awayTeamId = awayTeam.id;
      }

      if (venue_name) {
        const { data: venue } = await supabase
          .from('venues')
          .select('id')
          .ilike('name', venue_name)
          .limit(1)
          .single();
        if (venue) venueId = venue.id;
      }

      // Check if this event already exists
      if (eventData.id) {
        eventId = eventData.id;
      } else {
        // Try to find an existing event with same teams and date (deduplication)
        let existingEvent = null;

        // Build query to find matching event
        if (eventData.event_date && (homeTeamId || home_team_name) && (awayTeamId || away_team_name)) {
          let query = supabase
            .from('events')
            .select('id, home_score, away_score, round, competition, event_time, venue_id, venue_name')
            .eq('event_date', eventData.event_date);

          // Match by team IDs if available (more reliable)
          if (homeTeamId && awayTeamId) {
            query = query.eq('home_team_id', homeTeamId).eq('away_team_id', awayTeamId);
          } else {
            // Fall back to name matching (case-insensitive)
            if (home_team_name) {
              query = query.ilike('home_team_name', home_team_name);
            }
            if (away_team_name) {
              query = query.ilike('away_team_name', away_team_name);
            }
          }

          const { data: matchingEvents } = await query.limit(1);
          if (matchingEvents && matchingEvents.length > 0) {
            existingEvent = matchingEvents[0];
          }
        }

        if (existingEvent) {
          // Use the existing event
          eventId = existingEvent.id;
          console.log('[EventStore] Found existing event, reusing:', eventId);

          // Fill in any missing fields on the existing event with data from this attendance
          const updates: Record<string, unknown> = {};

          // Scores - only update if existing doesn't have them
          if (eventData.home_score && !existingEvent.home_score) {
            updates.home_score = eventData.home_score;
            updates.away_score = eventData.away_score;
            updates.is_draw = eventData.is_draw || false;
          }

          // Round - fill in if missing
          if (eventData.round && !existingEvent.round) {
            updates.round = eventData.round;
          }

          // Competition - fill in if missing
          if (eventData.competition && !existingEvent.competition) {
            updates.competition = eventData.competition;
          }

          // Event time - fill in if missing
          if (eventData.event_time && !existingEvent.event_time) {
            updates.event_time = eventData.event_time;
          }

          // Venue - fill in if missing (prefer ID over name)
          if (venueId && !existingEvent.venue_id) {
            updates.venue_id = venueId;
            updates.venue_name = venue_name;
          } else if (venue_name && !existingEvent.venue_name) {
            updates.venue_name = venue_name;
          }

          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            await supabase
              .from('events')
              .update(updates)
              .eq('id', eventId);
            console.log('[EventStore] Updated existing event with missing fields:', Object.keys(updates));
          }
        } else {
          // Build the event insert data explicitly - DO NOT include sport_id (it's a text code, not a UUID)
          const insertData: Record<string, unknown> = {
            created_by: userId,
            event_date: eventData.event_date,
            event_time: eventData.event_time || null,
            competition: eventData.competition || null,
            round: eventData.round || null,
            home_score: eventData.home_score || null,
            away_score: eventData.away_score || null,
            is_draw: eventData.is_draw || false,
            is_abandoned: eventData.is_abandoned || false,
            // Store sport as text name (sport_id from form is actually the sport code like 'afl', 'tennis')
            sport_name: sport_id || null,
            // Store team/venue as text fields (fallback for display)
            home_team_name: home_team_name || null,
            away_team_name: away_team_name || null,
            venue_name: venue_name || null,
            // Also store FKs if we found matching teams/venues (for logos)
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            venue_id: venueId,
          };

          // Create new event
          const { data: newEvent, error: eventError } = await supabase
            .from('events')
            .insert(insertData)
            .select()
            .single();

          if (eventError) throw eventError;
          eventId = newEvent.id;
          console.log('[EventStore] Created new event:', eventId);
        }
      }

      // Create attendance record
      // Try with consensus fields first, fall back to basic insert if columns don't exist
      let newAttendance;
      let attendanceError;

      // First try with the new consensus fields
      const insertData: Record<string, unknown> = {
        ...attendanceData,
        user_id: userId,
        event_id: eventId,
      };

      // Try to include consensus fields (may not exist if migration not run)
      const insertDataWithConsensus = {
        ...insertData,
        submitted_home_score: eventData.home_score || null,
        submitted_away_score: eventData.away_score || null,
        submitted_round: eventData.round || null,
        submitted_event_time: eventData.event_time || null,
        submitted_competition: eventData.competition || null,
        submitted_at: new Date().toISOString(),
      };

      // Try with consensus fields first
      const result = await supabase
        .from('attended_events')
        .insert(insertDataWithConsensus)
        .select()
        .single();

      if (result.error?.message?.includes('column') && result.error?.message?.includes('does not exist')) {
        // Consensus columns don't exist yet, fall back to basic insert
        console.log('[EventStore] Consensus columns not found, using basic insert');
        const basicResult = await supabase
          .from('attended_events')
          .insert(insertData)
          .select()
          .single();
        newAttendance = basicResult.data;
        attendanceError = basicResult.error;
      } else {
        newAttendance = result.data;
        attendanceError = result.error;
      }

      if (attendanceError) throw attendanceError;

      // Try to apply consensus (function may not exist if migration not run)
      try {
        await supabase.rpc('apply_event_consensus', { p_event_id: eventId });
        console.log('[EventStore] Applied consensus for event:', eventId);
      } catch (consensusError) {
        // Consensus function doesn't exist yet, that's ok
        console.log('[EventStore] Consensus function not available, skipping');
      }

      // Refresh events
      await get().fetchAttendedEvents(userId);

      return { success: true, attendedEventId: newAttendance.id, eventId };
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

  getEventConsensus: async (eventId) => {
    try {
      const { data, error } = await supabase.rpc('get_event_consensus', {
        p_event_id: eventId,
      });

      if (error) throw error;

      const consensus = (data || []) as EventConsensus[];
      const hasConflicts = consensus.some((c) => c.has_conflict);

      return { consensus, hasConflicts };
    } catch (error) {
      console.error('[EventStore] Error getting consensus:', error);
      return { consensus: [], hasConflicts: false };
    }
  },

  resolveEventConflict: async (eventId, attendanceId, field, value) => {
    try {
      // Update the user's submitted value
      const updateField = `submitted_${field}`;
      const { error: updateError } = await supabase
        .from('attended_events')
        .update({ [updateField]: value, submitted_at: new Date().toISOString() })
        .eq('id', attendanceId);

      if (updateError) throw updateError;

      // Re-apply consensus to update the event
      await supabase.rpc('apply_event_consensus', { p_event_id: eventId });

      // Refresh the attended events to get updated data
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await get().fetchAttendedEvents(user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('[EventStore] Error resolving conflict:', error);
      return { success: false, error: (error as Error).message };
    }
  },
}));
