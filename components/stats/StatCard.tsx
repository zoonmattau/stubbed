import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = colors.primary,
  trend,
  trendValue,
  onPress,
}: StatCardProps) {
  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        {trend && trendValue && (
          <View style={[styles.trend, styles[`trend_${trend}`]]}>
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'}
              size={12}
              color={
                trend === 'up'
                  ? colors.success
                  : trend === 'down'
                  ? colors.error
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    trend === 'up'
                      ? colors.success
                      : trend === 'down'
                      ? colors.error
                      : colors.textSecondary,
                },
              ]}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  trend_up: {
    backgroundColor: `${colors.success}20`,
  },
  trend_down: {
    backgroundColor: `${colors.error}20`,
  },
  trend_neutral: {
    backgroundColor: colors.surfaceLight,
  },
  trendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
