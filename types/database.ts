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
          is_abandoned: boolean;
          is_verified: boolean;
          created_by: string | null;
          created_at: string;
          // Text fields for manual entry
          home_team_name: string | null;
          away_team_name: string | null;
          venue_name: string | null;
          sport_name: string | null;
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
          is_abandoned?: boolean;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
          home_team_name?: string | null;
          away_team_name?: string | null;
          venue_name?: string | null;
          sport_name?: string | null;
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
          is_abandoned?: boolean;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
          home_team_name?: string | null;
          away_team_name?: string | null;
          venue_name?: string | null;
          sport_name?: string | null;
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
          went_with_user_ids: string[] | null;
          is_favorite: boolean;
          is_abandoned: boolean;
          supported_team: 'home' | 'away' | 'neutral' | null;
          result: 'win' | 'loss' | 'draw' | 'no_result' | null;
          created_at: string;
          // User-submitted event data
          submitted_home_score: string | null;
          submitted_away_score: string | null;
          submitted_round: string | null;
          submitted_event_time: string | null;
          submitted_competition: string | null;
          submitted_at: string | null;
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
          went_with_user_ids?: string[] | null;
          is_favorite?: boolean;
          is_abandoned?: boolean;
          supported_team?: 'home' | 'away' | 'neutral' | null;
          result?: 'win' | 'loss' | 'draw' | 'no_result' | null;
          created_at?: string;
          submitted_home_score?: string | null;
          submitted_away_score?: string | null;
          submitted_round?: string | null;
          submitted_event_time?: string | null;
          submitted_competition?: string | null;
          submitted_at?: string | null;
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
          went_with_user_ids?: string[] | null;
          is_favorite?: boolean;
          is_abandoned?: boolean;
          supported_team?: 'home' | 'away' | 'neutral' | null;
          result?: 'win' | 'loss' | 'draw' | 'no_result' | null;
          created_at?: string;
          submitted_home_score?: string | null;
          submitted_away_score?: string | null;
          submitted_round?: string | null;
          submitted_event_time?: string | null;
          submitted_competition?: string | null;
          submitted_at?: string | null;
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
      user_settings: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          notify_friend_requests: boolean;
          notify_achievements: boolean;
          notify_event_reminders: boolean;
          email_enabled: boolean;
          email_weekly_digest: boolean;
          profile_public: boolean;
          show_stats: boolean;
          show_events: boolean;
          allow_tagging: boolean;
          show_on_leaderboards: boolean;
          reviews_public: boolean;
          allow_comments: boolean;
          show_watched_reviews: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          push_enabled?: boolean;
          notify_friend_requests?: boolean;
          notify_achievements?: boolean;
          notify_event_reminders?: boolean;
          email_enabled?: boolean;
          email_weekly_digest?: boolean;
          profile_public?: boolean;
          show_stats?: boolean;
          show_events?: boolean;
          allow_tagging?: boolean;
          show_on_leaderboards?: boolean;
          reviews_public?: boolean;
          allow_comments?: boolean;
          show_watched_reviews?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          push_enabled?: boolean;
          notify_friend_requests?: boolean;
          notify_achievements?: boolean;
          notify_event_reminders?: boolean;
          email_enabled?: boolean;
          email_weekly_digest?: boolean;
          profile_public?: boolean;
          show_stats?: boolean;
          show_events?: boolean;
          allow_tagging?: boolean;
          show_on_leaderboards?: boolean;
          reviews_public?: boolean;
          allow_comments?: boolean;
          show_watched_reviews?: boolean;
          updated_at?: string;
        };
      };
      event_tag_invitations: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          attended_event_id: string;
          status: 'pending' | 'accepted' | 'declined';
          message: string | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          attended_event_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          attended_event_id?: string;
          status?: 'pending' | 'accepted' | 'declined';
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
      };
      event_reviews: {
        Row: {
          id: string;
          attended_event_id: string;
          user_id: string;
          event_id: string;
          review_text: string | null;
          rating: number | null;
          atmosphere_rating: number | null;
          photo_urls: string[] | null;
          is_watched: boolean;
          is_public: boolean;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attended_event_id: string;
          user_id: string;
          event_id?: string;
          review_text?: string | null;
          rating?: number | null;
          atmosphere_rating?: number | null;
          photo_urls?: string[] | null;
          is_watched?: boolean;
          is_public?: boolean;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attended_event_id?: string;
          user_id?: string;
          event_id?: string;
          review_text?: string | null;
          rating?: number | null;
          atmosphere_rating?: number | null;
          photo_urls?: string[] | null;
          is_watched?: boolean;
          is_public?: boolean;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      review_likes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      review_comments: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          is_edited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          parent_id?: string | null;
          content?: string;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_type: 'review' | 'comment';
          content_id: string;
          reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
          description: string | null;
          status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          content_type: 'review' | 'comment';
          content_id: string;
          reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          content_type?: 'review' | 'comment';
          content_id?: string;
          reason?: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_sport_breakdown: {
        Args: { p_user_id: string };
        Returns: {
          sport_id: string;
          sport_name: string;
          event_count: number;
          win_count: number;
          loss_count: number;
          draw_count: number;
        }[];
      };
      get_team_breakdown: {
        Args: { p_user_id: string };
        Returns: {
          team_id: string;
          team_name: string;
          event_count: number;
          win_count: number;
          loss_count: number;
          draw_count: number;
        }[];
      };
      get_venue_breakdown: {
        Args: { p_user_id: string };
        Returns: {
          venue_id: string;
          venue_name: string;
          event_count: number;
        }[];
      };
      get_monthly_trend: {
        Args: { p_user_id: string };
        Returns: {
          month: string;
          event_count: number;
        }[];
      };
      get_trending_events: {
        Args: { p_sport_id?: string | null; p_limit?: number; p_offset?: number };
        Returns: {
          event_id: string;
          event_name: string;
          event_date: string;
          event_time: string | null;
          home_team_name: string | null;
          away_team_name: string | null;
          home_team_logo: string | null;
          away_team_logo: string | null;
          home_score: string | null;
          away_score: string | null;
          venue_name: string | null;
          sport_name: string | null;
          sport_icon: string | null;
          sport_color: string | null;
          competition: string | null;
          attendance_count: number;
          avg_overall_rating: number | null;
          avg_atmosphere_rating: number | null;
          trending_score: number;
        }[];
      };
      get_trending_reviews: {
        Args: { p_sport_id?: string | null; p_limit?: number; p_offset?: number };
        Returns: Json[];
      };
      get_following_feed: {
        Args: { p_user_id: string; p_limit?: number; p_offset?: number };
        Returns: Json[];
      };
      get_leaderboard: {
        Args: { p_limit?: number };
        Returns: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          total_events: number;
          total_xp: number;
          followers_count: number;
          reviews_count: number;
        }[];
      };
      search_reviews: {
        Args: { p_query: string; p_limit?: number; p_offset?: number };
        Returns: Json[];
      };
      search_profiles: {
        Args: { p_query: string; p_limit?: number; p_offset?: number };
        Returns: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          followers_count: number;
          reviews_count: number;
        }[];
      };
    };
    Enums: {
      friendship_status: 'pending' | 'accepted' | 'declined' | 'blocked';
      invitation_status: 'pending' | 'accepted' | 'declined';
    };
  };
}
