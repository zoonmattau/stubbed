import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useReviews } from '@/hooks/useReviews';
import { Avatar, Card, Badge } from '@/components/ui';
import { LikeButton, CommentList, CommentInput, ReportModal } from '@/components/reviews';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate, formatRelativeTime } from '@/utils/dates';
import { getSportColor } from '@/constants/sports';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import type { ReviewWithDetails, ReviewCommentWithProfile } from '@/types';

export default function ReviewDetailScreen() {
  const { id: reviewId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getReview, getComments, hasLikedReview } = useReviews();
  const { getTeamLogo } = useTeamLogos();

  const [review, setReview] = useState<ReviewWithDetails | null>(null);
  const [comments, setComments] = useState<ReviewCommentWithProfile[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContentId, setReportContentId] = useState<string | null>(null);
  const [reportContentType, setReportContentType] = useState<'review' | 'comment'>('review');

  // Fetch review data
  const fetchReview = useCallback(async () => {
    if (!reviewId) return;
    const data = await getReview(reviewId);
    if (data) {
      setReview(data);
      setLikesCount(data.likes_count);
    }
  }, [reviewId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!reviewId) return;
    const data = await getComments(reviewId);
    setComments(data);
  }, [reviewId]);

  // Check like status
  const checkLikeStatus = useCallback(async () => {
    if (!reviewId) return;
    const liked = await hasLikedReview(reviewId);
    setIsLiked(liked);
  }, [reviewId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchReview(), fetchComments(), checkLikeStatus()]);
      setIsLoading(false);
    };
    load();
  }, [reviewId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchReview(), fetchComments()]);
    setRefreshing(false);
  };

  // Handle like update
  const handleLikeUpdate = (newIsLiked: boolean, newCount: number) => {
    setIsLiked(newIsLiked);
    setLikesCount(newCount);
  };

  // Handle report
  const handleReport = (contentId: string, type: 'review' | 'comment' = 'comment') => {
    setReportContentId(contentId);
    setReportContentType(type);
    setShowReportModal(true);
  };

  // Handle user press
  const handleUserPress = () => {
    if (review?.user_id) {
      router.push(`/profile/${review.user_id}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!review) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
        <Text style={styles.errorText}>Review not found</Text>
      </View>
    );
  }

  const sportColor = getSportColor(review.sport_name?.toLowerCase() || '');
  const homeTeamLogo = review.home_team_logo || getTeamLogo(review.home_team_name || '');
  const awayTeamLogo = review.away_team_logo || getTeamLogo(review.away_team_name || '');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Review',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => handleReport(reviewId!, 'review')}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Header */}
          <TouchableOpacity style={styles.userHeader} onPress={handleUserPress} activeOpacity={0.7}>
            <Avatar
              uri={review.avatar_url || undefined}
              name={review.display_name || review.username}
              size={48}
            />
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.displayName}>{review.display_name || review.username}</Text>
                {review.is_watched && (
                  <View style={styles.watchedBadge}>
                    <Ionicons name="tv-outline" size={12} color={colors.textMuted} />
                  </View>
                )}
              </View>
              <Text style={styles.username}>@{review.username}</Text>
            </View>
            <Text style={styles.timestamp}>{formatRelativeTime(review.created_at)}</Text>
          </TouchableOpacity>

          {/* Event Card */}
          <Card style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Badge label={review.sport_name || 'Sport'} size="sm" color={sportColor} />
              {review.competition && (
                <Text style={styles.competition}>{review.competition}</Text>
              )}
              <Text style={styles.eventDate}>{formatDate(review.event_date)}</Text>
            </View>

            <View style={styles.teamsRow}>
              {/* Home Team */}
              <View style={styles.teamInfo}>
                {homeTeamLogo ? (
                  <Image source={{ uri: homeTeamLogo }} style={styles.teamLogo} />
                ) : (
                  <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                    <Text style={styles.teamLogoText}>{review.home_team_name?.[0] || 'H'}</Text>
                  </View>
                )}
                <Text style={styles.teamName}>{review.home_team_name || 'Home'}</Text>
              </View>

              {/* Score */}
              <View style={styles.scoreBox}>
                {review.home_score && review.away_score ? (
                  <>
                    <Text style={styles.scoreText}>{review.home_score}</Text>
                    <Text style={styles.scoreDivider}>-</Text>
                    <Text style={styles.scoreText}>{review.away_score}</Text>
                  </>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
              </View>

              {/* Away Team */}
              <View style={styles.teamInfo}>
                {awayTeamLogo ? (
                  <Image source={{ uri: awayTeamLogo }} style={styles.teamLogo} />
                ) : (
                  <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                    <Text style={styles.teamLogoText}>{review.away_team_name?.[0] || 'A'}</Text>
                  </View>
                )}
                <Text style={styles.teamName}>{review.away_team_name || 'Away'}</Text>
              </View>
            </View>

            {review.venue_name && (
              <View style={styles.venueRow}>
                <Ionicons name="location" size={14} color={colors.textMuted} />
                <Text style={styles.venueText}>{review.venue_name}</Text>
              </View>
            )}
          </Card>

          {/* Ratings */}
          {(review.rating || review.atmosphere_rating) && (
            <View style={styles.ratingsContainer}>
              {review.rating && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Overall Rating</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating! ? 'star' : 'star-outline'}
                        size={24}
                        color={colors.gold}
                      />
                    ))}
                  </View>
                </View>
              )}
              {review.atmosphere_rating && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Atmosphere</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.atmosphere_rating! ? 'star' : 'star-outline'}
                        size={24}
                        color={colors.secondary}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Review Text */}
          {review.review_text && (
            <Text style={styles.reviewText}>{review.review_text}</Text>
          )}

          {/* Photos */}
          {review.photo_urls && review.photo_urls.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosContainer}
              contentContainerStyle={styles.photosContent}
            >
              {review.photo_urls.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <LikeButton
              reviewId={reviewId!}
              initialLiked={isLiked}
              initialCount={likesCount}
              onUpdate={handleLikeUpdate}
              size="lg"
            />

            <View style={styles.actionItem}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.actionCount}>{comments.length}</Text>
            </View>

            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <CommentList
              comments={comments}
              reviewId={reviewId!}
              onRefresh={fetchComments}
              onReport={(commentId) => handleReport(commentId, 'comment')}
            />
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <CommentInput
            reviewId={reviewId!}
            onCommentAdded={fetchComments}
          />
        </View>

        {/* Report Modal */}
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentType={reportContentType}
          contentId={reportContentId || ''}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  headerButton: {
    padding: spacing.sm,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  displayName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  watchedBadge: {
    padding: 2,
    backgroundColor: colors.surfaceLighter,
    borderRadius: borderRadius.sm,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  timestamp: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  eventCard: {
    margin: spacing.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  competition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  eventDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  teamLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.lg,
  },
  teamName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    maxWidth: 100,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  scoreText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scoreDivider: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  vsText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  venueText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  ratingsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  ratingItem: {
    alignItems: 'flex-start',
  },
  ratingLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: fontSize.lg * 1.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  photosContainer: {
    marginBottom: spacing.lg,
  },
  photosContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  commentsSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  commentInputContainer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
