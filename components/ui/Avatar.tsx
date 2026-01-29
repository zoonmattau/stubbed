import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight } from '@/constants/theme';

interface AvatarProps {
  source?: string | null;
  uri?: string | null; // Alias for source
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: ViewStyle;
}

export function Avatar({ source, uri, name, size = 'md', style }: AvatarProps) {
  const imageSource = source || uri;
  const sizeValue = typeof size === 'number' ? size : SIZES[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const sizeStyle = { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 };

  if (imageSource) {
    const imageStyle: ImageStyle = {
      ...sizeStyle,
      overflow: 'hidden',
      backgroundColor: colors.surfaceLight,
    };
    return (
      <Image
        source={{ uri: imageSource }}
        style={[imageStyle, style as ImageStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.container, sizeStyle, styles.placeholder, style]}>
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
