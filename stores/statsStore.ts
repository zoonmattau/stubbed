import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { UserStats, UserAchievement, AchievementWithStatus } from '@/types';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { validateSingleResponse, validateRpcResponse, validateArrayResponse } from '@/lib/supabaseHelpers';

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
      // Fetch user stats - first check if record exists
      let statsResponse = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If stats record doesn't exist, create it
      if (statsResponse.error && statsResponse.error.code === 'PGRST116') {
        console.log('[Stats] Creating user_stats record for user:', userId);
        const { error: insertError } = await supabase.from('user_stats').insert({
          user_id: userId,
        });

        if (insertError && insertError.code !== '23505') {
          console.error('[Stats] Error creating user_stats:', insertError);
        }

        // Fetch again after creating
        statsResponse = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
      }

      const statsResult = validateSingleResponse<UserStats>(statsResponse, {
        allowEmpty: true,
        errorPrefix: 'Failed to load stats',
      });

      // Fetch sport breakdown with validation
      // @ts-expect-error - RPC type inference issues with Supabase
      const sportResponse = await supabase.rpc('get_sport_breakdown', {
        p_user_id: userId,
      });
      const sportResult = validateRpcResponse<any[]>(sportResponse, {
        defaultValue: [],
        errorPrefix: 'Failed to load sport breakdown',
      });

      // Fetch team breakdown with validation
      // @ts-expect-error - RPC type inference issues with Supabase
      const teamResponse = await supabase.rpc('get_team_breakdown', {
        p_user_id: userId,
      });
      const teamResult = validateRpcResponse<any[]>(teamResponse, {
        defaultValue: [],
        errorPrefix: 'Failed to load team breakdown',
      });

      // Fetch venue breakdown with validation
      // @ts-expect-error - RPC type inference issues with Supabase
      const venueResponse = await supabase.rpc('get_venue_breakdown', {
        p_user_id: userId,
      });
      const venueResult = validateRpcResponse<any[]>(venueResponse, {
        defaultValue: [],
        errorPrefix: 'Failed to load venue breakdown',
      });

      // Fetch monthly trend with validation
      // @ts-expect-error - RPC type inference issues with Supabase
      const trendResponse = await supabase.rpc('get_monthly_trend', {
        p_user_id: userId,
      });
      const trendResult = validateRpcResponse<any[]>(trendResponse, {
        defaultValue: [],
        errorPrefix: 'Failed to load monthly trend',
      });

      // Collect any errors
      const errors = [statsResult, sportResult, teamResult, venueResult, trendResult]
        .filter(r => !r.success && r.error)
        .map(r => r.error);

      set({
        stats: statsResult.data as UserStats | null,
        sportBreakdown: (sportResult.data as any) || [],
        teamBreakdown: (teamResult.data as any) || [],
        venueBreakdown: (venueResult.data as any) || [],
        monthlyTrend: (trendResult.data as any) || [],
        error: errors.length > 0 ? errors[0] : null,
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

      // Type assertion for Supabase join query result
      const typedData = (unlockedData || []) as any[];
      const unlockedIds = new Set(typedData.map((ua) => ua.achievement_id));

      // Map all achievements with unlock status
      const allAchievements: AchievementWithStatus[] = ACHIEVEMENTS.map((achievement) => {
        const unlocked = typedData.find(
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
