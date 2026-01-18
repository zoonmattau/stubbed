import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import type { AchievementWithStatus } from '@/types';

export function useAchievements() {
  const { user } = useAuthStore();
  const { achievements, fetchAchievements } = useStatsStore();

  useEffect(() => {
    if (user?.id) {
      fetchAchievements(user.id);
    }
  }, [user?.id]);

  const categorizedAchievements = useMemo(() => {
    const categories = {
      attendance: [] as AchievementWithStatus[],
      diversity: [] as AchievementWithStatus[],
      loyalty: [] as AchievementWithStatus[],
      special: [] as AchievementWithStatus[],
    };

    achievements.forEach((achievement) => {
      if (categories[achievement.category as keyof typeof categories]) {
        categories[achievement.category as keyof typeof categories].push(achievement);
      }
    });

    return categories;
  }, [achievements]);

  const rarityGroups = useMemo(() => {
    return {
      legendary: achievements.filter((a) => a.rarity === 'legendary'),
      epic: achievements.filter((a) => a.rarity === 'epic'),
      rare: achievements.filter((a) => a.rarity === 'rare'),
      uncommon: achievements.filter((a) => a.rarity === 'uncommon'),
      common: achievements.filter((a) => a.rarity === 'common'),
    };
  }, [achievements]);

  const stats = useMemo(() => {
    const unlocked = achievements.filter((a) => a.unlocked);
    const total = achievements.length;
    const points = unlocked.reduce((sum, a) => sum + a.points, 0);
    const progress = total > 0 ? (unlocked.length / total) * 100 : 0;

    return {
      unlocked: unlocked.length,
      total,
      points,
      progress,
    };
  }, [achievements]);

  const recentUnlocks = useMemo(() => {
    return achievements
      .filter((a) => a.unlocked && a.unlocked_at)
      .sort((a, b) => {
        const dateA = new Date(a.unlocked_at!).getTime();
        const dateB = new Date(b.unlocked_at!).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [achievements]);

  return {
    achievements,
    categorizedAchievements,
    rarityGroups,
    stats,
    recentUnlocks,
  };
}
