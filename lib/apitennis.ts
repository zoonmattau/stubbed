// API-Tennis Service
// Docs: https://api-tennis.com/documentation

const API_KEY = process.env.EXPO_PUBLIC_APITENNIS_KEY || '';
const BASE_URL = 'https://api.api-tennis.com/tennis/';

// Check if API key is configured
export function isApiKeyConfigured(): boolean {
  return API_KEY.length > 0;
}

// Types
export interface ApiTennisMatch {
  event_key: string;
  event_date: string;
  event_time: string;
  event_first_player: string;
  first_player_key: string;
  event_second_player: string;
  second_player_key: string;
  event_final_result: string;
  event_game_result: string;
  event_serve: string | null;
  event_winner: string | null;
  event_status: string;
  event_type_type: string;
  tournament_name: string;
  tournament_key: string;
  tournament_round: string;
  tournament_season: string;
  event_live: string;
  event_first_player_logo: string | null;
  event_second_player_logo: string | null;
  event_country_key: string;
  event_court_type: string | null;
  pointbypoint?: any[];
  scores?: ApiTennisScore[];
}

export interface ApiTennisScore {
  score_first: string;
  score_second: string;
  score_set: string;
  score_first_tiebreak?: string;
  score_second_tiebreak?: string;
}

export interface ApiTennisPlayer {
  player_key: string;
  player_name: string;
  player_country: string;
  player_birthday: string | null;
  player_weight: string | null;
  player_height: string | null;
  player_hand: string | null;
  player_backhand: string | null;
  player_coach: string | null;
  player_turned_pro: string | null;
  player_logo: string | null;
}

export interface ApiTennisRanking {
  player_key: string;
  player: string;           // API returns 'player' not 'player_name'
  country: string;          // API returns 'country' not 'player_country'
  place: string;            // API returns 'place' not 'rank'
  points: string;           // API returns 'points' not 'rank_points'
  movement: string;         // API returns 'movement' not 'ranking_movement'
  league: string;
  player_logo?: string | null;
}

export interface ApiTennisTournament {
  tournament_key: string;
  tournament_name: string;
  tournament_country: string;
  tournament_surface: string | null;
  tournament_season: string;
  start_date: string;
  end_date: string;
}

// Parsed types for app use
export interface TennisMatchResult {
  id: string;
  date: string;
  time: string;
  player1: {
    key: string;
    name: string;
    logo?: string;
  };
  player2: {
    key: string;
    name: string;
    logo?: string;
  };
  score: string;
  setScores: { player1: string; player2: string; player1Tiebreak?: string; player2Tiebreak?: string }[];
  winner?: string;
  status: 'scheduled' | 'live' | 'completed';
  tournament: {
    key: string;
    name: string;
    round: string;
    season: string;
  };
  surface?: string;
  isLive: boolean;
  eventType: string; // e.g., "ATP Singles", "WTA Doubles", etc.
  category: 'mens' | 'womens' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles' | 'boys' | 'girls' | 'other';
}

export interface TennisPlayerResult {
  id: string;
  name: string;
  country: string;
  birthday?: string;
  weight?: string;
  height?: string;
  hand?: string;
  backhand?: string;
  coach?: string;
  turnedPro?: string;
  logo?: string;
}

export interface TennisRankingResult {
  playerId: string;
  playerName: string;
  country: string;
  rank: number;
  points: number;
  movement: string;
  logo?: string;
}

// API Functions

/**
 * Fetch tennis matches/fixtures for a date range
 */
export async function fetchTennisMatches(options?: {
  dateStart?: string;
  dateStop?: string;
  tournamentKey?: string;
  playerKey?: string;
}): Promise<TennisMatchResult[]> {
  try {
    const params = new URLSearchParams({
      method: 'get_fixtures',
      APIkey: API_KEY,
    });

    if (options?.dateStart) params.append('date_start', options.dateStart);
    if (options?.dateStop) params.append('date_stop', options.dateStop);
    if (options?.tournamentKey) params.append('tournament_key', options.tournamentKey);
    if (options?.playerKey) params.append('player_key', options.playerKey);

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const matches: ApiTennisMatch[] = data.result || [];
    return matches.map(parseMatch);
  } catch (error) {
    return [];
  }
}

/**
 * Fetch live tennis scores
 */
export async function fetchTennisLiveScores(options?: {
  tournamentKey?: string;
  playerKey?: string;
}): Promise<TennisMatchResult[]> {
  try {
    const params = new URLSearchParams({
      method: 'get_livescore',
      APIkey: API_KEY,
    });

    if (options?.tournamentKey) params.append('tournament_key', options.tournamentKey);
    if (options?.playerKey) params.append('player_key', options.playerKey);

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const matches: ApiTennisMatch[] = data.result || [];
    return matches.map(parseMatch);
  } catch (error) {
    return [];
  }
}

/**
 * Fetch tennis player details
 */
