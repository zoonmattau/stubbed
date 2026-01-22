import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore } from '@/stores/exploreStore';
import type {
  EventReview,
  ReviewWithDetails,
  ReviewComment,
  ReviewCommentWithProfile,
  ReviewFormData,
  Report,
  Profile,
} from '@/types';

export function useReviews() {
  const { user } = useAuthStore();
  const { updateReviewInFeeds } = useExploreStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Review CRUD
  // ============================================

  // Create a new review
  const createReview = useCallback(async (data: ReviewFormData): Promise<{ success: boolean; review?: EventReview; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    setError(null);

    try {
      const { data: review, error: insertError } = await supabase
        .from('event_reviews')
        .insert({
          attended_event_id: data.attended_event_id,
          user_id: user.id,
          review_text: data.review_text || null,
          rating: data.rating || null,
          atmosphere_rating: data.atmosphere_rating || null,
          photo_urls: data.photo_urls || null,
          is_watched: data.is_watched || false,
          is_public: data.is_public !== false, // Default to true
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'You already have a review for this event' };
        }
        throw insertError;
      }

      return { success: true, review: review as EventReview };
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Update an existing review
  const updateReview = useCallback(async (
    reviewId: string,
    updates: Partial<ReviewFormData>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('event_reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Delete a review
  const deleteReview = useCallback(async (reviewId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('event_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Get a single review by ID
  const getReview = useCallback(async (reviewId: string): Promise<ReviewWithDetails | null> => {
    try {
      // Fetch the review with all joined data
      const { data, error } = await supabase
        .from('event_reviews')
        .select(`
          *,
          profile:profiles!event_reviews_user_id_fkey(*),
          attended_event:attended_events!event_reviews_attended_event_id_fkey(
            *,
            event:events(
              *,
              sport:sports(*),
              home_team:teams!events_home_team_id_fkey(*),
              away_team:teams!events_away_team_id_fkey(*),
              venue:venues(*)
            )
          )
        `)
        .eq('id', reviewId)
        .single();

      if (error) throw error;

      // Transform to ReviewWithDetails format
      const review = data as any;
      const event = review.attended_event?.event;

      return {
        review_id: review.id,
        attended_event_id: review.attended_event_id,
        user_id: review.user_id,
        review_text: review.review_text,
        rating: review.rating,
        atmosphere_rating: review.atmosphere_rating,
        photo_urls: review.photo_urls,
        is_watched: review.is_watched,
        likes_count: review.likes_count,
        comments_count: review.comments_count,
        created_at: review.created_at,
        username: review.profile?.username,
        display_name: review.profile?.display_name,
        avatar_url: review.profile?.avatar_url,
        event_id: event?.id,
        event_date: event?.event_date,
        event_time: event?.event_time,
        sport_id: event?.sport_id,
        sport_name: event?.sport?.name,
        sport_icon: event?.sport?.icon,
        sport_color: event?.sport?.color,
        home_team_id: event?.home_team_id,
        home_team_name: event?.home_team?.name || event?.home_team_name,
        home_team_logo: event?.home_team?.logo_url,
        away_team_id: event?.away_team_id,
        away_team_name: event?.away_team?.name || event?.away_team_name,
        away_team_logo: event?.away_team?.logo_url,
        venue_name: event?.venue?.name || event?.venue_name,
        home_score: event?.home_score,
        away_score: event?.away_score,
        competition: event?.competition,
      };
    } catch (err) {
      console.error('[useReviews] Error fetching review:', err);
      return null;
    }
  }, []);

  // Get reviews for a specific user
  const getUserReviews = useCallback(async (
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<ReviewWithDetails[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_reviews', {
        p_user_id: userId,
        p_viewer_id: user?.id || null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;
      return (data || []) as ReviewWithDetails[];
    } catch (err) {
      console.error('[useReviews] Error fetching user reviews:', err);
      return [];
    }
  }, [user?.id]);

  // Check if user has a review for an attended event
  const getReviewForAttendedEvent = useCallback(async (attendedEventId: string): Promise<EventReview | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('event_reviews')
        .select('*')
        .eq('attended_event_id', attendedEventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as EventReview | null;
    } catch (err) {
      console.error('[useReviews] Error checking for review:', err);
      return null;
    }
  }, [user?.id]);

  // ============================================
  // Likes
  // ============================================

  // Check if user has liked a review
  const hasLikedReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('[useReviews] Error checking like status:', err);
      return false;
    }
  }, [user?.id]);

  // Like a review
  const likeReview = useCallback(async (reviewId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: insertError } = await supabase
        .from('review_likes')
        .insert({
          review_id: reviewId,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'Already liked' };
        }
        throw insertError;
      }

      // Optimistically update the review in feeds
      // The actual count is updated by database trigger
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id]);

  // Unlike a review
  const unlikeReview = useCallback(async (reviewId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: deleteError } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id]);

  // Toggle like
  const toggleLike = useCallback(async (reviewId: string, currentLikesCount: number): Promise<{ success: boolean; isNowLiked: boolean; newCount: number }> => {
    const isLiked = await hasLikedReview(reviewId);

    if (isLiked) {
      const result = await unlikeReview(reviewId);
      const newCount = Math.max(0, currentLikesCount - 1);
      if (result.success) {
        updateReviewInFeeds(reviewId, { likes_count: newCount });
      }
      return { success: result.success, isNowLiked: false, newCount };
    } else {
      const result = await likeReview(reviewId);
      const newCount = currentLikesCount + 1;
      if (result.success) {
        updateReviewInFeeds(reviewId, { likes_count: newCount });
      }
      return { success: result.success, isNowLiked: result.success, newCount };
    }
  }, [hasLikedReview, likeReview, unlikeReview, updateReviewInFeeds]);

  // ============================================
  // Comments
  // ============================================

  // Get comments for a review
  const getComments = useCallback(async (reviewId: string): Promise<ReviewCommentWithProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('review_comments')
        .select(`
          *,
          profile:profiles!review_comments_user_id_fkey(*)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into tree structure (comments with replies)
      const comments = (data || []) as unknown as ReviewCommentWithProfile[];
      const topLevel: ReviewCommentWithProfile[] = [];
      const byId: Record<string, ReviewCommentWithProfile> = {};

      // First pass: index by id
      comments.forEach((c) => {
        byId[c.id] = { ...c, replies: [] };
      });

      // Second pass: organize into tree
      comments.forEach((c) => {
        if (c.parent_id && byId[c.parent_id]) {
          byId[c.parent_id].replies!.push(byId[c.id]);
        } else if (!c.parent_id) {
          topLevel.push(byId[c.id]);
        }
      });

      return topLevel;
    } catch (err) {
      console.error('[useReviews] Error fetching comments:', err);
      return [];
    }
  }, []);

  // Add a comment
  const addComment = useCallback(async (
    reviewId: string,
    content: string,
    parentId?: string
  ): Promise<{ success: boolean; comment?: ReviewComment; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error: insertError } = await supabase
        .from('review_comments')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, comment: data as ReviewComment };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id]);

  // Edit a comment
  const editComment = useCallback(async (
    commentId: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('review_comments')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: deleteError } = await supabase
        .from('review_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id]);

  // ============================================
  // Reports
  // ============================================

  // Report content (review or comment)
  const reportContent = useCallback(async (
    contentType: 'review' | 'comment',
    contentId: string,
    reason: Report['reason'],
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          content_type: contentType,
          content_id: contentId,
          reason,
          description: description || null,
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [user?.id]);

  return {
    // State
    isLoading,
    error,

    // Review CRUD
    createReview,
    updateReview,
    deleteReview,
    getReview,
    getUserReviews,
    getReviewForAttendedEvent,

    // Likes
    hasLikedReview,
    likeReview,
    unlikeReview,
    toggleLike,

    // Comments
    getComments,
    addComment,
    editComment,
    deleteComment,

    // Reports
    reportContent,
  };
}
