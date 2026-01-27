import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { ReviewWithDetails, Sport } from '@/types';

type FeedType = 'trending' | 'following' | 'leaderboard';

interface ExploreStore {
  // Feed state
  feedType: FeedType;
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
    // Refetch trending with new filter
    get().fetchTrending(true);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
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
      const { data, error } = await supabase
        .from('sports')
        .select('*')
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
