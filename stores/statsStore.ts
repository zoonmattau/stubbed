import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { UserStats, UserAchievement, AchievementWithStatus } from '@/types';
import { ACHIEVEMENTS } from '@/constants/achievements';

interface StatsState {
  stats: UserStats | null;
  achievements: AchievementWithStatus[];
  unlockedAchievements: UserAchievement[];
  isLoading: boolean;
  error: string | null;

  // Computed stats
  sportBreakdown: { sportId: string; sportName: string; count: number; color: string }[];
  teamBreakdown: { teamId: string; teamName: string; count: number }[];
  venueBreakdown: { venueId: string; venueName: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];

  // Actions
  fetchStats: (userId: string) => Promise<void>;
  fetchAchievements: (userId: string) => Promise<void>;
  refreshStats: (userId: string) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  achievements: [],
  unlockedAchievements: [],
  isLoading: false,
  error: null,
  sportBreakdown: [],
  teamBreakdown: [],
  venueBreakdown: [],
  monthlyTrend: [],

  fetchStats: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      // Fetch sport breakdown
      const { data: sportData } = await supabase.rpc('get_sport_breakdown', {
        p_user_id: userId,
      });

      // Fetch team breakdown
      const { data: teamData } = await supabase.rpc('get_team_breakdown', {
        p_user_id: userId,
      });

      // Fetch venue breakdown
      const { data: venueData } = await supabase.rpc('get_venue_breakdown', {
        p_user_id: userId,
      });

      // Fetch monthly trend
      const { data: trendData } = await supabase.rpc('get_monthly_trend', {
        p_user_id: userId,
      });

      set({
        stats: statsData as UserStats | null,
        sportBreakdown: sportData || [],
        teamBreakdown: teamData || [],
        venueBreakdown: venueData || [],
        monthlyTrend: trendData || [],
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAchievements: async (userId) => {
    try {
      // Fetch user's unlocked achievements
      const { data: unlockedData, error } = await supabase
        .from('user_achievements')
        .select(
          `
          *,
          achievement:achievements(*)
        `
        )
        .eq('user_id', userId);

      if (error) throw error;

      const unlockedIds = new Set((unlockedData || []).map((ua) => ua.achievement_id));

      // Map all achievements with unlock status
      const allAchievements: AchievementWithStatus[] = ACHIEVEMENTS.map((achievement) => {
        const unlocked = unlockedData?.find(
          (ua) => ua.achievement?.code === achievement.code
        );
        return {
          id: unlocked?.achievement_id || achievement.code,
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          requirement_type: achievement.requirementType,
          requirement_value: achievement.requirementValue,
          points: achievement.points,
          rarity: achievement.rarity,
          created_at: new Date().toISOString(),
          unlocked: !!unlocked,
          unlocked_at: unlocked?.unlocked_at,
        };
      });

      set({
        achievements: allAchievements,
        unlockedAchievements: (unlockedData as UserAchievement[]) || [],
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  },

  refreshStats: async (userId) => {
    await Promise.all([get().fetchStats(userId), get().fetchAchievements(userId)]);
  },
}));
