import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { ProgressBar } from '@/components/stats';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { seedDummyData } from '@/lib/seedDummyData';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { stats, achievements, isLoading: statsLoading, fetchStats, fetchAchievements } = useStatsStore();
  const { fetchAttendedEvents } = useEventsStore();
  const [isSeeding, setIsSeeding] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
      fetchAchievements(user.id);
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    const doSignOut = async () => {
      await signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        doSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doSignOut,
        },
      ]);
    }
  };

  const handleSeedData = async () => {
    if (!user?.id) {
      if (Platform.OS === 'web') {
        window.alert('You must be logged in to seed data');
      } else {
        Alert.alert('Error', 'You must be logged in to seed data');
      }
      return;
    }

    const doSeed = async () => {
      setIsSeeding(true);
      try {
        const result = await seedDummyData(user.id);
        if (result.success) {
          // Refresh data
          await Promise.all([
            fetchStats(user.id),
            fetchAchievements(user.id),
            fetchAttendedEvents(user.id),
          ]);
          if (Platform.OS === 'web') {
            window.alert(`Added ${result.eventsCreated} demo events to your account!`);
          } else {
            Alert.alert('Success', `Added ${result.eventsCreated} demo events to your account!`);
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('Failed to seed data. Please try again.');
          } else {
            Alert.alert('Error', 'Failed to seed data. Please try again.');
          }
        }
      } catch (error) {
        console.error('Seed error:', error);
        if (Platform.OS === 'web') {
          window.alert('Something went wrong. Please try again.');
        } else {
          Alert.alert('Error', 'Something went wrong. Please try again.');
        }
      } finally {
        setIsSeeding(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('This will add 16 sample events to your account spanning the last 12 months. Continue?');
      if (confirmed) {
        doSeed();
      }
    } else {
      Alert.alert(
        'Seed Demo Data',
        'This will add 16 sample events to your account spanning the last 12 months. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Demo Data', onPress: doSeed },
        ]
      );
    }
  };

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  // Calculate level based on points
  const level = Math.floor(totalPoints / 100) + 1;
  const pointsToNextLevel = 100 - (totalPoints % 100);
  const levelProgress = ((totalPoints % 100) / 100) * 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar
            source={profile?.avatar_url}
            name={profile?.display_name || profile?.username}
            size="xl"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>
              {(profile?.display_name || 'Sports Fan').split(' ')[0]}
            </Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelContainer}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {level}</Text>
            </View>
            <Text style={styles.pointsText}>{totalPoints} total points</Text>
          </View>
          <ProgressBar
            progress={levelProgress}
            label={`${pointsToNextLevel} pts to Level ${level + 1}`}
            color={colors.primary}
          />
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')}>
          <Ionicons name="pencil" size={16} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </Card>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats Summary</Text>
        {statsLoading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statsLoadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.quickStats}>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/events')}>
              <Ionicons name="ticket" size={24} color={colors.primary} />
              <Text style={styles.quickStatValue}>{stats?.total_events || 0}</Text>
              <Text style={styles.quickStatLabel}>Events</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/achievements')}>
              <Ionicons name="trophy" size={24} color={colors.gold} />
              <Text style={styles.quickStatValue}>{unlockedAchievements.length}</Text>
              <Text style={styles.quickStatLabel}>Achievements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/stats')}>
              <Ionicons name="shield" size={24} color={colors.warning} />
              <Text style={styles.quickStatValue}>{stats?.total_teams || 0}</Text>
              <Text style={styles.quickStatLabel}>Teams</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/friends')}>
              <Ionicons name="people" size={24} color={colors.info} />
              <Text style={styles.quickStatValue}>0</Text>
              <Text style={styles.quickStatLabel}>Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Friends Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <TouchableOpacity onPress={() => router.push('/friends')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <Card>
          <View style={styles.friendsSearchContainer}>
            <View style={styles.friendsSearchBar}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.friendsSearchInput}
                placeholder="Search for friends..."
                placeholderTextColor={colors.textMuted}
                onFocus={() => router.push('/friends')}
              />
            </View>
          </View>
          <View style={styles.friendsActions}>
            <TouchableOpacity
              style={styles.friendsActionButton}
              onPress={() => router.push('/friends/requests')}
            >
              <Ionicons name="person-add" size={20} color={colors.primary} />
              <Text style={styles.friendsActionText}>Add Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.friendsActionButton}
              onPress={() => router.push('/friends')}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.friendsActionText}>View All</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* Achievements Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <TouchableOpacity onPress={() => router.push('/achievements')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {unlockedAchievements.length > 0 ? (
            <View style={styles.achievementsList}>
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Ionicons
                      name={(achievement.icon as keyof typeof Ionicons.glyphMap) || 'trophy'}
                      size={20}
                      color={colors.gold}
                    />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementPoints}>
                      +{achievement.points} pts
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAchievements}>
              <Ionicons name="trophy-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                No achievements unlocked yet. Keep attending events!
              </Text>
            </View>
          )}
        </Card>
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card padding="none">
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/privacy')}>
            <Ionicons name="shield-outline" size={22} color={colors.text} />
            <Text style={styles.menuItemText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/help')}>
            <Ionicons name="help-circle-outline" size={22} color={colors.text} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/about')}>
            <Ionicons name="information-circle-outline" size={22} color={colors.text} />
            <Text style={styles.menuItemText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={handleSeedData}
            disabled={isSeeding}
          >
            <Ionicons name="flask-outline" size={22} color={colors.success} />
            <Text style={styles.menuItemText}>
              {isSeeding ? 'Adding Demo Data...' : 'Add Demo Data'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        variant="outline"
        onPress={handleSignOut}
        style={styles.signOutButton}
      />

      <Text style={styles.version}>Stubbed v1.0.0</Text>
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
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  levelContainer: {
    marginBottom: spacing.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelBadge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  levelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  pointsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  quickStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  statsLoadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  achievementsList: {
    gap: spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.gold}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  achievementPoints: {
    fontSize: fontSize.sm,
    color: colors.gold,
  },
  emptyAchievements: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  friendsSearchContainer: {
    marginBottom: spacing.md,
  },
  friendsSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  friendsSearchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  friendsActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  friendsActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.md,
  },
  friendsActionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  signOutButton: {
    marginBottom: spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
});
