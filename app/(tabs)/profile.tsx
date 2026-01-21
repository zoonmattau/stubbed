import React, { useEffect, useState } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { ProgressBar } from '@/components/stats';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { stats, achievements, isLoading: statsLoading, fetchStats, fetchAchievements } = useStatsStore();
  const { teams: favoriteTeams, addTeamManual, removeTeam } = useFavoritesStore();

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
      fetchAchievements(user.id);
    }
  }, [user?.id]);

  const handleAddFavoriteTeam = () => {
    if (!newTeamName.trim()) return;
    addTeamManual({ name: newTeamName.trim() });
    setNewTeamName('');
    setShowAddTeamModal(false);
  };

  const handleRemoveFavoriteTeam = (teamId: string, teamName: string) => {
    const doRemove = () => removeTeam(teamId);

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${teamName} from your favorites?`)) {
        doRemove();
      }
    } else {
      Alert.alert(
        'Remove Team',
        `Remove ${teamName} from your favorites?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: doRemove },
        ]
      );
    }
  };

  const handleSignOut = async () => {
    const doSignOut = async () => {
      try {
        console.log('[Profile] Signing out...');
        await signOut();
        console.log('[Profile] Signed out, redirecting...');
        router.replace('/(auth)/login');
      } catch (error) {
        console.error('[Profile] Sign out error:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to sign out. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
      }
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

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  // Get best display name, avoiding generic app-related names
  const getDisplayName = () => {
    // Priority 1: first_name if it exists
    if (profile?.first_name) {
      return profile.first_name;
    }

    // Priority 2: display_name, but filter out generic names
    if (profile?.display_name) {
      const genericNames = ['sports', 'stubbed', 'user', 'tracker', 'app'];
      const firstName = profile.display_name.split(' ')[0];
      if (!genericNames.includes(firstName.toLowerCase())) {
        return firstName;
      }
    }

    // Priority 3: username
    if (profile?.username) {
      return profile.username;
    }

    return 'User';
  };

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
              {getDisplayName()}
            </Text>
            <Text style={styles.username}>@{profile?.username || 'unknown'}</Text>
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

      {/* Favorite Teams */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorite Teams</Text>
          <TouchableOpacity onPress={() => setShowAddTeamModal(true)}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.favoriteTeamsHint}>
          Your supported team will be auto-selected when adding events
        </Text>
        <Card>
          {favoriteTeams.length > 0 ? (
            <View style={styles.favoriteTeamsList}>
              {favoriteTeams.map((team) => (
                <View key={team.id} style={styles.favoriteTeamItem}>
                  {team.badge ? (
                    <Image source={{ uri: team.badge }} style={styles.favoriteTeamBadge} />
                  ) : (
                    <View style={styles.favoriteTeamBadgePlaceholder}>
                      <Ionicons name="shield" size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.favoriteTeamInfo}>
                    <Text style={styles.favoriteTeamName}>{team.name}</Text>
                    {team.sport && team.sport !== 'Unknown' && (
                      <Text style={styles.favoriteTeamSport}>{team.sport}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFavoriteTeam(team.id, team.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyFavoriteTeams}>
              <Ionicons name="heart-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                No favorite teams yet. Add teams to auto-select them when adding events!
              </Text>
            </View>
          )}
        </Card>
      </View>

      {/* Add Team Modal */}
      <Modal
        visible={showAddTeamModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddTeamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Favorite Team</Text>
              <TouchableOpacity onPress={() => setShowAddTeamModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Enter the team name exactly as it appears in events
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newTeamName}
              onChangeText={setNewTeamName}
              placeholder="e.g. Melbourne Storm, Collingwood"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setNewTeamName('');
                  setShowAddTeamModal(false);
                }}
                style={styles.modalButton}
              />
              <Button
                title="Add Team"
                onPress={handleAddFavoriteTeam}
                disabled={!newTeamName.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => router.push('/settings/about')}>
            <Ionicons name="information-circle-outline" size={22} color={colors.text} />
            <Text style={styles.menuItemText}>About</Text>
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
  // Favorite Teams styles
  favoriteTeamsHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  favoriteTeamsList: {
    gap: spacing.sm,
  },
  favoriteTeamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  favoriteTeamBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  favoriteTeamBadgePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteTeamInfo: {
    flex: 1,
  },
  favoriteTeamName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  favoriteTeamSport: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyFavoriteTeams: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
