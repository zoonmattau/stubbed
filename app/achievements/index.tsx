import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementCard } from '@/components/achievements';
import { ProgressBar } from '@/components/stats';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { CATEGORY_ICONS, RARITY_COLORS } from '@/constants/achievements';
import type { AchievementWithStatus } from '@/types';

// Level definitions
const LEVELS = [
  { level: 1, name: 'Rookie', minPoints: 0, icon: 'ticket-outline', color: '#6B7280' },
  { level: 2, name: 'Fan', minPoints: 50, icon: 'star-outline', color: '#10B981' },
  { level: 3, name: 'Supporter', minPoints: 150, icon: 'star-half', color: '#3B82F6' },
  { level: 4, name: 'Superfan', minPoints: 300, icon: 'star', color: '#8B5CF6' },
  { level: 5, name: 'Legend', minPoints: 500, icon: 'medal-outline', color: '#F59E0B' },
  { level: 6, name: 'Hall of Famer', minPoints: 800, icon: 'trophy', color: '#EF4444' },
  { level: 7, name: 'Icon', minPoints: 1200, icon: 'diamond', color: '#EC4899' },
];

type CategoryFilter = 'all' | 'attendance' | 'diversity' | 'loyalty' | 'special';

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const { achievements, fetchAchievements, stats } = useStatsStore();
  const { attendedEvents } = useEventsStore();

  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showUnlocked, setShowUnlocked] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAchievements(user.id);
    }
  }, [user?.id]);

  const filteredAchievements = achievements.filter((a) => {
    const categoryMatch = filter === 'all' || a.category === filter;
    const unlockedMatch = showUnlocked ? a.unlocked : true;
    return categoryMatch && unlockedMatch;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  // Calculate current level
  const currentLevel = useMemo(() => {
    let level = LEVELS[0];
    for (const l of LEVELS) {
      if (totalPoints >= l.minPoints) {
        level = l;
      }
    }
    return level;
  }, [totalPoints]);

  const nextLevel = useMemo(() => {
    const idx = LEVELS.findIndex(l => l.level === currentLevel.level);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }, [currentLevel]);

  const progressToNextLevel = useMemo(() => {
    if (!nextLevel) return 100;
    const pointsInLevel = totalPoints - currentLevel.minPoints;
    const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints;
    return (pointsInLevel / pointsNeeded) * 100;
  }, [totalPoints, currentLevel, nextLevel]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
