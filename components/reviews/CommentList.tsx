import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui';
import { CommentInput } from './CommentInput';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/dates';
import { useAuthStore } from '@/stores/authStore';
import { useReviews } from '@/hooks/useReviews';
import type { ReviewCommentWithProfile } from '@/types';

interface CommentItemProps {
  comment: ReviewCommentWithProfile;
  reviewId: string;
  depth?: number;
  onRefresh: () => void;
  onReport: (commentId: string) => void;
}

function CommentItem({ comment, reviewId, depth = 0, onRefresh, onReport }: CommentItemProps) {
  const { user } = useAuthStore();
  const { deleteComment } = useReviews();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const isOwner = user?.id === comment.user_id;

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteComment(comment.id);
            if (result.success) {
              onRefresh();
            }
          },
        },
      ]
    );
  };

  const handleUserPress = () => {
    router.push(`/profile/${comment.user_id}`);
  };

  return (
    <View style={[styles.commentContainer, depth > 0 && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <Avatar
            uri={comment.profile?.avatar_url || undefined}
            name={comment.profile?.display_name || comment.profile?.username || ''}
            size={depth > 0 ? 28 : 32}
          />
          <View style={styles.userMeta}>
            <Text style={styles.username}>
              {comment.profile?.display_name || comment.profile?.username}
            </Text>
            <Text style={styles.timestamp}>
              {formatRelativeTime(comment.created_at)}
              {comment.is_edited && ' (edited)'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Comment Options',
              undefined,
              [
                ...(isOwner
                  ? [{ text: 'Delete', style: 'destructive' as const, onPress: handleDelete }]
                  : [{ text: 'Report', onPress: () => onReport(comment.id) }]
                ),
                { text: 'Cancel', style: 'cancel' as const },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        {depth < 2 && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setShowReplyInput(!showReplyInput)}
          >
            <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <CommentInput
            reviewId={reviewId}
            parentId={comment.id}
            placeholder="Write a reply..."
            onCommentAdded={() => {
              setShowReplyInput(false);
              onRefresh();
            }}
            onCancel={() => setShowReplyInput(false)}
          />
        </View>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              reviewId={reviewId}
              depth={depth + 1}
              onRefresh={onRefresh}
              onReport={onReport}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface CommentListProps {
  comments: ReviewCommentWithProfile[];
  reviewId: string;
  onRefresh: () => void;
  onReport: (commentId: string) => void;
}

export function CommentList({ comments, reviewId, onRefresh, onReport }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No comments yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          reviewId={reviewId}
          onRefresh={onRefresh}
          onReport={onReport}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  commentContainer: {
    paddingVertical: spacing.sm,
  },
  replyContainer: {
    marginLeft: spacing.xl,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userMeta: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  username: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  moreButton: {
    padding: spacing.xs,
  },
  commentContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.4,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  replyButtonText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  replyInputContainer: {
    marginTop: spacing.sm,
  },
  repliesContainer: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
