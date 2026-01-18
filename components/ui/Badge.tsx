import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  color?: string;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  color,
}: BadgeProps) {
  const badgeStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    color && { backgroundColor: color },
    style,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={[styles.text, styles[`textSize_${size}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surfaceLight,
  },
  success: {
    backgroundColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  error: {
    backgroundColor: colors.error,
  },
  info: {
    backgroundColor: colors.info,
  },
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  textSize_sm: {
    fontSize: fontSize.xs,
  },
  textSize_md: {
    fontSize: fontSize.sm,
  },
});
