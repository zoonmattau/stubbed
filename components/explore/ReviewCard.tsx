import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/dates';
import { getSportColor } from '@/constants/sports';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import { useReviews } from '@/hooks/useReviews';
import { LikeButton } from '@/components/reviews/LikeButton';
import type { ReviewWithDetails } from '@/types';

interface ReviewCardProps {
  review: ReviewWithDetails;
  onPress?: () => void;
  showActions?: boolean;
}

export function ReviewCard({ review, onPress, showActions = true }: ReviewCardProps) {
  const { getTeamLogo } = useTeamLogos();
  const { hasLikedReview } = useReviews();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(review.likes_count);

  // Check if user has liked this review
  useEffect(() => {
    hasLikedReview(review.review_id).then(setIsLiked);
  }, [review.review_id]);

  const sportColor = getSportColor(review.sport_name?.toLowerCase() || '');
  const homeTeamLogo = review.home_team_logo || getTeamLogo(review.home_team_name || '');
  const awayTeamLogo = review.away_team_logo || getTeamLogo(review.away_team_name || '');

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/review/${review.review_id}`);
    }
  };

  const handleUserPress = () => {
    router.push(`/profile/${review.user_id}`);
  };

  const handleLikeUpdate = (newIsLiked: boolean, newCount: number) => {
    setIsLiked(newIsLiked);
    setLikesCount(newCount);
  };

  return (
    <Card style={styles.container} onPress={handlePress}>
      {/* Header - User info */}
      <TouchableOpacity style={styles.header} onPress={handleUserPress} activeOpacity={0.7}>
        <Avatar
          uri={review.avatar_url || undefined}
          name={review.display_name || review.username}
          size={40}
        />
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {review.display_name || review.username}
            </Text>
            <Text style={styles.username}>@{review.username}</Text>
            {review.is_watched && (
              <View style={styles.watchedBadge}>
                <Ionicons name="tv-outline" size={12} color={colors.textMuted} />
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>{formatRelativeTime(review.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {/* Event Info */}
      <View style={styles.eventInfo}>
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
            <Text style={styles.teamName} numberOfLines={1}>{review.home_team_name || 'Home'}</Text>
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
            <Text style={styles.teamName} numberOfLines={1}>{review.away_team_name || 'Away'}</Text>
          </View>
        </View>

        {/* Event metadata row */}
        <View style={styles.eventMeta}>
          <Badge label={review.sport_name || 'Sport'} size="sm" color={sportColor} />
          {review.venue_name && (
            <View style={styles.venueRow}>
              <Ionicons name="location" size={12} color={colors.textMuted} />
              <Text style={styles.venueText} numberOfLines={1}>{review.venue_name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Rating */}
      {(review.rating || review.atmosphere_rating) && (
        <View style={styles.ratingsRow}>
          {review.rating && (
            <View style={styles.ratingItem}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.rating! ? 'star' : 'star-outline'}
                    size={14}
                    color={colors.gold}
                  />
                ))}
              </View>
              <Text style={styles.ratingLabel}>Overall</Text>
            </View>
          )}
          {review.atmosphere_rating && (
            <View style={styles.ratingItem}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.atmosphere_rating! ? 'star' : 'star-outline'}
                    size={14}
                    color={colors.secondary}
                  />
                ))}
              </View>
              <Text style={styles.ratingLabel}>Atmosphere</Text>
            </View>
          )}
        </View>
      )}

      {/* Review text */}
      {review.review_text && (
        <Text style={styles.reviewText} numberOfLines={4}>
          {review.review_text}
        </Text>
      )}

      {/* Photos */}
      {review.photo_urls && review.photo_urls.length > 0 && (
        <View style={styles.photosContainer}>
          {review.photo_urls.slice(0, 3).map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.photo} />
          ))}
          {review.photo_urls.length > 3 && (
            <View style={styles.morePhotos}>
              <Text style={styles.morePhotosText}>+{review.photo_urls.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <View style={styles.actionsRow}>
          <LikeButton
            reviewId={review.review_id}
            initialLiked={isLiked}
            initialCount={likesCount}
            onUpdate={handleLikeUpdate}
          />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/review/${review.review_id}`)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.actionCount}>{review.comments_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  displayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  watchedBadge: {
    marginLeft: spacing.xs,
    padding: 2,
    backgroundColor: colors.surfaceLighter,
    borderRadius: borderRadius.sm,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  eventInfo: {
    marginBottom: spacing.md,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  teamLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  teamName: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    maxWidth: 80,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  scoreText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  scoreDivider: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  vsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  venueText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  ratingItem: {
    alignItems: 'flex-start',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  reviewText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
    marginBottom: spacing.md,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  morePhotos: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
