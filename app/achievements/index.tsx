import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementCard } from '@/components/achievements';
import { ProgressBar } from '@/components/stats';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { usePoints, POINTS } from '@/hooks/usePoints';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { CATEGORY_ICONS, RARITY_COLORS } from '@/constants/achievements';
import { LEVELS, getCurrentLevel, getNextLevel, getLevelProgress } from '@/constants/levels';
import type { AchievementWithStatus } from '@/types';

type CategoryFilter = 'all' | 'attendance' | 'diversity' | 'loyalty' | 'special';

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const { achievements, fetchAchievements, stats } = useStatsStore();
  const { attendedEvents, fetchAttendedEvents } = useEventsStore();

  // Get detailed points breakdown
  const pointsBreakdown = usePoints(attendedEvents);

  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showUnlocked, setShowUnlocked] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAchievements(user.id);
      fetchAttendedEvents(user.id);
    }
  }, [user?.id]);

  const filteredAchievements = achievements.filter((a) => {
    const categoryMatch = filter === 'all' || a.category === filter;
    const unlockedMatch = showUnlocked ? a.unlocked : true;
    return categoryMatch && unlockedMatch;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const achievementPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  // Total points = achievement points + activity points (matching home and profile)
  const totalPoints = achievementPoints + pointsBreakdown.totalPoints;

  // Calculate current level using shared functions
  const currentLevel = useMemo(() => getCurrentLevel(totalPoints), [totalPoints]);
  const nextLevel = useMemo(() => getNextLevel(currentLevel), [currentLevel]);
  const progressToNextLevel = useMemo(
    () => getLevelProgress(totalPoints, currentLevel, nextLevel),
    [totalPoints, currentLevel, nextLevel]
  );

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'diversity', label: 'Diversity' },
    { key: 'loyalty', label: 'Loyalty' },
    { key: 'special', label: 'Special' },
  ];

  // Group by rarity for display
  const groupedByRarity = ['legendary', 'epic', 'rare', 'uncommon', 'common'].map(
    (rarity) => ({
      rarity,
      achievements: filteredAchievements.filter((a) => a.rarity === rarity),
    })
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.gold}20` }]}>
              <Ionicons name="trophy" size={24} color={colors.gold} />
            </View>
            <Text style={styles.summaryValue}>{unlockedCount}</Text>
            <Text style={styles.summaryLabel}>Unlocked</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="ribbon" size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryValue}>{achievements.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.secondary}20` }]}>
              <Ionicons name="star" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.summaryValue}>{totalPoints}</Text>
            <Text style={styles.summaryLabel}>Points</Text>
          </View>
        </View>
        <ProgressBar
          progress={(unlockedCount / achievements.length) * 100}
          label={`${Math.round((unlockedCount / achievements.length) * 100)}% Complete`}
          color={colors.primary}
        />
      </Card>

      {/* Current Level Card */}
      <Card style={styles.levelCard}>
        <LinearGradient
          colors={[currentLevel.color, `${currentLevel.color}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelGradient}
        >
          <View style={styles.levelHeader}>
            <View style={styles.levelIconContainer}>
              <Ionicons name={currentLevel.icon as any} size={32} color={colors.white} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level {currentLevel.level}</Text>
              <Text style={styles.levelName}>{currentLevel.name}</Text>
            </View>
            <View style={styles.levelPoints}>
              <Text style={styles.levelPointsValue}>{totalPoints}</Text>
              <Text style={styles.levelPointsLabel}>pts</Text>
            </View>
          </View>
          {nextLevel && (
            <View style={styles.nextLevelProgress}>
              <View style={styles.nextLevelBar}>
                <View style={[styles.nextLevelFill, { width: `${progressToNextLevel}%` }]} />
              </View>
              <Text style={styles.nextLevelText}>
                {nextLevel.minPoints - totalPoints} pts to {nextLevel.name}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Card>

      {/* Points Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>Points Breakdown</Text>
        <Card padding="none">
          <TouchableOpacity
            style={styles.breakdownItem}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="ticket" size={20} color={colors.primary} />
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownLabel}>Events Attended</Text>
              <Text style={styles.breakdownDescription}>
                {pointsBreakdown.details.eventsAttended} events × {POINTS.ATTEND_EVENT} pts
              </Text>
            </View>
            <Text style={styles.breakdownValue}>+{pointsBreakdown.attendancePoints}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.breakdownItem}
            onPress={() => router.push({ pathname: '/(tabs)/stats', params: { filter: 'wins' } })}
          >
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="trophy" size={20} color={colors.success} />
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownLabel}>Team Wins</Text>
              <Text style={styles.breakdownDescription}>
                {pointsBreakdown.details.teamWins} wins × {POINTS.TEAM_WIN} pts
              </Text>
            </View>
            <Text style={styles.breakdownValue}>+{pointsBreakdown.winPoints}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.breakdownItem}
            onPress={() => router.push({ pathname: '/(tabs)/stats', params: { filter: 'wins' } })}
          >
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="flame" size={20} color={colors.warning} />
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownLabel}>Win Streaks</Text>
              <Text style={styles.breakdownDescription}>
                {pointsBreakdown.details.streaks.length} streak bonuses earned
              </Text>
            </View>
            <Text style={styles.breakdownValue}>+{pointsBreakdown.streakBonuses}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.breakdownItem}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="compass" size={20} color={colors.info} />
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownLabel}>Discovery Bonuses</Text>
              <Text style={styles.breakdownDescription}>
                {pointsBreakdown.details.newTeams} teams, {pointsBreakdown.details.newVenues} venues, {pointsBreakdown.details.newSports} sports
              </Text>
            </View>
            <Text style={styles.breakdownValue}>+{pointsBreakdown.discoveryBonuses}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.breakdownItem}
            onPress={() => {
              setShowUnlocked(true);
              setFilter('all');
            }}
          >
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.gold}15` }]}>
              <Ionicons name="medal" size={20} color={colors.gold} />
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownLabel}>Achievements</Text>
              <Text style={styles.breakdownDescription}>
                {unlockedCount} achievements unlocked
              </Text>
            </View>
            <Text style={styles.breakdownValue}>+{achievementPoints}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={[styles.breakdownItem, styles.breakdownTotal]}>
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="star" size={20} color={colors.primary} />
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={[styles.breakdownLabel, styles.breakdownTotalLabel]}>Total Points</Text>
            </View>
            <Text style={[styles.breakdownValue, styles.breakdownTotalValue]}>{totalPoints}</Text>
          </View>
        </Card>
      </View>

      {/* All Levels */}
      <View style={styles.allLevelsSection}>
        <Text style={styles.sectionTitle}>All Levels</Text>
        <Card padding="none">
          {LEVELS.map((level, index) => {
            const isUnlocked = totalPoints >= level.minPoints;
            const isCurrent = level.level === currentLevel.level;
            return (
              <View
                key={level.level}
                style={[
                  styles.levelRow,
                  index > 0 && styles.levelRowBorder,
                  isCurrent && styles.levelRowCurrent,
                ]}
              >
                <View style={[styles.levelRowIcon, { backgroundColor: isUnlocked ? `${level.color}20` : colors.surfaceLight }]}>
                  <Ionicons
                    name={level.icon as any}
                    size={20}
                    color={isUnlocked ? level.color : colors.textMuted}
                  />
                </View>
                <View style={styles.levelRowInfo}>
                  <Text style={[styles.levelRowName, !isUnlocked && styles.levelRowLocked]}>
                    {level.name}
                  </Text>
                  <Text style={styles.levelRowPoints}>
                    {level.minPoints} points required
                  </Text>
                </View>
                {isUnlocked ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                ) : (
                  <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                )}
              </View>
            );
          })}
        </Card>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterTabs}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.filterTab,
                  filter === cat.key && styles.filterTabActive,
                ]}
                onPress={() => setFilter(cat.key)}
              >
                {cat.key !== 'all' && (
                  <Ionicons
                    name={CATEGORY_ICONS[cat.key as keyof typeof CATEGORY_ICONS] as any}
                    size={16}
                    color={filter === cat.key ? colors.white : colors.textSecondary}
                  />
                )}
                <Text
                  style={[
                    styles.filterTabText,
                    filter === cat.key && styles.filterTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowUnlocked(!showUnlocked)}
        >
          <Ionicons
            name={showUnlocked ? 'checkbox' : 'square-outline'}
            size={20}
            color={colors.primary}
          />
          <Text style={styles.toggleText}>Show unlocked only</Text>
        </TouchableOpacity>
      </View>

      {/* Achievements List by Rarity */}
      {groupedByRarity.map(
        ({ rarity, achievements: rarityAchievements }) =>
          rarityAchievements.length > 0 && (
            <View key={rarity} style={styles.raritySection}>
              <View style={styles.rarityHeader}>
                <View
                  style={[
                    styles.rarityIndicator,
                    { backgroundColor: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] },
                  ]}
                />
                <Text style={styles.rarityTitle}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </Text>
                <Text style={styles.rarityCount}>
                  {rarityAchievements.filter((a) => a.unlocked).length}/
                  {rarityAchievements.length}
                </Text>
              </View>
              <View style={styles.achievementsList}>
                {rarityAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    progress={achievement.unlocked ? 100 : Math.random() * 80}
                  />
                ))}
              </View>
            </View>
          )
      )}

      {filteredAchievements.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No achievements found</Text>
          <Text style={styles.emptyText}>
            {showUnlocked
              ? "You haven't unlocked any achievements in this category yet"
              : 'Try a different filter to see more achievements'}
          </Text>
        </View>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  // Level styles
  levelCard: {
    marginBottom: spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  levelGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  levelLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  levelName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  levelPoints: {
    alignItems: 'center',
  },
  levelPointsValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  levelPointsLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  nextLevelProgress: {
    marginTop: spacing.lg,
  },
  nextLevelBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  nextLevelFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  breakdownSection: {
    marginBottom: spacing.xl,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  breakdownDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  breakdownValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  breakdownTotal: {
    backgroundColor: `${colors.gold}08`,
    borderBottomWidth: 0,
  },
  breakdownTotalLabel: {
    fontWeight: fontWeight.bold,
  },
  breakdownTotalValue: {
    fontSize: fontSize.lg,
    color: colors.gold,
  },
  allLevelsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  levelRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  levelRowCurrent: {
    backgroundColor: `${colors.primary}10`,
  },
  levelRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRowInfo: {
    flex: 1,
  },
  levelRowName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  levelRowLocked: {
    color: colors.textMuted,
  },
  levelRowPoints: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  filtersSection: {
    marginBottom: spacing.lg,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  toggleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  raritySection: {
    marginBottom: spacing.xl,
  },
  rarityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rarityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  rarityTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  rarityCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  achievementsList: {
    gap: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
