import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';

export function useStats() {
  const { user } = useAuthStore();
  const {
    stats,
    achievements,
    sportBreakdown,
    teamBreakdown,
    venueBreakdown,
    monthlyTrend,
    isLoading,
    error,
    fetchStats,
    fetchAchievements,
    refreshStats,
  } = useStatsStore();

  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
      fetchAchievements(user.id);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (user?.id) {
      await refreshStats(user.id);
    }
  }, [user?.id]);

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  // Calculate level based on points
  const level = Math.floor(totalPoints / 100) + 1;
  const pointsInLevel = totalPoints % 100;
  const pointsToNextLevel = 100 - pointsInLevel;

  return {
    stats,
    achievements,
    unlockedAchievements,
    lockedAchievements,
    totalPoints,
    level,
    pointsInLevel,
    pointsToNextLevel,
    sportBreakdown,
    teamBreakdown,
    venueBreakdown,
    monthlyTrend,
    isLoading,
    error,
    refresh,
  };
}
