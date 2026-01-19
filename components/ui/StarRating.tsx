import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  color?: string;
  readonly?: boolean;
}

export function StarRating({
  rating,
  onChange,
  size = 24,
  color = colors.gold,
  readonly = false,
}: StarRatingProps) {
  const handlePress = (starIndex: number, isHalf: boolean) => {
    if (readonly || !onChange) return;

    const newRating = isHalf ? starIndex + 0.5 : starIndex + 1;
    // If tapping the same rating, clear it
    onChange(rating === newRating ? 0 : newRating);
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFull = rating >= starValue;
    const isHalf = !isFull && rating >= starValue - 0.5;

    return (
      <View key={index} style={styles.starContainer}>
        {readonly ? (
          <Ionicons
            name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
            size={size}
            color={color}
          />
        ) : (
          <View style={styles.touchableContainer}>
            {/* Left half - for half star */}
            <TouchableOpacity
              onPress={() => handlePress(index, true)}
              style={[styles.halfTouch, { width: size / 2, height: size }]}
              activeOpacity={0.7}
            />
            {/* Right half - for full star */}
            <TouchableOpacity
              onPress={() => handlePress(index, false)}
              style={[styles.halfTouch, { width: size / 2, height: size }]}
              activeOpacity={0.7}
            />
            {/* Star icon overlay */}
            <View style={styles.starOverlay} pointerEvents="none">
              <Ionicons
                name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                size={size}
                color={color}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  starContainer: {
    position: 'relative',
  },
  touchableContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  halfTouch: {
    zIndex: 1,
  },
  starOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
