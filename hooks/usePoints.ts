import { useMemo } from 'react';
import type { AttendedEventWithDetails } from '@/types';

// Point values
const POINTS = {
  ATTEND_EVENT: 10,      // Base points for attending any event
  TEAM_WIN: 15,          // Bonus when your supported team wins
  WIN_STREAK_3: 25,      // Bonus for 3-game win streak with a team
  WIN_STREAK_5: 50,      // Bonus for 5-game win streak
  WIN_STREAK_10: 100,    // Bonus for 10-game win streak
  NEW_TEAM: 5,           // First time seeing a team play
  NEW_SPORT: 10,         // First time attending a sport
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
      const homeTeamId = event.home_team_id || event.home_team?.name;
      const awayTeamId = event.away_team_id || event.away_team?.name;
      const homeTeamName = event.home_team?.name || 'Unknown';
      const awayTeamName = event.away_team?.name || 'Unknown';

      if (homeTeamId && !seenTeams.has(homeTeamId)) {
        seenTeams.add(homeTeamId);
        discoveryBonuses += POINTS.NEW_TEAM;
        newTeamsCount++;
      }
      if (awayTeamId && !seenTeams.has(awayTeamId)) {
        seenTeams.add(awayTeamId);
        discoveryBonuses += POINTS.NEW_TEAM;
        newTeamsCount++;
      }

      // Track new sports
      const sportId = event.sport_id || event.sport?.name;
      if (sportId && !seenSports.has(sportId)) {
        seenSports.add(sportId);
        discoveryBonuses += POINTS.NEW_SPORT;
      }

      // Track new venues
      const venueId = event.venue_id || event.venue?.name;
      if (venueId && !seenVenues.has(venueId)) {
        seenVenues.add(venueId);
        discoveryBonuses += POINTS.NEW_VENUE;
      }

      // Team win points and streak tracking (only for non-neutral supporters)
      if (attended.supported_team && attended.supported_team !== 'neutral') {
        const supportedTeamId = attended.supported_team === 'home' ? homeTeamId : awayTeamId;
        const supportedTeamName = attended.supported_team === 'home' ? homeTeamName : awayTeamName;

        if (supportedTeamId) {
          // Check if user's team won
          if (attended.result === 'win') {
            teamWins++;
            winPoints += POINTS.TEAM_WIN;

            // Track win streak for this team
            if (!teamWinStreaks[supportedTeamId]) {
              teamWinStreaks[supportedTeamId] = 0;
              teamStreakBonusesEarned[supportedTeamId] = new Set();
            }
            teamWinStreaks[supportedTeamId]++;

            const streak = teamWinStreaks[supportedTeamId];
            const earnedSet = teamStreakBonusesEarned[supportedTeamId];

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
            teamWinStreaks[supportedTeamId] = 0;
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
