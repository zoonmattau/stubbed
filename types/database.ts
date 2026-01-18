export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_sport?: string | null;
          favorite_team?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_sport?: string | null;
          favorite_team?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sports: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          country: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          country?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          country?: string;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          sport_id: string | null;
          name: string;
          short_name: string | null;
          logo_url: string | null;
          home_venue: string | null;
          city: string | null;
          state: string | null;
          country: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sport_id?: string | null;
          name: string;
          short_name?: string | null;
          logo_url?: string | null;
          home_venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sport_id?: string | null;
          name?: string;
          short_name?: string | null;
          logo_url?: string | null;
          home_venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          created_at?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          state: string | null;
          country: string;
          capacity: number | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          state?: string | null;
          country?: string;
          capacity?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string | null;
          state?: string | null;
          country?: string;
          capacity?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          name: string;
          team_id: string | null;
          sport_id: string | null;
          position: string | null;
          jersey_number: number | null;
          photo_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          team_id?: string | null;
          sport_id?: string | null;
          position?: string | null;
          jersey_number?: number | null;
          photo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          team_id?: string | null;
          sport_id?: string | null;
          position?: string | null;
          jersey_number?: number | null;
          photo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      events: {
        Row: {
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
          is_verified: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sport_id?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          venue_id?: string | null;
          event_date: string;
          event_time?: string | null;
          season?: string | null;
          round?: string | null;
          competition?: string | null;
          home_score?: string | null;
          away_score?: string | null;
          winner_team_id?: string | null;
          is_draw?: boolean;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sport_id?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          venue_id?: string | null;
          event_date?: string;
          event_time?: string | null;
          season?: string | null;
          round?: string | null;
          competition?: string | null;
          home_score?: string | null;
          away_score?: string | null;
          winner_team_id?: string | null;
          is_draw?: boolean;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      attended_events: {
        Row: {
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
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          section?: string | null;
          seat_info?: string | null;
          ticket_price?: number | null;
          rating?: number | null;
          notes?: string | null;
          photo_urls?: string[] | null;
          atmosphere_rating?: number | null;
          went_with?: string[] | null;
          is_favorite?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          section?: string | null;
          seat_info?: string | null;
          ticket_price?: number | null;
          rating?: number | null;
          notes?: string | null;
          photo_urls?: string[] | null;
          atmosphere_rating?: number | null;
          went_with?: string[] | null;
          is_favorite?: boolean;
          created_at?: string;
        };
      };
      event_lineups: {
        Row: {
          id: string;
          event_id: string;
          player_id: string;
          team_id: string;
          was_starter: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          player_id: string;
          team_id: string;
          was_starter?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          player_id?: string;
          team_id?: string;
          was_starter?: boolean;
          created_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          reference_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          reference_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          reference_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon: string | null;
          category: string;
          requirement_type: string;
          requirement_value: Json | null;
          points: number;
          rarity: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          category: string;
          requirement_type: string;
          requirement_value?: Json | null;
          points?: number;
          rarity: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          category?: string;
          requirement_type?: string;
          requirement_value?: Json | null;
          points?: number;
          rarity?: string;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
      };
      user_stats: {
        Row: {
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
        };
        Insert: {
          user_id: string;
          total_events?: number;
          total_sports?: number;
          total_teams?: number;
          total_venues?: number;
          current_streak?: number;
          longest_streak?: number;
          total_points?: number;
          favorite_sport_id?: string | null;
          favorite_team_id?: string | null;
          favorite_venue_id?: string | null;
          win_percentage?: number | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_events?: number;
          total_sports?: number;
          total_teams?: number;
          total_venues?: number;
          current_streak?: number;
          longest_streak?: number;
          total_points?: number;
          favorite_sport_id?: string | null;
          favorite_team_id?: string | null;
          favorite_venue_id?: string | null;
          win_percentage?: number | null;
          updated_at?: string;
        };
      };
      user_streaks: {
        Row: {
          id: string;
          user_id: string;
          streak_type: string;
          reference_id: string | null;
          current_count: number;
          best_count: number;
          last_event_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          streak_type: string;
          reference_id?: string | null;
          current_count?: number;
          best_count?: number;
          last_event_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          streak_type?: string;
          reference_id?: string | null;
          current_count?: number;
          best_count?: number;
          last_event_date?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
