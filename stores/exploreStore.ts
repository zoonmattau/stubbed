import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { ReviewWithDetails, Sport } from '@/types';

type FeedType = 'trending' | 'following' | 'leaderboard';

export interface TrendingEvent {
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
}

interface ExploreStore {
  // Feed state
  feedType: FeedType;
  trendingEvents: TrendingEvent[];
  trendingReviews: ReviewWithDetails[];
  followingReviews: ReviewWithDetails[];
  searchResults: ReviewWithDetails[];

  // Filters
  selectedSportId: string | null;
  searchQuery: string;

  // Pagination
  trendingOffset: number;
  followingOffset: number;
  searchOffset: number;
  hasMoreTrending: boolean;
  hasMoreFollowing: boolean;
  hasMoreSearch: boolean;

  // Loading states
  isLoadingTrending: boolean;
  isLoadingFollowing: boolean;
  isLoadingSearch: boolean;
  error: string | null;

  // Sports for filtering
  sports: Sport[];

  // Actions
  setFeedType: (type: FeedType) => void;
  setSportFilter: (sportId: string | null) => void;
  setSearchQuery: (query: string) => void;

  fetchTrendingEvents: (reset?: boolean) => Promise<void>;
  fetchTrending: (reset?: boolean) => Promise<void>;
  fetchFollowingFeed: (userId: string, reset?: boolean) => Promise<void>;
  searchReviews: (query: string, reset?: boolean) => Promise<void>;
  fetchSports: () => Promise<void>;

  // Update review in all feeds after like/unlike
  updateReviewInFeeds: (reviewId: string, updates: Partial<ReviewWithDetails>) => void;

  reset: () => void;
}

const PAGE_SIZE = 20;

