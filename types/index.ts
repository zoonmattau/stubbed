// Core entity types
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_sport: string | null;
  favorite_team: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  country: string;
  created_at: string;
}

export interface Team {
  id: string;
  sport_id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  home_venue: string | null;
  city: string | null;
  state: string | null;
  country: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: string | null;
  sport_id: string | null;
  position: string | null;
  jersey_number: number | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  sport_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  venue_id: string | null;
  event_date: string;
  event_time: string | null;
  season: string | null;
  round: string | null;
  competition: string | null;
  home_score: string | null;
  away_score: string | null;
  winner_team_id: string | null;
  is_draw: boolean;
  is_abandoned: boolean;
  is_verified: boolean;
  created_by: string | null;
  created_at: string;
  // Text fields for manual entry (when team/venue aren't in database)
  home_team_name?: string | null;
  away_team_name?: string | null;
  venue_name?: string | null;
  sport_name?: string | null;
}

export interface AttendedEvent {
  id: string;
  user_id: string;
  event_id: string;
  section: string | null;
  seat_info: string | null;
  ticket_price: number | null;
  rating: number | null;
  notes: string | null;
  photo_urls: string[] | null;
  atmosphere_rating: number | null;
  went_with: string[] | null;
  went_with_user_ids: string[] | null;
  is_favorite: boolean;
  supported_team: 'home' | 'away' | 'neutral' | null;
  result: 'win' | 'loss' | 'draw' | 'no_result' | null;
  created_at: string;
  // User-submitted event data for consensus
  submitted_home_score?: string | null;
  submitted_away_score?: string | null;
  submitted_round?: string | null;
  submitted_event_time?: string | null;
  submitted_competition?: string | null;
  submitted_at?: string | null;
}

// Consensus result for an event field
export interface EventConsensus {
  field_name: string;
  consensus_value: string | null;
  vote_count: number;
  total_votes: number;
  has_conflict: boolean;
}

export interface EventLineup {
  id: string;
  event_id: string;
  player_id: string;
  team_id: string;
  was_starter: boolean;
  created_at: string;
}

// Social types
export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface ActivityFeed {
  id: string;
  user_id: string;
  activity_type: 'attended_event' | 'achievement_unlocked' | 'milestone';
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Gamification types
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: 'attendance' | 'diversity' | 'loyalty' | 'special';
  requirement_type: 'count' | 'specific' | 'streak';
  requirement_value: Record<string, unknown> | null;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface UserStats {
  user_id: string;
  total_events: number;
  total_sports: number;
  total_teams: number;
  total_venues: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  favorite_sport_id: string | null;
  favorite_team_id: string | null;
  favorite_venue_id: string | null;
  win_percentage: number | null;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: 'weekly' | 'monthly' | 'team_specific';
  reference_id: string | null;
  current_count: number;
  best_count: number;
  last_event_date: string | null;
  updated_at: string;
}

// Extended types with relations
export interface EventWithDetails extends Event {
  sport?: Sport;
  home_team?: Team;
  away_team?: Team;
  venue?: Venue;
}

export interface AttendedEventWithDetails extends AttendedEvent {
  event?: EventWithDetails;
}

export interface AchievementWithStatus extends Achievement {
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface FriendWithProfile extends Friendship {
  profile?: Profile;
}

// Form types
export interface EventFormData {
  sport_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string;
  event_date: string;
  event_time?: string;
  season?: string;
  round?: string;
  competition?: string;
  home_score?: string;
  away_score?: string;
  winner_team_id?: string;
  is_draw?: boolean;
}

export interface AttendanceFormData {
  event_id: string;
  section?: string;
  seat_info?: string;
  ticket_price?: number;
  rating?: number;
  notes?: string;
  photo_urls?: string[];
  atmosphere_rating?: number;
  went_with?: string[];
  went_with_user_ids?: string[];
  is_favorite?: boolean;
  supported_team?: 'home' | 'away' | 'neutral' | null;
}

// Event tag invitation types
export interface EventTagInvitation {
  id: string;
  attended_event_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
}

export interface EventTagInvitationWithDetails extends EventTagInvitation {
  from_user?: Profile;
  attended_event?: AttendedEventWithDetails;
}

// Tagged user display type
export interface TaggedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}
