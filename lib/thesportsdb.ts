// TheSportsDB API Service
// Paid tier with API key for better data access
// Docs: https://www.thesportsdb.com/api.php

export interface SportsDBPlayer {
  idPlayer: string;
  strPlayer: string;
  strNationality: string;
  strTeam: string;
  idTeam: string;
  strSport: string;
  strPosition: string;
  strHeight: string | null;
  strWeight: string | null;
  dateBorn: string | null;
  strBirthLocation: string | null;
  strDescriptionEN: string | null;
  strThumb: string | null;
  strCutout: string | null;
  strRender: string | null;
  strBanner: string | null;
  strFanart1: string | null;
}

export interface SportsDBPlayerResult {
  id: string;
  name: string;
  nationality: string;
  team: string;
  teamId: string;
  sport: string;
  position: string;
  height?: string;
  weight?: string;
  birthDate?: string;
  birthLocation?: string;
  description?: string;
  thumbnail?: string;
  cutout?: string;
}

export interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string | null;
  strAlternate: string | null;
  strSport: string;
  strLeague: string;
  idLeague: string;
  strStadium: string | null;
  strStadiumLocation: string | null;
  strDescriptionEN: string | null;
  strTeamBadge: string | null;
  strTeamJersey: string | null;
  strTeamLogo: string | null;
  strTeamBanner: string | null;
}

export interface SportsDBTeamResult {
  id: string;
  name: string;
  shortName?: string;
  sport: string;
  league: string;
  leagueId: string;
  stadium?: string;
  stadiumLocation?: string;
  description?: string;
  badge?: string;
  jersey?: string;
  logo?: string;
  banner?: string;
}

export interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strEventAlternate: string;
  strFilename: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strSeason: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  intRound: string | null;
  dateEvent: string;
  strTime: string;
  strTimestamp: string;
  strVenue: string | null;
  strCity: string | null;
  strCountry: string | null;
  strStatus: string | null;
  strPostponed: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
}

export interface SportsDBSearchResult {
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
  round?: string;
}

// TheSportsDB League IDs - organized by sport type
export const SPORTSDB_LEAGUES = {
  // Cricket (verified IDs from thesportsdb.com/sport/cricket)
  bbl: { id: '4461', name: 'Big Bash League', sport: 'Cricket' },
  ipl: { id: '4460', name: 'Indian Premier League', sport: 'Cricket' },
  the_hundred: { id: '5177', name: 'The Hundred', sport: 'Cricket' },
  psl: { id: '5067', name: 'Pakistan Super League', sport: 'Cricket' },
  t20_blast: { id: '4463', name: 'T20 Blast', sport: 'Cricket' },

  // Australian Sports
  afl_sdb: { id: '4456', name: 'AFL', sport: 'Australian Football' },
  nrl_sdb: { id: '4421', name: 'NRL', sport: 'Rugby League' },
  aleague_sdb: { id: '4429', name: 'A-League', sport: 'Soccer' },
  super_netball: { id: '4540', name: 'Super Netball', sport: 'Netball' },

  // Tennis (verified IDs)
  atp_tour: { id: '4464', name: 'ATP Tour', sport: 'Tennis' },
  wta_tour: { id: '4517', name: 'WTA Tour', sport: 'Tennis' },

  // Golf (verified IDs)
  pga_tour: { id: '4425', name: 'PGA Tour', sport: 'Golf' },
  lpga_tour: { id: '4553', name: 'LPGA Tour', sport: 'Golf' },
  european_tour: { id: '4426', name: 'DP World Tour', sport: 'Golf' },

  // Motorsport (verified IDs)
  formula_1: { id: '4370', name: 'Formula 1', sport: 'Motorsport' },
  motogp: { id: '4407', name: 'MotoGP', sport: 'Motorsport' },
  nascar: { id: '4393', name: 'NASCAR Cup Series', sport: 'Motorsport' },
  indycar: { id: '4373', name: 'IndyCar Series', sport: 'Motorsport' },
  v8_supercars: { id: '4489', name: 'Supercars Championship', sport: 'Motorsport' },
  wrc: { id: '4409', name: 'World Rally Championship', sport: 'Motorsport' },

  // Combat Sports (verified IDs)
  ufc: { id: '4443', name: 'UFC', sport: 'MMA' },
  boxing: { id: '4445', name: 'Boxing', sport: 'Boxing' },

  // Rugby Union (verified IDs)
  super_rugby_sdb: { id: '4551', name: 'Super Rugby', sport: 'Rugby Union' },
  six_nations: { id: '4714', name: 'Six Nations', sport: 'Rugby Union' },
  rugby_championship: { id: '4986', name: 'Rugby Championship', sport: 'Rugby Union' },

  // European Soccer (additional)
  eredivisie: { id: '4395', name: 'Eredivisie', sport: 'Soccer' },
  primeira_liga: { id: '4396', name: 'Primeira Liga', sport: 'Soccer' },
  scottish_premiership: { id: '4398', name: 'Scottish Premiership', sport: 'Soccer' },

  // South American Soccer
  brasileirao: { id: '4351', name: 'Brasileirão', sport: 'Soccer' },
  liga_argentina: { id: '4406', name: 'Liga Argentina', sport: 'Soccer' },

  // Other
  wnba_sdb: { id: '4431', name: 'WNBA', sport: 'Basketball' },
  euroleague: { id: '4485', name: 'EuroLeague', sport: 'Basketball' },
} as const;

