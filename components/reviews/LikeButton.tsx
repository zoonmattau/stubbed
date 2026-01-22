import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/constants/theme';
import { useReviews } from '@/hooks/useReviews';

interface LikeButtonProps {
  reviewId: string;
  initialLiked: boolean;
  initialCount: number;
  onUpdate?: (isLiked: boolean, count: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeButton({
  reviewId,
  initialLiked,
  initialCount,
  onUpdate,
  size = 'md',
}: LikeButtonProps) {
  const { toggleLike } = useReviews();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Optimistic update
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? count + 1 : count - 1;
    setIsLiked(newIsLiked);
    setCount(newCount);

    // API call
    const result = await toggleLike(reviewId, isLiked ? count : count);

    if (!result.success) {
      // Revert on failure
      setIsLiked(!newIsLiked);
      setCount(newIsLiked ? count - 1 : count + 1);
    } else {
      onUpdate?.(result.isNowLiked, result.newCount);
    }

    setIsAnimating(false);
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const textSizes = {
    sm: fontSize.xs,
    md: fontSize.sm,
    lg: fontSize.md,
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={iconSizes[size]}
          color={isLiked ? colors.error : colors.textSecondary}
        />
      </Animated.View>
      <Text style={[styles.count, { fontSize: textSizes[size] }, isLiked && styles.countLiked]}>
        {count}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  count: {
    color: colors.textSecondary,
  },
  countLiked: {
    color: colors.error,
  },
});
