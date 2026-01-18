import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight } from '@/constants/theme';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const sizeValue = SIZES[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const containerStyles = [
    styles.container,
    { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
    style,
  ];

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[containerStyles, styles.image]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[containerStyles, styles.placeholder]}>
      <Text style={[styles.initials, { fontSize: sizeValue * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    backgroundColor: colors.surfaceLight,
  },
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});