export type SportsDBLeagueKey = keyof typeof SPORTSDB_LEAGUES;

// Use API key from environment, fallback to free tier
const API_KEY = process.env.EXPO_PUBLIC_SPORTSDB_API_KEY || '3';
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

/**
 * Get current season string (e.g., "2025-2026" or "2026")
 */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // For sports that run across calendar years (Aug-May), use "YYYY-YYYY+1" format
  // For calendar year sports (Jan-Dec), use "YYYY" format
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Fetch events for a league from TheSportsDB
 */
export async function fetchSportsDBEvents(
  leagueKey: SportsDBLeagueKey,
  options?: {
    season?: string;
    round?: string;
  }
): Promise<SportsDBSearchResult[]> {
  const league = SPORTSDB_LEAGUES[leagueKey];
  const season = options?.season || getCurrentSeason();

  try {
    // Try to get events for the season
    const url = `${BASE_URL}/eventsseason.php?id=${league.id}&s=${season}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const events: SportsDBEvent[] = data.events || [];

    return events.map((event) => parseEvent(event, league.sport, league.name));
  } catch (error) {
    console.error('Error fetching TheSportsDB events:', error);
    return [];
  }
}

/**
 * Get next upcoming events for a league
 */
export async function fetchNextEvents(
  leagueKey: SportsDBLeagueKey,
  limit: number = 15
): Promise<SportsDBSearchResult[]> {
  const league = SPORTSDB_LEAGUES[leagueKey];

  try {
    // Use eventsnextleague endpoint (works well with paid API)
    const url = `${BASE_URL}/eventsnextleague.php?id=${league.id}`;
    console.log('[SportsDB] Fetching next events:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const events: SportsDBEvent[] = (data.events || []).slice(0, limit);

    console.log('[SportsDB] Found', events.length, 'upcoming events for', league.name);
    return events.map((event) => parseEvent(event, league.sport, league.name));
  } catch (error) {
    console.error('Error fetching next events:', error);
    return [];
  }
}

/**
 * Get past/recent events for a league
 */
export async function fetchPastEvents(
  leagueKey: SportsDBLeagueKey,
  limit: number = 15
): Promise<SportsDBSearchResult[]> {
  const league = SPORTSDB_LEAGUES[leagueKey];

  try {
    // Use eventspastleague endpoint (works well with paid API)
    const url = `${BASE_URL}/eventspastleague.php?id=${league.id}`;
    console.log('[SportsDB] Fetching past events:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const events: SportsDBEvent[] = (data.events || []).slice(0, limit);

    console.log('[SportsDB] Found', events.length, 'past events for', league.name);
    return events.map((event) => parseEvent(event, league.sport, league.name));
  } catch (error) {
    console.error('Error fetching past events:', error);
    return [];
  }
}

/**
 * Search for a team by name
 */
export async function searchTeam(teamName: string): Promise<any[]> {
  try {
    const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
}

/**
 * Get next events for a specific team
 */
export async function fetchTeamNextEvents(teamId: string): Promise<SportsDBSearchResult[]> {
  try {
    const url = `${BASE_URL}/eventsnext.php?id=${teamId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const events: SportsDBEvent[] = data.events || [];

    return events.map((event) => parseEvent(event, event.strSport, event.strLeague));
  } catch (error) {
    console.error('Error fetching team events:', error);
    return [];
  }
}

/**
 * Get past events for a specific team
 */
export async function fetchTeamPastEvents(teamId: string): Promise<SportsDBSearchResult[]> {
  try {
    const url = `${BASE_URL}/eventslast.php?id=${teamId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const events: SportsDBEvent[] = data.events || [];

    return events.map((event) => parseEvent(event, event.strSport, event.strLeague));
  } catch (error) {
    console.error('Error fetching team past events:', error);
    return [];
  }
}

/**
 * Search for players by name
 */
export async function searchPlayers(playerName: string): Promise<SportsDBPlayerResult[]> {
  try {
    const url = `${BASE_URL}/searchplayers.php?p=${encodeURIComponent(playerName)}`;
    console.log('[SportsDB] Searching players:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const players: SportsDBPlayer[] = data.player || [];

    console.log('[SportsDB] Found', players.length, 'players matching', playerName);
    return players.map(parsePlayer);
  } catch (error) {
    console.error('Error searching players:', error);
    return [];
  }
}

/**
 * Search for players by team
 */
export async function searchPlayersByTeam(teamName: string): Promise<SportsDBPlayerResult[]> {
  try {
    const url = `${BASE_URL}/searchplayers.php?t=${encodeURIComponent(teamName)}`;
    console.log('[SportsDB] Searching players by team:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const players: SportsDBPlayer[] = data.player || [];

    console.log('[SportsDB] Found', players.length, 'players for team', teamName);
    return players.map(parsePlayer);
  } catch (error) {
    console.error('Error searching players by team:', error);
    return [];
  }
}

/**
 * Get player details by ID
 */
export async function getPlayerById(playerId: string): Promise<SportsDBPlayerResult | null> {
  try {
    const url = `${BASE_URL}/lookupplayer.php?id=${playerId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const players: SportsDBPlayer[] = data.players || [];

    if (players.length === 0) return null;
    return parsePlayer(players[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    return null;
  }
}

/**
 * Get team details by ID
 */
export async function getTeamById(teamId: string): Promise<SportsDBTeamResult | null> {
  try {
    const url = `${BASE_URL}/lookupteam.php?id=${teamId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const teams: SportsDBTeam[] = data.teams || [];

    if (teams.length === 0) return null;
    return parseTeam(teams[0]);
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

/**
 * Search teams with parsed results
 */
export async function searchTeams(teamName: string): Promise<SportsDBTeamResult[]> {
  try {
    const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    console.log('[SportsDB] Searching teams:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const teams: SportsDBTeam[] = data.teams || [];

    console.log('[SportsDB] Found', teams.length, 'teams matching', teamName);
    return teams.map(parseTeam);
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
}

// Parse player data to common format
function parsePlayer(player: SportsDBPlayer): SportsDBPlayerResult {
  return {
    id: player.idPlayer,
    name: player.strPlayer,
    nationality: player.strNationality || 'Unknown',
    team: player.strTeam || 'Free Agent',
    teamId: player.idTeam || '',
    sport: player.strSport || 'Unknown',
    position: player.strPosition || 'Unknown',
    height: player.strHeight || undefined,
    weight: player.strWeight || undefined,
    birthDate: player.dateBorn || undefined,
    birthLocation: player.strBirthLocation || undefined,
    description: player.strDescriptionEN || undefined,
    thumbnail: player.strThumb || player.strCutout || undefined,
    cutout: player.strCutout || undefined,
  };
}

// Parse team data to common format
function parseTeam(team: SportsDBTeam): SportsDBTeamResult {
  return {
    id: team.idTeam,
    name: team.strTeam,
    shortName: team.strTeamShort || team.strAlternate || undefined,
    sport: team.strSport || 'Unknown',
    league: team.strLeague || 'Unknown',
    leagueId: team.idLeague || '',
    stadium: team.strStadium || undefined,
    stadiumLocation: team.strStadiumLocation || undefined,
    description: team.strDescriptionEN || undefined,
    badge: team.strTeamBadge || undefined,
    jersey: team.strTeamJersey || undefined,
    logo: team.strTeamLogo || undefined,
    banner: team.strTeamBanner || undefined,
  };
}

// Parse TheSportsDB event to our common format
function parseEvent(event: SportsDBEvent, sport: string, league: string): SportsDBSearchResult {
  let status: 'scheduled' | 'in_progress' | 'completed' = 'scheduled';

  if (event.strStatus === 'Match Finished' || event.intHomeScore !== null) {
    status = 'completed';
  } else if (event.strStatus === 'In Progress' || event.strStatus === 'Live') {
    status = 'in_progress';
  }

  // Combine date and time
  const dateTime = event.strTimestamp
    ? event.strTimestamp
    : `${event.dateEvent}T${event.strTime || '00:00:00'}`;

  return {
    id: event.idEvent,
    name: event.strEvent,
    shortName: event.strEventAlternate || event.strEvent,
    date: dateTime,
    homeTeam: {
      id: event.idHomeTeam,
      name: event.strHomeTeam,
      shortName: event.strHomeTeam.split(' ').pop() || event.strHomeTeam,
      logo: event.strHomeTeamBadge || undefined,
    },
    awayTeam: {
      id: event.idAwayTeam,
      name: event.strAwayTeam,
      shortName: event.strAwayTeam.split(' ').pop() || event.strAwayTeam,
      logo: event.strAwayTeamBadge || undefined,
    },
    venue: event.strVenue
      ? {
          id: event.strVenue,
          name: event.strVenue,
          city: event.strCity || undefined,
        }
      : undefined,
    homeScore: event.intHomeScore || undefined,
    awayScore: event.intAwayScore || undefined,
    status,
    sport,
    league,
    round: event.intRound || undefined,
  };
}

// Get league display info
export function getLeagueInfo(leagueKey: SportsDBLeagueKey) {
  return SPORTSDB_LEAGUES[leagueKey];
}

// Group leagues by sport type for UI
export const SPORTSDB_CATEGORIES = {
  'Cricket': ['bbl', 'ipl', 'the_hundred', 'psl', 't20_blast'],
  'Tennis': ['atp_tour', 'wta_tour'],
  'Golf': ['pga_tour', 'lpga_tour', 'european_tour'],
  'Motorsport': ['formula_1', 'motogp', 'v8_supercars', 'nascar', 'indycar', 'wrc'],
  'Combat Sports': ['ufc', 'boxing'],
  'Rugby Union': ['super_rugby_sdb', 'six_nations', 'rugby_championship'],
  'Basketball': ['wnba_sdb', 'euroleague'],
  'Other Soccer': ['eredivisie', 'primeira_liga', 'scottish_premiership', 'brasileirao', 'liga_argentina'],
  'Australian Sports': ['afl_sdb', 'nrl_sdb', 'aleague_sdb', 'super_netball'],
} as const;
