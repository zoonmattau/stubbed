import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AchievementCard } from '@/components/achievements';
import { ProgressBar } from '@/components/stats';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { CATEGORY_ICONS, RARITY_COLORS } from '@/constants/achievements';
import type { AchievementWithStatus } from '@/types';

type CategoryFilter = 'all' | 'attendance' | 'diversity' | 'loyalty' | 'special';

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const { achievements, fetchAchievements } = useStatsStore();

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
    marginBottom: spacing.xl,
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
