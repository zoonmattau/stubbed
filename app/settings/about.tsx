import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <View style={styles.appIcon}>
          <Ionicons name="ticket" size={48} color={colors.white} />
        </View>
        <Text style={styles.appName}>Stubbed</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appTagline}>Track your sports memories</Text>
      </View>

      {/* Description */}
      <Card style={styles.descriptionCard}>
        <Text style={styles.description}>
          Stubbed helps you track every sports event you attend. Log your games,
          earn achievements, connect with fellow fans, and build your legacy as
          the ultimate sports supporter.
        </Text>
      </Card>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links</Text>
        <Card padding="none">
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://stubbed.app')}
          >
            <Ionicons name="globe-outline" size={22} color={colors.text} />
            <Text style={styles.linkText}>Website</Text>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, styles.linkItemBorder]}
            onPress={() => Linking.openURL('https://stubbed.app/terms')}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.text} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, styles.linkItemBorder]}
            onPress={() => Linking.openURL('https://stubbed.app/privacy')}
          >
            <Ionicons name="shield-outline" size={22} color={colors.text} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, styles.linkItemBorder]}
            onPress={() => Linking.openURL('https://twitter.com/stubbedapp')}
          >
            <Ionicons name="logo-twitter" size={22} color={colors.info} />
            <Text style={styles.linkText}>Follow us on Twitter</Text>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, styles.linkItemBorder]}
            onPress={() => Linking.openURL('https://instagram.com/stubbedapp')}
          >
            <Ionicons name="logo-instagram" size={22} color={colors.error} />
            <Text style={styles.linkText}>Follow us on Instagram</Text>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Acknowledgments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Built With</Text>
        <Card>
          <View style={styles.techStack}>
            <View style={styles.techItem}>
              <Text style={styles.techName}>React Native</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techName}>Expo</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techName}>Supabase</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techName}>TypeScript</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Credits */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for sports fans everywhere</Text>
        <Text style={styles.copyright}>2024 Stubbed. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  appVersion: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  appTagline: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  descriptionCard: {
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  linkItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  techItem: {
    backgroundColor: `${colors.primary}15`,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  techName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  copyright: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