export async function fetchTennisPlayer(playerKey: string): Promise<TennisPlayerResult | null> {
  try {
    const params = new URLSearchParams({
      method: 'get_players',
      APIkey: API_KEY,
      player_key: playerKey,
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const players: ApiTennisPlayer[] = data.result || [];
    if (players.length === 0) return null;

    return parsePlayer(players[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    return null;
  }
}

/**
 * Search tennis players by tournament
 */
export async function fetchTennisPlayersByTournament(tournamentKey: string): Promise<TennisPlayerResult[]> {
  try {
    const params = new URLSearchParams({
      method: 'get_players',
      APIkey: API_KEY,
      tournament_key: tournamentKey,
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const players: ApiTennisPlayer[] = data.result || [];
    return players.map(parsePlayer);
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
}

/**
 * Fetch ATP or WTA rankings
 */
export async function fetchTennisRankings(eventType: 'ATP' | 'WTA'): Promise<TennisRankingResult[]> {
  try {
    const params = new URLSearchParams({
      method: 'get_standings',
      APIkey: API_KEY,
      event_type: eventType,
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const rankings: ApiTennisRanking[] = data.result || [];
    return rankings.map(parseRanking);
  } catch (error) {
    return [];
  }
}

/**
 * Fetch all tournaments
 */
export async function fetchTennisTournaments(): Promise<ApiTennisTournament[]> {
  try {
    const params = new URLSearchParams({
      method: 'get_tournaments',
      APIkey: API_KEY,
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    return data.result || [];
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

/**
 * Fetch head-to-head between two players
 */
export async function fetchTennisH2H(player1Key: string, player2Key: string): Promise<TennisMatchResult[]> {
  try {
    const params = new URLSearchParams({
      method: 'get_H2H',
      APIkey: API_KEY,
      first_player_key: player1Key,
      second_player_key: player2Key,
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-Tennis error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // H2H returns firstPlayer_VS_secondPlayer with matches inside
    const h2hData = data.result?.firstPlayer_VS_secondPlayer || [];
    return h2hData.map(parseMatch);
  } catch (error) {
    console.error('Error fetching H2H:', error);
    return [];
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date range for next N days
 */
export function getDateRange(days: number): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// Category order for sorting
export const CATEGORY_ORDER = [
  'mens',
  'womens',
  'mens_doubles',
  'womens_doubles',
  'mixed_doubles',
  'boys',
  'girls',
  'other',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  mens: "Men's Singles",
  womens: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
  boys: "Boys",
  girls: "Girls",
  other: "Other",
};

// Determine category from event_type_type
function getCategory(eventType: string): TennisMatchResult['category'] {
  const lower = eventType.toLowerCase();

  if (lower.includes('mixed') && lower.includes('double')) return 'mixed_doubles';
  if (lower.includes('boys')) return 'boys';
  if (lower.includes('girls')) return 'girls';

  const isDoubles = lower.includes('double');
  const isMens = lower.includes('atp') || lower.includes('men') || lower.includes("men's");
  const isWomens = lower.includes('wta') || lower.includes('women') || lower.includes("women's");

  if (isDoubles) {
    if (isMens) return 'mens_doubles';
    if (isWomens) return 'womens_doubles';
    return 'other';
  }

  if (isMens) return 'mens';
  if (isWomens) return 'womens';

  return 'other';
}

// Parse functions
function parseMatch(match: ApiTennisMatch): TennisMatchResult {
  let status: 'scheduled' | 'live' | 'completed' = 'scheduled';
  if (match.event_live === '1') {
    status = 'live';
  } else if (match.event_status === 'Finished' || match.event_winner) {
    status = 'completed';
  }

  const setScores = (match.scores || []).map((s) => {
    // Parse scores - handle tiebreak format like "7.8" -> { score: "7", tiebreak: "8" }
    const parseScore = (score: string): { score: string; tiebreak?: string } => {
      if (score && score.includes('.')) {
        const [mainScore, tiebreak] = score.split('.');
        return { score: mainScore, tiebreak };
      }
      return { score };
    };

    const p1 = parseScore(s.score_first);
    const p2 = parseScore(s.score_second);

    return {
      player1: p1.score,
      player2: p2.score,
      player1Tiebreak: p1.tiebreak || s.score_first_tiebreak,
      player2Tiebreak: p2.tiebreak || s.score_second_tiebreak,
    };
  });

  const eventType = match.event_type_type || '';
  const category = getCategory(eventType);

  return {
    id: match.event_key,
    date: match.event_date,
    time: match.event_time,
    player1: {
      key: match.first_player_key,
      name: match.event_first_player,
      logo: match.event_first_player_logo || undefined,
    },
    player2: {
      key: match.second_player_key,
      name: match.event_second_player,
      logo: match.event_second_player_logo || undefined,
    },
    score: match.event_final_result || '',
    setScores,
    winner: match.event_winner || undefined,
    status,
    tournament: {
      key: match.tournament_key,
      name: match.tournament_name,
      round: match.tournament_round,
      season: match.tournament_season,
    },
    surface: match.event_court_type || undefined,
    isLive: match.event_live === '1',
    eventType,
    category,
  };
}

function parsePlayer(player: ApiTennisPlayer): TennisPlayerResult {
  return {
    id: player.player_key,
    name: player.player_name,
    country: player.player_country,
    birthday: player.player_birthday || undefined,
    weight: player.player_weight || undefined,
    height: player.player_height || undefined,
    hand: player.player_hand || undefined,
    backhand: player.player_backhand || undefined,
    coach: player.player_coach || undefined,
    turnedPro: player.player_turned_pro || undefined,
    logo: player.player_logo || undefined,
  };
}

function parseRanking(ranking: ApiTennisRanking): TennisRankingResult {
  return {
    playerId: ranking.player_key,
    playerName: ranking.player,
    country: ranking.country,
    rank: parseInt(ranking.place, 10),
    points: parseInt(ranking.points, 10),
    movement: ranking.movement,
    logo: ranking.player_logo || undefined,
  };
}
