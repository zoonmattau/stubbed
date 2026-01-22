import { useMemo } from 'react';
import type { AttendedEventWithDetails } from '@/types';

// Point values
const POINTS = {
  ATTEND_EVENT: 10,      // Base points for attending any event
  TEAM_WIN: 5,           // Bonus when your supported team wins
  WIN_STREAK_3: 15,      // Bonus for 3-game win streak with a team
  WIN_STREAK_5: 30,      // Bonus for 5-game win streak
  WIN_STREAK_10: 75,     // Bonus for 10-game win streak
  NEW_TEAM: 5,           // First time seeing a team play
  NEW_SPORT: 5,          // First time attending a sport
  NEW_VENUE: 5,          // First time visiting a venue
};

interface PointsBreakdown {
  totalPoints: number;
  attendancePoints: number;
  winPoints: number;
  streakBonuses: number;
  discoveryBonuses: number;
  details: {
    eventsAttended: number;
    teamWins: number;
    streaks: { teamName: string; count: number; bonus: number }[];
    newTeams: number;
    newSports: number;
    newVenues: number;
  };
}

export function usePoints(attendedEvents: AttendedEventWithDetails[]): PointsBreakdown {
  return useMemo(() => {
    let attendancePoints = 0;
    let winPoints = 0;
    let streakBonuses = 0;
    let discoveryBonuses = 0;

    const seenTeams = new Set<string>();
    const seenSports = new Set<string>();
    const seenVenues = new Set<string>();
    const teamWinStreaks: Record<string, number> = {};
    const teamStreakBonusesEarned: Record<string, Set<number>> = {};
    const streakDetails: { teamName: string; count: number; bonus: number }[] = [];

    let teamWins = 0;
    let newTeamsCount = 0;

    // Sort events by date (oldest first) to track streaks correctly
    const sortedEvents = [...attendedEvents].sort((a, b) => {
      const dateA = new Date(a.event?.event_date || a.created_at);
      const dateB = new Date(b.event?.event_date || b.created_at);
      return dateA.getTime() - dateB.getTime();
    });

    sortedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      // Base attendance points
      attendancePoints += POINTS.ATTEND_EVENT;

      // Track new teams (discovery bonus)
      // Use FK relations first, fall back to text fields for manual entries
      const homeTeamKey = event.home_team_id || event.home_team?.name || event.home_team_name;
      const awayTeamKey = event.away_team_id || event.away_team?.name || event.away_team_name;
      const homeTeamName = event.home_team?.name || event.home_team_name || 'Unknown';
      const awayTeamName = event.away_team?.name || event.away_team_name || 'Unknown';

      // Normalize team keys for consistent tracking (lowercase)
      const normalizedHomeKey = homeTeamKey?.toLowerCase().trim();
      const normalizedAwayKey = awayTeamKey?.toLowerCase().trim();

      if (normalizedHomeKey && !seenTeams.has(normalizedHomeKey)) {
        seenTeams.add(normalizedHomeKey);
        discoveryBonuses += POINTS.NEW_TEAM;
        newTeamsCount++;
      }
      if (normalizedAwayKey && !seenTeams.has(normalizedAwayKey)) {
        seenTeams.add(normalizedAwayKey);
        discoveryBonuses += POINTS.NEW_TEAM;
        newTeamsCount++;
      }

      // Track new sports (use FK or text field)
      const sportKey = event.sport_id || event.sport?.name || event.sport_name;
      const normalizedSportKey = sportKey?.toLowerCase().trim();
      if (normalizedSportKey && !seenSports.has(normalizedSportKey)) {
        seenSports.add(normalizedSportKey);
        discoveryBonuses += POINTS.NEW_SPORT;
      }

      // Track new venues (use FK or text field)
      const venueKey = event.venue_id || event.venue?.name || event.venue_name;
      const normalizedVenueKey = venueKey?.toLowerCase().trim();
      if (normalizedVenueKey && !seenVenues.has(normalizedVenueKey)) {
        seenVenues.add(normalizedVenueKey);
        discoveryBonuses += POINTS.NEW_VENUE;
      }

      // Team win points and streak tracking (only for non-neutral supporters)
      if (attended.supported_team && attended.supported_team !== 'neutral') {
        const supportedTeamKey = attended.supported_team === 'home' ? normalizedHomeKey : normalizedAwayKey;
        const supportedTeamName = attended.supported_team === 'home' ? homeTeamName : awayTeamName;

        if (supportedTeamKey) {
          // Check if user's team won
          if (attended.result === 'win') {
            teamWins++;
            winPoints += POINTS.TEAM_WIN;

            // Track win streak for this team
            if (!teamWinStreaks[supportedTeamKey]) {
              teamWinStreaks[supportedTeamKey] = 0;
              teamStreakBonusesEarned[supportedTeamKey] = new Set();
            }
            teamWinStreaks[supportedTeamKey]++;

            const streak = teamWinStreaks[supportedTeamKey];
            const earnedSet = teamStreakBonusesEarned[supportedTeamKey];

            // Award streak bonuses (only once per milestone)
            if (streak >= 3 && !earnedSet.has(3)) {
              streakBonuses += POINTS.WIN_STREAK_3;
              earnedSet.add(3);
              streakDetails.push({ teamName: supportedTeamName, count: 3, bonus: POINTS.WIN_STREAK_3 });
            }
            if (streak >= 5 && !earnedSet.has(5)) {
              streakBonuses += POINTS.WIN_STREAK_5;
              earnedSet.add(5);
              streakDetails.push({ teamName: supportedTeamName, count: 5, bonus: POINTS.WIN_STREAK_5 });
            }
            if (streak >= 10 && !earnedSet.has(10)) {
              streakBonuses += POINTS.WIN_STREAK_10;
              earnedSet.add(10);
              streakDetails.push({ teamName: supportedTeamName, count: 10, bonus: POINTS.WIN_STREAK_10 });
            }
          } else if (attended.result === 'loss') {
            // Reset streak on loss
            teamWinStreaks[supportedTeamKey] = 0;
          }
          // Draws don't reset or increment streaks
        }
      }
    });

    const totalPoints = attendancePoints + winPoints + streakBonuses + discoveryBonuses;

    return {
      totalPoints,
      attendancePoints,
      winPoints,
      streakBonuses,
      discoveryBonuses,
      details: {
        eventsAttended: attendedEvents.length,
        teamWins,
        streaks: streakDetails,
        newTeams: newTeamsCount,
        newSports: seenSports.size,
        newVenues: seenVenues.size,
      },
    };
  }, [attendedEvents]);
}

// Export point values for display
export { POINTS };