export const useExploreStore = create<ExploreStore>((set, get) => ({
  // Initial state
  feedType: 'trending',
  trendingEvents: [],
  trendingReviews: [],
  followingReviews: [],
  searchResults: [],

  selectedSportId: null,
  searchQuery: '',

  trendingOffset: 0,
  followingOffset: 0,
  searchOffset: 0,
  hasMoreTrending: true,
  hasMoreFollowing: true,
  hasMoreSearch: true,

  isLoadingTrending: false,
  isLoadingFollowing: false,
  isLoadingSearch: false,
  error: null,

  sports: [],

  // Actions
  setFeedType: (type) => {
    set({ feedType: type });
  },

  setSportFilter: (sportId) => {
    set({ selectedSportId: sportId });
    // Refetch trending events with new filter
    get().fetchTrendingEvents(true);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  fetchTrendingEvents: async (reset = false) => {
    const { selectedSportId, trendingOffset, isLoadingTrending } = get();

    if (isLoadingTrending) return;

    const offset = reset ? 0 : trendingOffset;
    set({ isLoadingTrending: true, error: null });

    try {
      const { data, error } = await supabase.rpc('get_trending_events', {
        p_sport_id: selectedSportId,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });

      if (error) throw error;

      const events = (data || []) as TrendingEvent[];
      const hasMore = events.length === PAGE_SIZE;

      set({
        trendingEvents: reset ? events : [...get().trendingEvents, ...events],
        trendingOffset: offset + events.length,
        hasMoreTrending: hasMore,
        isLoadingTrending: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[ExploreStore] Error fetching trending events:', error);
      set({
        error: error.message || 'Failed to load trending events',
        isLoadingTrending: false,
        // Reset offset on error so retry works correctly
        trendingOffset: reset ? 0 : trendingOffset,
      });
    }
  },

  fetchTrending: async (reset = false) => {
    const { selectedSportId, trendingOffset, isLoadingTrending } = get();

    if (isLoadingTrending) return;

    const offset = reset ? 0 : trendingOffset;
    set({ isLoadingTrending: true, error: null });

    try {
      const { data, error } = await supabase.rpc('get_trending_reviews', {
        p_sport_id: selectedSportId,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });

      if (error) throw error;

      const reviews = (data || []) as ReviewWithDetails[];
      const hasMore = reviews.length === PAGE_SIZE;

      set({
        trendingReviews: reset ? reviews : [...get().trendingReviews, ...reviews],
        trendingOffset: offset + reviews.length,
        hasMoreTrending: hasMore,
        isLoadingTrending: false,
      });
    } catch (error: any) {
      console.error('[ExploreStore] Error fetching trending:', error);
      set({
        error: error.message,
        isLoadingTrending: false,
      });
    }
  },

  fetchFollowingFeed: async (userId, reset = false) => {
    const { followingOffset, isLoadingFollowing } = get();

    if (isLoadingFollowing) return;

    const offset = reset ? 0 : followingOffset;
    set({ isLoadingFollowing: true, error: null });

    try {
      const { data, error } = await supabase.rpc('get_following_feed', {
        p_user_id: userId,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });

      if (error) throw error;

      const reviews = (data || []) as ReviewWithDetails[];
      const hasMore = reviews.length === PAGE_SIZE;

      set({
        followingReviews: reset ? reviews : [...get().followingReviews, ...reviews],
        followingOffset: offset + reviews.length,
        hasMoreFollowing: hasMore,
        isLoadingFollowing: false,
      });
    } catch (error: any) {
      console.error('[ExploreStore] Error fetching following feed:', error);
      set({
        error: error.message,
        isLoadingFollowing: false,
      });
    }
  },

  searchReviews: async (query, reset = false) => {
    const { searchOffset, isLoadingSearch } = get();

    if (isLoadingSearch || !query.trim()) return;

    const offset = reset ? 0 : searchOffset;
    set({ isLoadingSearch: true, error: null, searchQuery: query });

    try {
      const { data, error } = await supabase.rpc('search_reviews', {
        p_query: query,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });

      if (error) throw error;

      const reviews = (data || []) as ReviewWithDetails[];
      const hasMore = reviews.length === PAGE_SIZE;

      set({
        searchResults: reset ? reviews : [...get().searchResults, ...reviews],
        searchOffset: offset + reviews.length,
        hasMoreSearch: hasMore,
        isLoadingSearch: false,
      });
    } catch (error: any) {
      console.error('[ExploreStore] Error searching reviews:', error);
      set({
        error: error.message,
        isLoadingSearch: false,
      });
    }
  },

  fetchSports: async () => {
    try {
      // Only fetch sports that have events with attendees (i.e., sports actually used in the app)
      // First get the sport IDs that have attended events
      const { data: sportIds, error: sportIdsError } = await supabase
        .from('attended_events')
        .select('event:events(sport_id)')
        .not('event.sport_id', 'is', null);

      if (sportIdsError) throw sportIdsError;

      // Extract unique sport IDs
      const uniqueSportIds = [...new Set(
        (sportIds || [])
          .map((ae: any) => ae.event?.sport_id)
          .filter(Boolean)
      )];

      if (uniqueSportIds.length === 0) {
        set({ sports: [] });
        return;
      }

      // Fetch the sports by those IDs
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .in('id', uniqueSportIds)
        .order('name');

      if (error) throw error;
      set({ sports: data || [] });
    } catch (error: any) {
      console.error('[ExploreStore] Error fetching sports:', error);
    }
  },

  updateReviewInFeeds: (reviewId, updates) => {
    const { trendingReviews, followingReviews, searchResults } = get();

    const updateInArray = (arr: ReviewWithDetails[]) =>
      arr.map((r) => (r.review_id === reviewId ? { ...r, ...updates } : r));

    set({
      trendingReviews: updateInArray(trendingReviews),
      followingReviews: updateInArray(followingReviews),
      searchResults: updateInArray(searchResults),
    });
  },

  reset: () => {
    set({
      feedType: 'trending',
      trendingEvents: [],
      trendingReviews: [],
      followingReviews: [],
      searchResults: [],
      selectedSportId: null,
      searchQuery: '',
      trendingOffset: 0,
      followingOffset: 0,
      searchOffset: 0,
      hasMoreTrending: true,
      hasMoreFollowing: true,
      hasMoreSearch: true,
      isLoadingTrending: false,
      isLoadingFollowing: false,
      isLoadingSearch: false,
      error: null,
    });
  },
}));
