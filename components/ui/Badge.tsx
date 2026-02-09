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

function getTextColor(bgColor?: string): string {
  if (!bgColor || !bgColor.startsWith('#')) return colors.white;
  const c = bgColor.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? colors.text : colors.white;
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

  const textColor = color ? getTextColor(color) : colors.white;

  return (
    <View style={badgeStyles}>
      <Text style={[styles.text, styles[`textSize_${size}`], { color: textColor }]}>{label}</Text>
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
