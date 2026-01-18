import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  value?: string;
  color?: string;
  showPercentage?: boolean;
  height?: number;
}

export function ProgressBar({
  progress,
  label,
  value,
  color = colors.primary,
  showPercentage = false,
  height = 8,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      {(label || value || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          <Text style={styles.value}>
            {value || (showPercentage ? `${Math.round(clampedProgress)}%` : '')}
          </Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  track: {
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
