// ESPN API Service
// Public API - no authentication required
// Note: ESPN API primarily covers American sports well. Cricket and some other sports are not available.

export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: ESPNCompetition[];
}

export interface ESPNCompetition {
  id: string;
  date: string;
  attendance?: number;
  venue?: ESPNVenue;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
}

export interface ESPNVenue {
  id: string;
  fullName: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  capacity?: number;
}

export interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  winner?: boolean;
  score?: string;
  team: ESPNTeam;
}

export interface ESPNTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  color?: string;
}

export interface ESPNStatus {
  type: {
    id: string;
    name: string;
    state: 'pre' | 'in' | 'post';
    completed: boolean;
  };
}

export interface ESPNSearchResult {
  id: string;
  name: string;
  shortName: string;
  date: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  venue?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  homeScore?: string;
  awayScore?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  sport: string;
  league: string;
}

// Sport configurations for ESPN API - organized by sport type
export const ESPN_SPORTS = {
  // American Football
  nfl: { sport: 'football', league: 'nfl', name: 'NFL' },
  college_football: { sport: 'football', league: 'college-football', name: 'College Football' },

  // Basketball
  nba: { sport: 'basketball', league: 'nba', name: 'NBA' },
  wnba: { sport: 'basketball', league: 'wnba', name: 'WNBA' },
  college_basketball: { sport: 'basketball', league: 'mens-college-basketball', name: 'College Basketball' },

  // Baseball
  mlb: { sport: 'baseball', league: 'mlb', name: 'MLB' },

  // Ice Hockey
  nhl: { sport: 'hockey', league: 'nhl', name: 'NHL' },

  // Soccer / Football
  mls: { sport: 'soccer', league: 'usa.1', name: 'MLS' },
  epl: { sport: 'soccer', league: 'eng.1', name: 'Premier League' },
  laliga: { sport: 'soccer', league: 'esp.1', name: 'La Liga' },
  bundesliga: { sport: 'soccer', league: 'ger.1', name: 'Bundesliga' },
  serie_a: { sport: 'soccer', league: 'ita.1', name: 'Serie A' },
  ligue_1: { sport: 'soccer', league: 'fra.1', name: 'Ligue 1' },
  champions_league: { sport: 'soccer', league: 'uefa.champions', name: 'Champions League' },
  aleague: { sport: 'soccer', league: 'aus.1', name: 'A-League' },

  // Australian Football
  afl: { sport: 'australian-football', league: 'afl', name: 'AFL' },

  // Rugby League
  nrl: { sport: 'rugby-league', league: 'nrl', name: 'NRL' },

  // Rugby Union
  super_rugby: { sport: 'rugby', league: 'super14', name: 'Super Rugby' },
} as const;

export type ESPNSportKey = keyof typeof ESPN_SPORTS;

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

/**
 * Fetch events from ESPN API for a specific sport/league
 */
export async function fetchESPNEvents(
  sportKey: ESPNSportKey,
  options?: {
    dates?: string; // Format: YYYYMMDD or YYYYMMDD-YYYYMMDD for range
    limit?: number;
  }
): Promise<ESPNSearchResult[]> {
  const config = ESPN_SPORTS[sportKey];

  let url = `${BASE_URL}/${config.sport}/${config.league}/scoreboard`;

  const params = new URLSearchParams();
  if (options?.dates) {
    params.append('dates', options.dates);
  }
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();

    return parseESPNResponse(data, sportKey);
  } catch (error) {
    console.error('Error fetching ESPN events:', error);
    return [];
  }
}

/**
 * Search for events by team name across multiple leagues
 */
