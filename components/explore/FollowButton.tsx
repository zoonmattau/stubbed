import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useFollows } from '@/hooks/useFollows';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  size = 'md',
  initialFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const { toggleFollow, isFollowing: checkIsFollowing } = useFollows();
  const [isFollowing, setIsFollowing] = useState(initialFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);

  // Check follow status on mount if not provided
  useEffect(() => {
    if (initialFollowing === undefined) {
      checkIsFollowing(userId).then(setIsFollowing);
    }
  }, [userId, initialFollowing]);

  const handlePress = async () => {
    setIsLoading(true);
    const result = await toggleFollow(userId);
    setIsLoading(false);

    if (result.success) {
      setIsFollowing(result.isNowFollowing);
      onFollowChange?.(result.isNowFollowing);
    }
  };

  const sizeStyles = {
    sm: styles.buttonSm,
    md: styles.buttonMd,
    lg: styles.buttonLg,
  };

  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles[size],
        isFollowing ? styles.buttonFollowing : styles.buttonNotFollowing,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            textSizeStyles[size],
            isFollowing ? styles.textFollowing : styles.textNotFollowing,
          ]}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minWidth: 70,
  },
  buttonMd: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 90,
  },
  buttonLg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 110,
  },
  buttonNotFollowing: {
    backgroundColor: colors.primary,
  },
  buttonFollowing: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
  textSm: {
    fontSize: fontSize.xs,
  },
  textMd: {
    fontSize: fontSize.sm,
  },
  textLg: {
    fontSize: fontSize.md,
  },
  textNotFollowing: {
    color: colors.white,
  },
  textFollowing: {
    color: colors.primary,
  },
});
