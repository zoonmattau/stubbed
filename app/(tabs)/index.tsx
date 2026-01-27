import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Avatar, Footer } from '@/components/ui';
import { EventCard } from '@/components/events';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useStatsStore } from '@/stores/statsStore';
import { usePoints, POINTS } from '@/hooks/usePoints';
import { useEventInvitations } from '@/hooks/useEventInvitations';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { LEVELS, getCurrentLevel, getNextLevel, getLevelProgress } from '@/constants/levels';

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { attendedEvents, fetchAttendedEvents } = useEventsStore();
  const { fetchStats, fetchAchievements } = useStatsStore();
  const {
    pendingInvitations,
    pendingCount,
    refresh: refreshInvitations,
    acceptInvitation,
    declineInvitation,
  } = useEventInvitations();

  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  // Add bell icon to header for invitations
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/invitations')}
          style={styles.headerBell}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {pendingCount > 0 && (
            <View style={styles.headerBellBadge}>
              <Text style={styles.headerBellBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [pendingCount, navigation]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    await Promise.all([
      fetchAttendedEvents(user.id),
      fetchStats(user.id),
      fetchAchievements(user.id),
      refreshInvitations(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptInvitation = async (id: string) => {
    const result = await acceptInvitation(id);
    if (result.success) {
      if (Platform.OS === 'web') {
        window.alert('Event added to your history!');
      } else {
        Alert.alert('Success', 'Event added to your history!');
      }
      await loadData();
    } else {
      if (Platform.OS === 'web') {
        window.alert(result.error || 'Failed to accept invitation');
      } else {
        Alert.alert('Error', result.error || 'Failed to accept invitation');
      }
    }
  };

  const handleDeclineInvitation = async (id: string) => {
    const result = await declineInvitation(id);
    if (!result.success) {
      if (Platform.OS === 'web') {
        window.alert(result.error || 'Failed to decline invitation');
      } else {
        Alert.alert('Error', result.error || 'Failed to decline invitation');
      }
    }
  };

  const recentEvents = attendedEvents.slice(0, 3);

  // Get achievements for total points calculation
  const { achievements } = useStatsStore();
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const achievementPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  // Calculate user points from attendance history + achievements (matching profile)
  const { totalPoints: activityPoints } = usePoints(attendedEvents);
  const userPoints = activityPoints + achievementPoints;

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

    // Add achievement points to the most recent event (simplified attribution)
    if (sortedEvents.length > 0 && achievementPoints > 0) {
      const mostRecentId = sortedEvents[sortedEvents.length - 1].id;
      pointsMap[mostRecentId] = (pointsMap[mostRecentId] || 0) + achievementPoints;
    }

    return pointsMap;
  }, [attendedEvents, achievementPoints]);

  // Calculate local stats from attendedEvents (handles both FK and text fields)
  const localStats = useMemo(() => {
    const uniqueSports = new Set<string>();
    const uniqueTeams = new Set<string>();
    const uniqueVenues = new Set<string>();

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      // Sport - use FK or text field
      const sportName = event.sport?.name || event.sport_name;
      if (sportName) uniqueSports.add(sportName.toLowerCase());

      // Teams - use FK or text field
      const homeTeam = event.home_team?.name || event.home_team_name;
      const awayTeam = event.away_team?.name || event.away_team_name;
      if (homeTeam) uniqueTeams.add(homeTeam.toLowerCase());
      if (awayTeam) uniqueTeams.add(awayTeam.toLowerCase());

      // Venue - use FK or text field
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

  const currentLevel = useMemo(() => getCurrentLevel(userPoints), [userPoints]);
  const nextLevel = getNextLevel(currentLevel);
  const progressToNext = getLevelProgress(userPoints, currentLevel, nextLevel);

  // Compute readable points text color based on level card background
  const pointsTextColor = useMemo(() => {
    const getLuminance = (hex: string) => {
      const c = hex.replace('#', '');
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      const lin = (v: number) =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const bgL = getLuminance(currentLevel.color);
    const greenL = getLuminance(colors.success);
    const contrast = (l1: number, l2: number) =>
      (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const greenContrast = contrast(greenL, bgL);
    // Use green only if it has at least 3:1 contrast ratio (WCAG minimum)
    return greenContrast >= 3 ? colors.success : colors.white;
  }, [currentLevel.color]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            G'day, {profile?.first_name || profile?.display_name || profile?.username || 'Fan'}!
          </Text>
          <Text style={styles.subGreeting}>Ready for your next event?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Avatar
            source={profile?.avatar_url}
            name={profile?.display_name || profile?.username}
            size="lg"
          />
        </TouchableOpacity>
      </View>

      {/* Event Tag Notifications */}
      {pendingCount > 0 && (
        <View style={styles.notificationsSection}>
          <View style={styles.notificationsHeader}>
            <View style={styles.notificationsBadge}>
              <Ionicons name="notifications" size={18} color={colors.white} />
              <Text style={styles.notificationsBadgeText}>{pendingCount}</Text>
            </View>
            <Text style={styles.notificationsTitle}>Event Invitations</Text>
          </View>
          {pendingInvitations.slice(0, 3).map((invitation) => {
            const event = invitation.attended_event?.event;
            const fromUser = invitation.from_user;
            const homeTeam = event?.home_team?.name || event?.home_team_name || 'Home';
            const awayTeam = event?.away_team?.name || event?.away_team_name || 'Away';
            const homeTeamLogo = event?.home_team?.logo_url;
            const awayTeamLogo = event?.away_team?.logo_url;
            return (
              <Card key={invitation.id} style={styles.notificationCard}>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationMain}>
                    <View style={styles.notificationFrom}>
                      <Avatar
                        source={fromUser?.avatar_url}
                        name={fromUser?.display_name || fromUser?.username}
                        size="sm"
                      />
                      <Text style={styles.notificationFromText}>
                        <Text style={styles.notificationFromName}>
                          {fromUser?.display_name || fromUser?.username}
                        </Text>
                        {' tagged you in an event'}
                      </Text>
                    </View>
                    <View style={styles.notificationEvent}>
                      <View style={styles.notificationTeamLogos}>
                        {homeTeamLogo ? (
                          <Image source={{ uri: homeTeamLogo }} style={styles.notificationTeamLogo} />
                        ) : (
                          <View style={[styles.notificationTeamLogoPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
                            <Text style={styles.notificationTeamLogoText}>{homeTeam[0]}</Text>
                          </View>
                        )}
                        {awayTeamLogo ? (
                          <Image source={{ uri: awayTeamLogo }} style={[styles.notificationTeamLogo, styles.notificationTeamLogoOverlap]} />
                        ) : (
                          <View style={[styles.notificationTeamLogoPlaceholder, styles.notificationTeamLogoOverlap, { backgroundColor: `${colors.warning}20` }]}>
                            <Text style={styles.notificationTeamLogoText}>{awayTeam[0]}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.notificationEventText} numberOfLines={1}>
                        {homeTeam} vs {awayTeam}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={[styles.notificationButton, styles.notificationButtonAccept]}
                      onPress={() => handleAcceptInvitation(invitation.id)}
                    >
                      <Ionicons name="checkmark" size={18} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.notificationButton, styles.notificationButtonDecline]}
                      onPress={() => handleDeclineInvitation(invitation.id)}
                    >
                      <Ionicons name="close" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })}
          {pendingCount > 3 && (
            <TouchableOpacity style={styles.viewAllNotifications} onPress={() => router.push('/invitations')}>
              <Text style={styles.viewAllNotificationsText}>
                View all {pendingCount} invitations
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Hero Stats Card with Stadium Background */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/stats')}
      >
        <ImageBackground
          source={require('@/assets/images/stadium-hero.jpg')}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
        >
          {/* Dark overlay for readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          >
            {/* Main stat - Events */}
            <View style={styles.heroMain}>
              <Text style={styles.heroNumber}>{localStats.totalEvents}</Text>
              <Text style={styles.heroLabel}>Events Attended</Text>
            </View>

            {/* Divider */}
            <View style={styles.heroDivider} />

            {/* Secondary stats in column */}
            <View style={styles.heroSecondary}>
              {/* Sports */}
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatIcon}>
                  <Ionicons name="basketball" size={16} color={colors.info} />
                </View>
                <Text style={styles.heroStatValue}>{localStats.totalSports}</Text>
                <Text style={styles.heroStatLabel}>sports</Text>
              </View>

              {/* Teams */}
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatIcon}>
                  <Ionicons name="shield" size={16} color={colors.warning} />
                </View>
                <Text style={styles.heroStatValue}>{localStats.totalTeams}</Text>
                <Text style={styles.heroStatLabel}>teams</Text>
              </View>

              {/* Venues */}
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatIcon}>
                  <Ionicons name="location" size={16} color={colors.success} />
                </View>
                <Text style={styles.heroStatValue}>{localStats.totalVenues}</Text>
                <Text style={styles.heroStatLabel}>venues</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>

      {/* Level Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/achievements')}
        style={styles.levelCard}
      >
        <LinearGradient
          colors={[currentLevel.color, `${currentLevel.color}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCardGradient}
        >
          <View style={styles.levelCardHeader}>
            <View style={styles.levelIconContainer}>
              <Ionicons name={currentLevel.icon as any} size={28} color={colors.white} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level {currentLevel.level}</Text>
              <Text style={styles.levelName}>{currentLevel.name}</Text>
            </View>
            <View style={styles.levelPoints}>
              <View style={styles.levelPointsRow}>
                <Text style={styles.levelPointsValue}>{userPoints}</Text>
                {nextLevel && (
                  <Text style={styles.levelPointsMax}>/{nextLevel.minPoints}</Text>
                )}
              </View>
              <Text style={styles.levelPointsLabel}>points</Text>
            </View>
          </View>

          {nextLevel && (
            <View style={styles.levelProgress}>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
              </View>
              <Text style={styles.levelProgressText}>
                {nextLevel.minPoints - userPoints} pts to {nextLevel.name}
              </Text>
            </View>
          )}

          {/* Recent Points Activity */}
          <View style={styles.levelTips}>
            {recentEvents.length > 0 ? (
              <>
                <Text style={styles.levelTipsTitle}>Recent points earned:</Text>
                <View style={styles.recentPointsList}>
                  {recentEvents.slice(0, 3).map((attended) => {
                    const event = attended.event;
                    if (!event) return null;
                    const homeTeam = event.home_team?.name || event.home_team_name || 'Home';
                    const awayTeam = event.away_team?.name || event.away_team_name || 'Away';
                    const isWin = attended.result === 'win';
                    const hasSupport = attended.supported_team && attended.supported_team !== 'neutral';
                    // Use pre-calculated points including discovery bonuses and achievements
                    const eventPoints = pointsPerEvent[attended.id] || POINTS.ATTEND_EVENT;
                    return (
                      <View key={attended.id} style={styles.recentPointItem}>
                        <View style={styles.recentPointIcon}>
                          <Ionicons
                            name={isWin && hasSupport ? 'trophy' : 'ticket'}
                            size={12}
                            color="rgba(255,255,255,0.9)"
                          />
                        </View>
                        <Text style={styles.recentPointText} numberOfLines={1}>
                          {homeTeam} vs {awayTeam}
                        </Text>
                        <Text style={[styles.recentPointValue, { color: pointsTextColor }]}>
                          +{eventPoints}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.levelTipsTitle}>Ways to earn points:</Text>
                <View style={styles.levelTipsGrid}>
                  <View style={styles.levelTipItem}>
                    <Ionicons name="ticket" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.levelTipText}>Attend event (+{POINTS.ATTEND_EVENT})</Text>
                  </View>
                  <View style={styles.levelTipItem}>
                    <Ionicons name="trophy" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.levelTipText}>Team wins (+{POINTS.TEAM_WIN})</Text>
                  </View>
                  <View style={styles.levelTipItem}>
                    <Ionicons name="flame" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.levelTipText}>3-win streak (+{POINTS.WIN_STREAK_3})</Text>
                  </View>
                  <View style={styles.levelTipItem}>
                    <Ionicons name="star" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.levelTipText}>New team (+{POINTS.NEW_TEAM})</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/add')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.success, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add-circle" size={24} color={colors.white} />
          <Text style={styles.addButtonText}>Add New Event</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Recent Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {recentEvents.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {recentEvents.map((attended) => (
              <EventCard
                key={attended.id}
                event={attended.event!}
                attendance={attended}
                onPress={() => router.push(`/event/${attended.event_id}`)}
                mini
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyText}>
                Tap the button above to add your first event
              </Text>
            </View>
          </Card>
        )}
      </View>

      {/* Explore Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore</Text>
        </View>
        <View style={styles.exploreGrid}>
          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.success }]}
            onPress={() => router.push('/(tabs)/stats')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="stats-chart" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>Your Stats</Text>
              <Text style={styles.exploreCardSubtitle}>View detailed analytics</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.info }]}
            onPress={() => router.push('/friends')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="people" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>Friends</Text>
              <Text style={styles.exploreCardSubtitle}>Connect with fans</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.gold }]}
            onPress={() => router.push('/achievements')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="trophy" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>Achievements</Text>
              <Text style={styles.exploreCardSubtitle}>Unlock rewards</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exploreCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/stats/map')}
            activeOpacity={0.8}
          >
            <View style={styles.exploreCardContent}>
              <View style={styles.exploreCardIcon}>
                <Ionicons name="globe" size={24} color={colors.white} />
              </View>
              <Text style={styles.exploreCardTitle}>World Map</Text>
              <Text style={styles.exploreCardSubtitle}>Places you've been</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerBell: {
    marginRight: spacing.md,
    position: 'relative',
  },
  headerBellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBellBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Hero Card
  heroCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroCardImage: {
    borderRadius: borderRadius.xl,
  },
  heroOverlay: {
    flexDirection: 'row',
    padding: spacing.lg,
  },
  heroMain: {
    flex: 1,
    justifyContent: 'center',
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.white,
    lineHeight: 52,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.lg,
  },
  heroSecondary: {
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    minWidth: 20,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },

  // Add Button
  addButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  addButtonText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },

  // Sections
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
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  eventsList: {
    gap: spacing.md,
  },

  // Empty State
  emptyCard: {
    padding: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Explore Grid
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  exploreCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  exploreCardContent: {
    padding: spacing.md,
    minHeight: 100,
  },
  exploreCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  exploreCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  exploreCardSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Level Card
  levelCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  levelCardGradient: {
    padding: spacing.lg,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  levelPoints: {
    alignItems: 'flex-end',
  },
  levelPointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  levelPointsValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  levelPointsMax: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  levelPointsLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  levelProgress: {
    marginTop: spacing.md,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  levelTips: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  levelTipsTitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  levelTipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  levelTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '48%',
    marginBottom: 2,
  },
  levelTipText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  recentPointsList: {
    gap: spacing.xs,
  },
  recentPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  recentPointIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentPointText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
  },
  recentPointValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Notifications Section
  notificationsSection: {
    marginBottom: spacing.lg,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  notificationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  notificationsBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  notificationsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  notificationCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationMain: {
    flex: 1,
    gap: spacing.sm,
  },
  notificationFrom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationFromText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  notificationFromName: {
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  notificationEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationTeamLogos: {
    flexDirection: 'row',
  },
  notificationTeamLogo: {
    width: 24,
    height: 24,
  },
  notificationTeamLogoOverlap: {
    marginLeft: -8,
  },
  notificationTeamLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notificationTeamLogoText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  notificationEventText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButtonAccept: {
    backgroundColor: colors.success,
  },
  notificationButtonDecline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewAllNotifications: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  viewAllNotificationsText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
