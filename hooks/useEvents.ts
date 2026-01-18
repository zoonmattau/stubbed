import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';

export function useEvents() {
  const { user } = useAuthStore();
  const {
    attendedEvents,
    sports,
    teams,
    venues,
    isLoading,
    error,
    fetchAttendedEvents,
    fetchSports,
    fetchTeams,
    fetchVenues,
    addAttendedEvent,
    updateAttendedEvent,
    deleteAttendedEvent,
    searchEvents,
  } = useEventsStore();

  useEffect(() => {
    if (user?.id) {
      fetchAttendedEvents(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSports();
    fetchVenues();
  }, []);

  const refresh = useCallback(async () => {
    if (user?.id) {
      await fetchAttendedEvents(user.id);
    }
  }, [user?.id]);

  const addEvent = useCallback(
    async (
      eventData: Parameters<typeof addAttendedEvent>[1],
      attendanceData: Parameters<typeof addAttendedEvent>[2]
    ) => {
      if (!user?.id) return { success: false, error: 'Not authenticated' };
      return addAttendedEvent(user.id, eventData, attendanceData);
    },
    [user?.id]
  );

  return {
    events: attendedEvents,
    sports,
    teams,
    venues,
    isLoading,
    error,
    refresh,
    addEvent,
    updateEvent: updateAttendedEvent,
    deleteEvent: deleteAttendedEvent,
    searchEvents,
    fetchTeams,
  };
}
