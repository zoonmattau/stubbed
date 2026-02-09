import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using Stubbed ("the App"), you agree to be bound by these
          Terms of Service. If you do not agree to these terms, please do not use
          the App.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          Stubbed is a sports event tracking application that allows users to:
        </Text>
        <Text style={styles.bulletPoint}>• Log and track sporting events they attend</Text>
        <Text style={styles.bulletPoint}>• View upcoming sports events and schedules</Text>
        <Text style={styles.bulletPoint}>• Track statistics about their event attendance</Text>
        <Text style={styles.bulletPoint}>• Connect with other users and share experiences</Text>
        <Text style={styles.bulletPoint}>• Earn achievements and track progress</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          To use certain features of the App, you must create an account. You are
          responsible for:
        </Text>
        <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your account</Text>
        <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
        <Text style={styles.bulletPoint}>• Providing accurate and complete information</Text>
        <Text style={styles.bulletPoint}>• Notifying us of any unauthorized use</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. User Content</Text>
        <Text style={styles.paragraph}>
          You retain ownership of content you create (notes, ratings, photos). By
          posting content, you grant us a non-exclusive license to use, display,
          and distribute that content within the App.
        </Text>
        <Text style={styles.paragraph}>You agree not to post content that:</Text>
        <Text style={styles.bulletPoint}>• Is illegal, harmful, or offensive</Text>
        <Text style={styles.bulletPoint}>• Infringes on intellectual property rights</Text>
        <Text style={styles.bulletPoint}>• Contains malware or harmful code</Text>
        <Text style={styles.bulletPoint}>• Violates the privacy of others</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Sports Data</Text>
        <Text style={styles.paragraph}>
          Sports event data, scores, schedules, and team information are provided
          by third-party sources including ESPN and TheSportsDB. We do not guarantee
          the accuracy or completeness of this data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
        <Text style={styles.paragraph}>You agree not to:</Text>
        <Text style={styles.bulletPoint}>• Use the App for any illegal purpose</Text>
        <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access</Text>
        <Text style={styles.bulletPoint}>• Interfere with or disrupt the service</Text>
        <Text style={styles.bulletPoint}>• Create multiple accounts to circumvent restrictions</Text>
        <Text style={styles.bulletPoint}>• Scrape or harvest data from the App</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The App and its original content, features, and functionality are owned
          by Stubbed and are protected by international copyright, trademark, and
          other intellectual property laws.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account at any time, without prior notice,
          for conduct that we believe violates these Terms or is harmful to other
          users, us, or third parties, or for any other reason.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
          GUARANTEE THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING
          FROM YOUR USE OF THE APP.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. We will notify
          users of significant changes. Your continued use of the App after changes
          constitutes acceptance of the new terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={styles.contactEmail}>support@stubbed.app</Text>
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
    paddingBottom: spacing.xl * 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  contactEmail: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
});
