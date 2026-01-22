import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button, Footer } from '@/components/ui';
import { ProgressBar } from '@/components/stats';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { usePoints, POINTS } from '@/hooks/usePoints';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import { useFollows } from '@/hooks/useFollows';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { LEVELS, getCurrentLevel, getNextLevel, getLevelProgress } from '@/constants/levels';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { achievements, fetchAchievements, recalculateAchievements } = useStatsStore();
  const { teams: allTeams, fetchTeams, attendedEvents, fetchAttendedEvents, isLoading: eventsLoading } = useEventsStore();
  const { teams: favoriteTeams, addTeamManual, removeTeam } = useFavoritesStore();
  const { getTeamLogo } = useTeamLogos();
  const { getFollowCounts } = useFollows();

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<typeof allTeams>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers_count: 0, following_count: 0 });

  // Refetch data when screen comes into focus (handles navigation back)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Fetch attended events first (fast, local calculation depends on this)
        fetchAttendedEvents(user.id);
        // Then fetch achievements
        fetchAchievements(user.id);
        // Recalculate achievements in background
        recalculateAchievements(user.id);
        // Fetch follow counts
        getFollowCounts(user.id).then(setFollowCounts);
      }
    }, [user?.id])
  );

  // Calculate local stats from attendedEvents (handles both FK and text fields)
  const localStats = useMemo(() => {
    const uniqueSports = new Set<string>();
    const uniqueTeams = new Set<string>();
    const uniqueVenues = new Set<string>();

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      const sportName = event.sport?.name || event.sport_name;
      if (sportName) uniqueSports.add(sportName.toLowerCase());

      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) uniqueTeams.add(homeTeam.toLowerCase());
      if (awayTeam) uniqueTeams.add(awayTeam.toLowerCase());

      const venue = event.venue?.name || event.venue_name;
      if (venue) uniqueVenues.add(venue.toLowerCase());
    });

    return {
      totalEvents: attendedEvents.length,
      totalSports: uniqueSports.size,
      totalTeams: uniqueTeams.size,
      totalVenues: uniqueVenues.size,
    };
  }, [attendedEvents]);

  const handleAddFavoriteTeam = (teamName?: string, sport?: string, badge?: string) => {
    const name = teamName || newTeamName.trim();
    if (!name) return;
    addTeamManual({ name, sport, badge });
    setNewTeamName('');
    setFilteredTeams([]);
    setShowSuggestions(false);
    setShowAddTeamModal(false);
  };

  const handleTeamSearch = (text: string) => {
    setNewTeamName(text);
    if (text.length >= 2) {
      const filtered = allTeams.filter(team =>
        team.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5);
      setFilteredTeams(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredTeams([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectTeam = (team: typeof allTeams[0]) => {
    handleAddFavoriteTeam(team.name, undefined, team.logo_url || undefined);
  };

  const handleOpenAddTeamModal = () => {
    fetchTeams(); // Load teams when modal opens
    setShowAddTeamModal(true);
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
  const achievementPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  // Use points hook for activity-based points (attendance, wins, streaks, discovery)
  const { totalPoints: activityPoints } = usePoints(attendedEvents);

  // Total points = achievement points + activity points
  const totalPoints = achievementPoints + activityPoints;

  // Calculate points earned per event (including discovery bonuses)
  const pointsPerEvent = useMemo(() => {
    const pointsMap: Record<string, number> = {};
    const seenTeams = new Set<string>();
    const seenSports = new Set<string>();
    const seenVenues = new Set<string>();

    // Sort by date to calculate discovery bonuses correctly
    const sortedEvents = [...attendedEvents].sort((a, b) => {
      const dateA = new Date(a.event?.event_date || a.created_at);
      const dateB = new Date(b.event?.event_date || b.created_at);
      return dateA.getTime() - dateB.getTime();
    });

    sortedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      let eventPoints = POINTS.ATTEND_EVENT;

      // Win bonus
      const isWin = attended.result === 'win';
      const hasSupport = attended.supported_team && attended.supported_team !== 'neutral';
      if (isWin && hasSupport) {
        eventPoints += POINTS.TEAM_WIN;
      }

      // Discovery bonuses
      const homeTeam = (event.home_team?.name || event.home_team_name || '').toLowerCase();
      const awayTeam = (event.away_team?.name || event.away_team_name || '').toLowerCase();
      const sport = (event.sport?.name || event.sport_name || '').toLowerCase();
      const venue = (event.venue?.name || event.venue_name || '').toLowerCase();

      if (homeTeam && !seenTeams.has(homeTeam)) {
        seenTeams.add(homeTeam);
        eventPoints += POINTS.NEW_TEAM;
      }
      if (awayTeam && !seenTeams.has(awayTeam)) {
        seenTeams.add(awayTeam);
        eventPoints += POINTS.NEW_TEAM;
      }
      if (sport && !seenSports.has(sport)) {
        seenSports.add(sport);
        eventPoints += POINTS.NEW_SPORT;
      }
      if (venue && !seenVenues.has(venue)) {
        seenVenues.add(venue);
        eventPoints += POINTS.NEW_VENUE;
      }

      pointsMap[attended.id] = eventPoints;
    });

    return pointsMap;
  }, [attendedEvents]);

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

  // Calculate level based on points using shared levels
  const currentLevel = getCurrentLevel(totalPoints);
  const nextLevel = getNextLevel(currentLevel);
  const levelProgress = getLevelProgress(totalPoints, currentLevel, nextLevel);
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - totalPoints : 0;

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
        <View style={[styles.levelContainer, { backgroundColor: `${currentLevel.color}15` }]}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadgeContainer}>
              <Ionicons name={currentLevel.icon as any} size={20} color={currentLevel.color} />
              <View style={[styles.levelBadge, { backgroundColor: currentLevel.color }]}>
                <Text style={styles.levelText}>{currentLevel.name}</Text>
              </View>
            </View>
            <View style={styles.levelPointsContainer}>
              <Text style={styles.levelPointsValue}>{totalPoints}</Text>
              {nextLevel && (
                <Text style={styles.levelPointsMax}>/{nextLevel.minPoints}</Text>
              )}
            </View>
          </View>
          {nextLevel && (
            <ProgressBar
              progress={levelProgress}
              label={`${pointsToNextLevel} pts to ${nextLevel.name}`}
              color={currentLevel.color}
            />
          )}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')}>
          <Ionicons name="pencil" size={16} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </Card>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats Summary</Text>
        {eventsLoading && attendedEvents.length === 0 ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statsLoadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.quickStats}>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/events')}>
              <Ionicons name="ticket" size={24} color={colors.primary} />
              <Text style={styles.quickStatValue}>{localStats.totalEvents}</Text>
              <Text style={styles.quickStatLabel}>Events</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/achievements')}>
              <Ionicons name="trophy" size={24} color={colors.gold} />
              <Text style={styles.quickStatValue}>{unlockedAchievements.length}</Text>
              <Text style={styles.quickStatLabel}>Achievements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push('/stats')}>
              <Ionicons name="shield" size={24} color={colors.warning} />
              <Text style={styles.quickStatValue}>{localStats.totalTeams}</Text>
              <Text style={styles.quickStatLabel}>Teams</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatItem} onPress={() => router.push(`/followers/${user?.id}?tab=followers`)}>
              <Ionicons name="people" size={24} color={colors.info} />
              <Text style={styles.quickStatValue}>{followCounts.followers_count}</Text>
              <Text style={styles.quickStatLabel}>Followers</Text>
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

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/events')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {/* Points Summary Header */}
          <View style={styles.activitySummary}>
            <View style={styles.activitySummaryItem}>
              <Text style={styles.activitySummaryValue}>{localStats.totalEvents}</Text>
              <Text style={styles.activitySummaryLabel}>Events</Text>
            </View>
            <View style={styles.activitySummaryDivider} />
            <View style={styles.activitySummaryItem}>
              <Text style={styles.activitySummaryValue}>{localStats.totalTeams}</Text>
              <Text style={styles.activitySummaryLabel}>Teams</Text>
            </View>
            <View style={styles.activitySummaryDivider} />
            <View style={styles.activitySummaryItem}>
              <Text style={styles.activitySummaryValue}>{localStats.totalVenues}</Text>
              <Text style={styles.activitySummaryLabel}>Venues</Text>
            </View>
            <View style={styles.activitySummaryDivider} />
            <View style={styles.activitySummaryItem}>
              <Text style={[styles.activitySummaryValue, { color: colors.success }]}>+{totalPoints}</Text>
              <Text style={styles.activitySummaryLabel}>Points</Text>
            </View>
          </View>

          {/* Recent Activity - Events and Achievements */}
          {(attendedEvents.length > 0 || unlockedAchievements.length > 0) ? (
            <View style={styles.recentActivityList}>
              {/* Latest Events */}
              {attendedEvents.length > 0 && (
                <>
                  <Text style={styles.recentActivityHeader}>Latest Events</Text>
                  {attendedEvents.slice(0, 3).map((attended, index, arr) => {
                    const event = attended.event;
                    if (!event) return null;
                    const homeTeam = event.home_team?.name || event.home_team_name || 'Home';
                    const awayTeam = event.away_team?.name || event.away_team_name || 'Away';
                    // Try FK logo first, then lookup by team name
                    const homeTeamLogo = event.home_team?.logo_url || getTeamLogo(homeTeam);
                    const awayTeamLogo = event.away_team?.logo_url || getTeamLogo(awayTeam);
                    const eventDate = new Date(event.event_date || attended.created_at);
                    // Get base points from calculation, add achievements if this is the most recent event
                    const basePoints = pointsPerEvent[attended.id] || POINTS.ATTEND_EVENT;
                    const isFirstEvent = index === 0;
                    const eventPoints = isFirstEvent ? basePoints + achievementPoints : basePoints;
                    return (
                      <TouchableOpacity
                        key={attended.id}
                        style={[styles.recentActivityItem, index === arr.length - 1 && styles.recentActivityItemLast]}
                        onPress={() => router.push(`/event/${attended.event_id}`)}
                      >
                        <View style={styles.recentActivityLogos}>
                          {homeTeamLogo ? (
                            <Image source={{ uri: homeTeamLogo }} style={styles.recentActivityLogo} />
                          ) : (
                            <View style={[styles.recentActivityLogoPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
                              <Text style={styles.recentActivityLogoText}>{homeTeam[0]}</Text>
                            </View>
                          )}
                          {awayTeamLogo ? (
                            <Image source={{ uri: awayTeamLogo }} style={[styles.recentActivityLogo, styles.recentActivityLogoOverlap]} />
                          ) : (
                            <View style={[styles.recentActivityLogoPlaceholder, styles.recentActivityLogoOverlap, { backgroundColor: `${colors.warning}20` }]}>
                              <Text style={styles.recentActivityLogoText}>{awayTeam[0]}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.recentActivityContent}>
                          <Text style={styles.recentActivityTitle} numberOfLines={1}>
                            {homeTeam} vs {awayTeam}
                          </Text>
                          <Text style={styles.recentActivityMeta}>
                            {eventDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                        <Text style={styles.recentActivityPoints}>+{eventPoints}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <>
                  <Text style={[styles.recentActivityHeader, { marginTop: attendedEvents.length > 0 ? spacing.md : 0 }]}>
                    Achievements Unlocked
                  </Text>
                  {unlockedAchievements.slice(0, 3).map((achievement, index, arr) => (
                    <TouchableOpacity
                      key={achievement.id}
                      style={[styles.recentActivityItem, index === arr.length - 1 && styles.recentActivityItemLast]}
                      onPress={() => router.push('/achievements')}
                    >
                      <View style={[styles.recentActivityIcon, { backgroundColor: `${colors.gold}20` }]}>
                        <Ionicons name="trophy" size={16} color={colors.gold} />
                      </View>
                      <View style={styles.recentActivityContent}>
                        <Text style={styles.recentActivityTitle} numberOfLines={1}>
                          {achievement.name}
                        </Text>
                        <Text style={styles.recentActivityMeta}>
                          {achievement.description}
                        </Text>
                      </View>
                      <Text style={styles.recentActivityPoints}>+{achievement.points}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Show discovered teams */}
              {localStats.totalTeams > 0 && (
                <>
                  <Text style={[styles.recentActivityHeader, { marginTop: spacing.md }]}>Teams Discovered</Text>
                  {(() => {
                    const seenTeams = new Set<string>();
                    const discoveredTeams: { name: string; date: Date }[] = [];

                    // Sort by date (oldest first) to track discovery order
                    const sortedEvents = [...attendedEvents].sort((a, b) =>
                      new Date(a.event?.event_date || a.created_at).getTime() -
                      new Date(b.event?.event_date || b.created_at).getTime()
                    );

                    sortedEvents.forEach(attended => {
                      const event = attended.event;
                      if (!event) return;

                      const homeTeam = event.home_team?.name || event.home_team_name;
                      const awayTeam = event.away_team?.name || event.away_team_name;
                      const eventDate = new Date(event.event_date || attended.created_at);

                      if (homeTeam && !seenTeams.has(homeTeam.toLowerCase())) {
                        seenTeams.add(homeTeam.toLowerCase());
                        discoveredTeams.push({ name: homeTeam, date: eventDate });
                      }
                      if (awayTeam && !seenTeams.has(awayTeam.toLowerCase())) {
                        seenTeams.add(awayTeam.toLowerCase());
                        discoveredTeams.push({ name: awayTeam, date: eventDate });
                      }
                    });

                    // Show most recently discovered teams (reverse to get newest first)
                    return discoveredTeams.reverse().slice(0, 3).map((team, index) => (
                      <View
                        key={team.name}
                        style={[styles.recentActivityItem, index === Math.min(discoveredTeams.length - 1, 2) && styles.recentActivityItemLast]}
                      >
                        <View style={[styles.recentActivityIcon, { backgroundColor: `${colors.warning}15` }]}>
                          <Ionicons name="shield" size={16} color={colors.warning} />
                        </View>
                        <View style={styles.recentActivityContent}>
                          <Text style={styles.recentActivityTitle} numberOfLines={1}>
                            {team.name}
                          </Text>
                          <Text style={styles.recentActivityMeta}>
                            First seen {team.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                        <Text style={styles.recentActivityPoints}>+5</Text>
                      </View>
                    ));
                  })()}
                </>
              )}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                No events yet. Start attending to earn points!
              </Text>
            </View>
          )}
        </Card>
      </View>

      {/* Favorite Teams */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorite Teams</Text>
          <TouchableOpacity onPress={handleOpenAddTeamModal}>
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
              Start typing to search for teams
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newTeamName}
              onChangeText={handleTeamSearch}
              placeholder="e.g. Melbourne Storm, Collingwood"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                {filteredTeams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectTeam(team)}
                  >
                    {team.logo_url ? (
                      <Image source={{ uri: team.logo_url }} style={styles.suggestionBadge} />
                    ) : (
                      <View style={styles.suggestionBadgePlaceholder}>
                        <Ionicons name="shield" size={16} color={colors.primary} />
                      </View>
                    )}
                    <Text style={styles.suggestionText}>{team.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setNewTeamName('');
                  setFilteredTeams([]);
                  setShowSuggestions(false);
                  setShowAddTeamModal(false);
                }}
                style={styles.modalButton}
              />
              <Button
                title="Add Team"
                onPress={() => handleAddFavoriteTeam()}
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

      <Footer />
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
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  levelPointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  levelPointsValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  levelPointsMax: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  levelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  levelProgressText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
  // Activity Summary styles
  activitySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  activitySummaryItem: {
    alignItems: 'center',
  },
  activitySummaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  activitySummaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  activitySummaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  recentActivityList: {
    paddingTop: spacing.xs,
  },
  recentActivityHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentActivityItemLast: {
    borderBottomWidth: 0,
  },
  recentActivityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  recentActivityMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  recentActivityPoints: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  recentActivityLogos: {
    flexDirection: 'row',
  },
  recentActivityLogo: {
    width: 28,
    height: 28,
  },
  recentActivityLogoOverlap: {
    marginLeft: -10,
  },
  recentActivityLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  recentActivityLogoText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  pointsBreakdownList: {
    gap: spacing.xs,
  },
  pointsBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pointsBreakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBreakdownInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBreakdownLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  pointsBreakdownValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
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
  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  suggestionBadgePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
});
