import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function PrivacyScreen() {
  const { user } = useAuthStore();
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    if (user?.id) {
      fetchSettings(user.id);
    }
  }, [user?.id]);

  const handleExportData = () => {
    if (Platform.OS === 'web') {
      window.alert('Data export will be sent to your email.');
    } else {
      Alert.alert('Export Data', 'Data export will be sent to your email.');
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      window.alert('Please contact support@stubbed.app to delete your account.');
    } else {
      Alert.alert(
        'Delete Account',
        'Please contact support@stubbed.app to delete your account.',
        [{ text: 'OK' }]
      );
    }
  };

  // Show loading only briefly while fetching, then show content with defaults
  if (isLoading && !settings) {
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

      <Text style={styles.title}>Privacy</Text>
      <Text style={styles.subtitle}>Control who can see your information</Text>

      {/* Profile Visibility */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Visibility</Text>
        <Card padding="none">
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Profile</Text>
              <Text style={styles.settingDescription}>Allow anyone to view your profile</Text>
            </View>
            <Switch
              value={settings?.profile_public ?? true}
              onValueChange={(value) => updateSettings({ profile_public: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Stats</Text>
              <Text style={styles.settingDescription}>Display your statistics to others</Text>
            </View>
            <Switch
              value={settings?.show_stats ?? true}
              onValueChange={(value) => updateSettings({ show_stats: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Events</Text>
              <Text style={styles.settingDescription}>Display events you've attended</Text>
            </View>
            <Switch
              value={settings?.show_events ?? true}
              onValueChange={(value) => updateSettings({ show_events: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>
      </View>

      {/* Social Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Features</Text>
        <Card padding="none">
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Tagging</Text>
              <Text style={styles.settingDescription}>Let friends tag you in events</Text>
            </View>
            <Switch
              value={settings?.allow_tagging ?? true}
              onValueChange={(value) => updateSettings({ allow_tagging: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show on Leaderboards</Text>
              <Text style={styles.settingDescription}>Appear in public rankings</Text>
            </View>
            <Switch
              value={settings?.show_on_leaderboards ?? true}
              onValueChange={(value) => updateSettings({ show_on_leaderboards: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>
      </View>

      {/* Reviews & Explore */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews & Explore</Text>
        <Card padding="none">
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Reviews</Text>
              <Text style={styles.settingDescription}>Show your reviews in the Explore feed</Text>
            </View>
            <Switch
              value={settings?.reviews_public ?? true}
              onValueChange={(value) => updateSettings({ reviews_public: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Comments</Text>
              <Text style={styles.settingDescription}>Let others comment on your reviews</Text>
            </View>
            <Switch
              value={settings?.allow_comments ?? true}
              onValueChange={(value) => updateSettings({ allow_comments: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Watched Reviews</Text>
              <Text style={styles.settingDescription}>Include reviews for events you watched (didn't attend)</Text>
            </View>
            <Switch
              value={settings?.show_watched_reviews ?? true}
              onValueChange={(value) => updateSettings({ show_watched_reviews: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Card padding="none">
          <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>Export My Data</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.settingItemBorder]}
            onPress={handleDeleteAccount}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
