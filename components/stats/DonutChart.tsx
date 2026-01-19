import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  centerLabel?: string;
  centerValue?: string | number;
  onSegmentPress?: (segment: DonutSegment) => void;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  onSegmentPress,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.emptyBar}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Stacked horizontal bar chart */}
      <View style={styles.barContainer}>
        {data.map((segment, index) => {
          const percent = (segment.value / total) * 100;
          if (percent === 0) return null;
          return (
            <TouchableOpacity
              key={segment.id}
              style={[
                styles.barSegment,
                {
                  width: `${percent}%`,
                  backgroundColor: segment.color,
                  borderTopLeftRadius: index === 0 ? borderRadius.md : 0,
                  borderBottomLeftRadius: index === 0 ? borderRadius.md : 0,
                  borderTopRightRadius: index === data.length - 1 ? borderRadius.md : 0,
                  borderBottomRightRadius: index === data.length - 1 ? borderRadius.md : 0,
                },
              ]}
              onPress={() => onSegmentPress?.(segment)}
              activeOpacity={onSegmentPress ? 0.7 : 1}
            >
              {percent > 15 && (
                <Text style={styles.barLabel}>{Math.round(percent)}%</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Center summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.totalValue}>{centerValue ?? total}</Text>
        {centerLabel && <Text style={styles.totalLabel}>{centerLabel}</Text>}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((segment) => (
          <TouchableOpacity
            key={segment.id}
            style={styles.legendItem}
            onPress={() => onSegmentPress?.(segment)}
            activeOpacity={onSegmentPress ? 0.7 : 1}
          >
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {segment.label}
            </Text>
            <Text style={styles.legendValue}>
              {segment.value} ({Math.round((segment.value / total) * 100)}%)
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Simple circular progress for single values
interface CircularProgressProps {
  value: number;
  max: number;
  color?: string;
  size?: number;
  label?: string;
}

export function CircularProgress({
  value,
  max,
  color = colors.primary,
  size = 80,
  label,
}: CircularProgressProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      {/* Background circle using borders */}
      <View style={[styles.circularBg, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Progress indicator using a simple approach */}
        <View style={styles.circularInner}>
          <Text style={styles.circularValue}>{value}</Text>
          {label && <Text style={styles.circularLabel}>{label}</Text>}
        </View>
      </View>
      {/* Progress bar at bottom */}
      <View style={styles.progressBarSmall}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  emptyBar: {
    height: 40,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  barContainer: {
    flexDirection: 'row',
    height: 40,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  barSegment: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  totalValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  legend: {
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  legendValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  // Circular progress styles
  circularContainer: {
    alignItems: 'center',
  },
  circularBg: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularInner: {
    alignItems: 'center',
  },
  circularValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  circularLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  progressBarSmall: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