export async function searchESPNEvents(
  query: string,
  sportKeys?: ESPNSportKey[]
): Promise<ESPNSearchResult[]> {
  const sportsToSearch = sportKeys || (Object.keys(ESPN_SPORTS) as ESPNSportKey[]);
  const queryLower = query.toLowerCase();

  // Fetch from multiple sports in parallel
  const promises = sportsToSearch.map(async (sportKey) => {
    try {
      const events = await fetchESPNEvents(sportKey);
      // Filter by team name match
      return events.filter(
        (event) =>
          event.homeTeam.name.toLowerCase().includes(queryLower) ||
          event.awayTeam.name.toLowerCase().includes(queryLower) ||
          event.homeTeam.shortName.toLowerCase().includes(queryLower) ||
          event.awayTeam.shortName.toLowerCase().includes(queryLower) ||
          event.venue?.name.toLowerCase().includes(queryLower) ||
          event.venue?.city?.toLowerCase().includes(queryLower)
      );
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get upcoming events for a specific date range
 */
export async function getUpcomingEvents(
  sportKey: ESPNSportKey,
  daysAhead: number = 7
): Promise<ESPNSearchResult[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const startDate = formatDateForESPN(today);
  const endDate = formatDateForESPN(futureDate);

  return fetchESPNEvents(sportKey, {
    dates: `${startDate}-${endDate}`,
  });
}

/**
 * Get recent/past events
 */
export async function getRecentEvents(
  sportKey: ESPNSportKey,
  daysBack: number = 7
): Promise<ESPNSearchResult[]> {
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - daysBack);

  const startDate = formatDateForESPN(pastDate);
  const endDate = formatDateForESPN(today);

  return fetchESPNEvents(sportKey, {
    dates: `${startDate}-${endDate}`,
  });
}

// Helper to format date for ESPN API
function formatDateForESPN(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// Parse ESPN API response into our format
function parseESPNResponse(data: any, sportKey: ESPNSportKey): ESPNSearchResult[] {
  const events: ESPNEvent[] = data.events || [];
  const config = ESPN_SPORTS[sportKey];

  return events.map((event) => {
    const competition = event.competitions[0];
    const homeCompetitor = competition?.competitors?.find((c: ESPNCompetitor) => c.homeAway === 'home');
    const awayCompetitor = competition?.competitors?.find((c: ESPNCompetitor) => c.homeAway === 'away');

    let status: 'scheduled' | 'in_progress' | 'completed' = 'scheduled';
    if (competition?.status?.type?.state === 'in') {
      status = 'in_progress';
    } else if (competition?.status?.type?.completed) {
      status = 'completed';
    }

    return {
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      homeTeam: {
        id: homeCompetitor?.team?.id || '',
        name: homeCompetitor?.team?.displayName || homeCompetitor?.team?.name || 'TBA',
        shortName: homeCompetitor?.team?.abbreviation || homeCompetitor?.team?.shortDisplayName || 'TBA',
        logo: homeCompetitor?.team?.logo,
      },
      awayTeam: {
        id: awayCompetitor?.team?.id || '',
        name: awayCompetitor?.team?.displayName || awayCompetitor?.team?.name || 'TBA',
        shortName: awayCompetitor?.team?.abbreviation || awayCompetitor?.team?.shortDisplayName || 'TBA',
        logo: awayCompetitor?.team?.logo,
      },
      venue: competition?.venue
        ? {
            id: competition.venue.id,
            name: competition.venue.fullName,
            city: competition.venue.address?.city,
            state: competition.venue.address?.state,
          }
        : undefined,
      homeScore: homeCompetitor?.score,
      awayScore: awayCompetitor?.score,
      status,
      sport: config.sport,
      league: config.name,
    };
  });
}

// Get sport display info
export function getSportDisplayInfo(sportKey: ESPNSportKey) {
  return ESPN_SPORTS[sportKey];
}

// Group sports by category for UI - organized by sport type
export const SPORT_CATEGORIES = {
  'American Football': ['nfl', 'college_football'],
  'Basketball': ['nba', 'wnba', 'college_basketball'],
  'Baseball': ['mlb'],
  'Ice Hockey': ['nhl'],
  'Soccer': ['epl', 'laliga', 'bundesliga', 'serie_a', 'ligue_1', 'champions_league', 'mls', 'aleague'],
  'Australian Football': ['afl'],
  'Rugby': ['nrl', 'super_rugby'],
} as const;
