import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { useEventsStore } from '@/stores/eventsStore';
import type { AchievementWithStatus } from '@/types';

export interface AchievementProgress {
  achievement: AchievementWithStatus;
  current: number;
  target: number;
  percent: number;
  remaining: number;
  description: string;
}

export function useAchievements() {
  const { user } = useAuthStore();
  const { achievements, fetchAchievements, stats: userStats, teamBreakdown, venueBreakdown, sportBreakdown } = useStatsStore();
  const { attendedEvents } = useEventsStore();

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

  const achievementStats = useMemo(() => {
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

  // Calculate progress for locked achievements and find closest one
  const closestAchievement = useMemo((): AchievementProgress | null => {
    const lockedAchievements = achievements.filter((a) => !a.unlocked);
    if (lockedAchievements.length === 0) return null;

    const totalEvents = userStats?.total_events || attendedEvents.length;
    const totalSports = userStats?.total_sports || sportBreakdown.length;
    const totalVenues = userStats?.total_venues || venueBreakdown.length;
    const totalTeams = userStats?.total_teams || teamBreakdown.length;
    const currentStreak = userStats?.current_streak || 0;

    // Calculate max same team/venue counts
    const maxSameTeam = teamBreakdown.length > 0
      ? Math.max(...teamBreakdown.map(t => t.count))
      : 0;
    const maxSameVenue = venueBreakdown.length > 0
      ? Math.max(...venueBreakdown.map(v => v.count))
      : 0;

    const progressList: AchievementProgress[] = [];

    for (const achievement of lockedAchievements) {
      const reqValue = achievement.requirement_value as Record<string, number>;
      let current = 0;
      let target = 0;
      let description = '';

      // Only calculate progress for count-based achievements
      if (achievement.requirement_type === 'count') {
        if (reqValue.count !== undefined) {
          // Total events count
          current = totalEvents;
          target = reqValue.count;
          description = `${current} of ${target} events`;
        } else if (reqValue.sports !== undefined) {
          // Different sports
          current = totalSports;
          target = reqValue.sports;
          description = `${current} of ${target} sports`;
        } else if (reqValue.venues !== undefined) {
          // Different venues
          current = totalVenues;
          target = reqValue.venues;
          description = `${current} of ${target} venues`;
        } else if (reqValue.teams !== undefined) {
          // Different teams watched
          current = totalTeams;
          target = reqValue.teams;
          description = `${current} of ${target} teams`;
        } else if (reqValue.sameTeam !== undefined) {
          // Same team loyalty
          current = maxSameTeam;
          target = reqValue.sameTeam;
          description = `${current} of ${target} games for one team`;
        } else if (reqValue.sameVenue !== undefined) {
          // Same venue loyalty
          current = maxSameVenue;
          target = reqValue.sameVenue;
          description = `${current} of ${target} visits to one venue`;
        }
      } else if (achievement.requirement_type === 'streak') {
        if (reqValue.weeks !== undefined) {
          current = currentStreak;
          target = reqValue.weeks;
          description = `${current} of ${target} week streak`;
        } else if (reqValue.months !== undefined) {
          // Monthly streaks - harder to track, skip for now
          continue;
        }
      } else {
        // Skip 'specific' achievements as they're event-based
        continue;
      }

      if (target > 0 && current < target) {
        const percent = Math.min((current / target) * 100, 99);
        progressList.push({
          achievement,
          current,
          target,
          percent,
          remaining: target - current,
          description,
        });
      }
    }

    if (progressList.length === 0) return null;

    // Sort by percent complete (highest first), then by remaining (lowest first)
    progressList.sort((a, b) => {
      // Prioritize achievements that are almost complete
      if (b.percent !== a.percent) {
        return b.percent - a.percent;
      }
      // If same percent, prefer ones with fewer remaining
      return a.remaining - b.remaining;
    });

    return progressList[0];
  }, [achievements, userStats, attendedEvents, teamBreakdown, venueBreakdown, sportBreakdown]);

  return {
    achievements,
    categorizedAchievements,
    rarityGroups,
    stats: achievementStats,
    recentUnlocks,
    closestAchievement,
  };
}
