import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    console.log('[NotificationsScreen] useEffect - user:', user?.id, 'settings:', settings);
    if (user?.id) {
      console.log('[NotificationsScreen] Calling fetchSettings...');
      fetchSettings(user.id);
    }
  }, [user?.id]);

  // Show loading only while actively loading, not if settings haven't been fetched yet
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Manage how you receive notifications</Text>

      {/* Push Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <Card padding="none">
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications on your device</Text>
            </View>
            <Switch
              value={settings?.push_enabled ?? true}
              onValueChange={(value) => updateSettings({ push_enabled: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <Card padding="none">
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Friend Requests</Text>
              <Text style={styles.settingDescription}>When someone sends you a friend request</Text>
            </View>
            <Switch
              value={settings?.notify_friend_requests ?? true}
              onValueChange={(value) => updateSettings({ notify_friend_requests: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Achievements</Text>
              <Text style={styles.settingDescription}>When you unlock a new achievement</Text>
            </View>
            <Switch
              value={settings?.notify_achievements ?? true}
              onValueChange={(value) => updateSettings({ notify_achievements: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Event Reminders</Text>
              <Text style={styles.settingDescription}>Reminders for upcoming events</Text>
            </View>
            <Switch
              value={settings?.notify_event_reminders ?? true}
              onValueChange={(value) => updateSettings({ notify_event_reminders: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>
      </View>

      {/* Email Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email</Text>
        <Card padding="none">
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive updates via email</Text>
            </View>
            <Switch
              value={settings?.email_enabled ?? true}
              onValueChange={(value) => updateSettings({ email_enabled: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Weekly Digest</Text>
              <Text style={styles.settingDescription}>Summary of your weekly activity</Text>
            </View>
            <Switch
              value={settings?.email_weekly_digest ?? false}
              onValueChange={(value) => updateSettings({ email_weekly_digest: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
