import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface BarChartItem {
  id: string;
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface InteractiveBarChartProps {
  data: BarChartItem[];
  maxItems?: number;
  onItemPress?: (item: BarChartItem) => void;
  onSeeAllPress?: () => void;
  showSeeAll?: boolean;
  valueLabel?: string;
  compact?: boolean;
}

export function InteractiveBarChart({
  data,
  maxItems = 5,
  onItemPress,
  onSeeAllPress,
  showSeeAll = true,
  valueLabel = '',
  compact = false,
}: InteractiveBarChartProps) {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map((d) => d.value), 1);
  const barWidth = screenWidth - spacing.lg * 4 - 80;

  if (displayData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {displayData.map((item, index) => {
        const barPercent = (item.value / maxValue) * 100;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.barRow, compact && styles.barRowCompact]}
            onPress={() => onItemPress?.(item)}
            activeOpacity={onItemPress ? 0.7 : 1}
          >
            <View style={styles.labelContainer}>
              {item.icon && (
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.color || colors.primary}
                  style={styles.icon}
                />
              )}
              <View style={styles.labelTextContainer}>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
                {item.subLabel && (
                  <Text style={styles.subLabel} numberOfLines={1}>
                    {item.subLabel}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${barPercent}%`,
                    backgroundColor: item.color || colors.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{item.value}</Text>
              {valueLabel && <Text style={styles.valueLabel}>{valueLabel}</Text>}
            </View>
            {onItemPress && (
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        );
      })}
      {showSeeAll && data.length > maxItems && onSeeAllPress && (
        <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>See all {data.length} items</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  containerCompact: {
    gap: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  barRowCompact: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  labelContainer: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  labelTextContainer: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  subLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.sm,
    opacity: 0.8,
  },
  valueContainer: {
    width: 50,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  valueLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
