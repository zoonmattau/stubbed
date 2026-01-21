import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/constants/theme';

const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/stubbed',
  facebook: 'https://facebook.com/stubbed',
  instagram: 'https://instagram.com/stubbed',
  tiktok: 'https://tiktok.com/@stubbed',
};

export function Footer() {
  const handleSocialPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.socialLinks}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialPress(SOCIAL_LINKS.twitter)}
        >
          <Ionicons name="logo-twitter" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialPress(SOCIAL_LINKS.facebook)}
        >
          <Ionicons name="logo-facebook" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialPress(SOCIAL_LINKS.instagram)}
        >
          <Ionicons name="logo-instagram" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialPress(SOCIAL_LINKS.tiktok)}
        >
          <Ionicons name="logo-tiktok" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.copyright}>&copy; Stubbed 2025</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xl,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
