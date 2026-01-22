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
  recalculateAchievements: (userId: string) => Promise<void>;
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

  recalculateAchievements: async (userId) => {
    try {
      console.log('[Stats] Recalculating achievements for user:', userId);

      // Fetch current user stats from the database
      const { data: events, error: eventsError } = await supabase
        .from('attended_events')
        .select(`
          *,
          event:events(
            *,
            sport:sports(*),
            home_team:teams!events_home_team_id_fkey(*),
            away_team:teams!events_away_team_id_fkey(*),
            venue:venues(*)
          )
        `)
        .eq('user_id', userId);

      if (eventsError) {
        console.error('[Stats] Error fetching events:', eventsError);
        return;
      }

      const attendedEvents = events || [];
      const totalEvents = attendedEvents.length;

      // Calculate unique counts
      const uniqueSports = new Set<string>();
      const uniqueVenues = new Set<string>();
      const uniqueTeams = new Set<string>();
      const teamCounts: Record<string, number> = {};
      const venueCounts: Record<string, number> = {};

      attendedEvents.forEach((ae: any) => {
        const event = ae.event;
        if (!event) return;

        // Count sports - use sport_id or sport_name
        if (event.sport_id) {
          uniqueSports.add(event.sport_id);
        } else if (event.sport_name) {
          uniqueSports.add(`name:${event.sport_name.toLowerCase()}`);
        }

        // Count venues - use venue_id or venue_name
        const venueKey = event.venue_id || (event.venue_name ? `name:${event.venue_name.toLowerCase()}` : null);
        if (venueKey) {
          uniqueVenues.add(venueKey);
          venueCounts[venueKey] = (venueCounts[venueKey] || 0) + 1;
        }

        // Count home team - use home_team_id or home_team_name
        const homeTeamKey = event.home_team_id || (event.home_team_name ? `name:${event.home_team_name.toLowerCase()}` : null);
        if (homeTeamKey) {
          uniqueTeams.add(homeTeamKey);
          teamCounts[homeTeamKey] = (teamCounts[homeTeamKey] || 0) + 1;
        }

        // Count away team - use away_team_id or away_team_name
        const awayTeamKey = event.away_team_id || (event.away_team_name ? `name:${event.away_team_name.toLowerCase()}` : null);
        if (awayTeamKey) {
          uniqueTeams.add(awayTeamKey);
          teamCounts[awayTeamKey] = (teamCounts[awayTeamKey] || 0) + 1;
        }
      });

      const maxSameTeam = Object.values(teamCounts).length > 0
        ? Math.max(...Object.values(teamCounts))
        : 0;
      const maxSameVenue = Object.values(venueCounts).length > 0
        ? Math.max(...Object.values(venueCounts))
        : 0;

      // Fetch user's current unlocked achievements
      const { data: unlockedData, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId);

      if (unlockedError) {
        console.error('[Stats] Error fetching unlocked achievements:', unlockedError);
        return;
      }

      const currentUnlocked = unlockedData || [];
      const achievementsToRevoke: string[] = [];

      // Define supported requirement keys
      const supportedRequirements = ['count', 'sports', 'venues', 'teams', 'sameTeam', 'sameVenue'];

      // Check each unlocked achievement to see if user still qualifies
      for (const ua of currentUnlocked) {
        const achievement = ua.achievement;
        if (!achievement) continue;

        const achievementDef = ACHIEVEMENTS.find(a => a.code === achievement.code);
        if (!achievementDef) continue;

        let stillQualifies = true;

        if (achievementDef.requirementType === 'count') {
          const req = achievementDef.requirementValue;
          const reqKeys = Object.keys(req);

          // Revoke achievements with unsupported requirements (they were granted incorrectly)
          const hasUnsupportedReq = reqKeys.some(key => !supportedRequirements.includes(key));
          if (hasUnsupportedReq) {
            stillQualifies = false;
          } else {
            // Check count-based requirements
            if (req.count !== undefined && totalEvents < (req.count as number)) {
              stillQualifies = false;
            }
            if (req.sports !== undefined && uniqueSports.size < (req.sports as number)) {
              stillQualifies = false;
            }
            if (req.venues !== undefined && uniqueVenues.size < (req.venues as number)) {
              stillQualifies = false;
            }
            if (req.teams !== undefined && uniqueTeams.size < (req.teams as number)) {
              stillQualifies = false;
            }
            if (req.sameTeam !== undefined && maxSameTeam < (req.sameTeam as number)) {
              stillQualifies = false;
            }
            if (req.sameVenue !== undefined && maxSameVenue < (req.sameVenue as number)) {
              stillQualifies = false;
            }
          }
        }

        if (!stillQualifies) {
          console.log('[Stats] User no longer qualifies for achievement:', achievement.code);
          achievementsToRevoke.push(ua.id);
        }
      }

      // Revoke achievements that no longer qualify
      if (achievementsToRevoke.length > 0) {
        console.log('[Stats] Revoking achievements:', achievementsToRevoke);
        const { error: deleteError } = await supabase
          .from('user_achievements')
          .delete()
          .in('id', achievementsToRevoke);

        if (deleteError) {
          console.error('[Stats] Error revoking achievements:', deleteError);
        }
      }

      // Grant new achievements the user now qualifies for
      const unlockedCodes = new Set(currentUnlocked.map(ua => ua.achievement?.code).filter(Boolean));
      const achievementsToGrant: string[] = [];

      for (const achievement of ACHIEVEMENTS) {
        // Skip if already unlocked
        if (unlockedCodes.has(achievement.code)) continue;

        // Only check count-based achievements with supported requirements
        if (achievement.requirementType === 'count') {
          const req = achievement.requirementValue;
          const reqKeys = Object.keys(req);

          // Skip achievements with unsupported requirements (e.g., finalsGames, grandFinals)
          const hasUnsupportedReq = reqKeys.some(key => !supportedRequirements.includes(key));
          if (hasUnsupportedReq) continue;

          let qualifies = true;

          // Check count-based requirements
          if (req.count !== undefined && totalEvents < (req.count as number)) {
            qualifies = false;
          }
          if (req.sports !== undefined && uniqueSports.size < (req.sports as number)) {
            qualifies = false;
          }
          if (req.venues !== undefined && uniqueVenues.size < (req.venues as number)) {
            qualifies = false;
          }
          if (req.teams !== undefined && uniqueTeams.size < (req.teams as number)) {
            qualifies = false;
          }
          if (req.sameTeam !== undefined && maxSameTeam < (req.sameTeam as number)) {
            qualifies = false;
          }
          if (req.sameVenue !== undefined && maxSameVenue < (req.sameVenue as number)) {
            qualifies = false;
          }

          if (qualifies) {
            achievementsToGrant.push(achievement.code);
          }
        }
        // Note: 'specific' and 'streak' types require more complex checking - skip for now
      }

      // Grant new achievements
      if (achievementsToGrant.length > 0) {
        console.log('[Stats] Granting new achievements:', achievementsToGrant);

        // First, ensure all achievements exist in the database (upsert from constants)
        const achievementDefs = achievementsToGrant.map(code => {
          const def = ACHIEVEMENTS.find(a => a.code === code)!;
          return {
            code: def.code,
            name: def.name,
            description: def.description,
            icon: def.icon,
            category: def.category,
            requirement_type: def.requirementType,
            requirement_value: def.requirementValue,
            points: def.points,
            rarity: def.rarity,
          };
        });

        // Upsert achievements to ensure they exist
        const { error: upsertError } = await supabase
          .from('achievements')
          .upsert(achievementDefs, { onConflict: 'code' });

        if (upsertError) {
          console.error('[Stats] Error upserting achievements:', upsertError);
        }

        // Now get achievement IDs from the database
        const { data: achievementRecords, error: fetchError } = await supabase
          .from('achievements')
          .select('id, code')
          .in('code', achievementsToGrant);

        if (fetchError) {
          console.error('[Stats] Error fetching achievement records:', fetchError);
        } else if (achievementRecords && achievementRecords.length > 0) {
          // Insert user_achievements records
          const userAchievements = achievementRecords.map(a => ({
            user_id: userId,
            achievement_id: a.id,
            unlocked_at: new Date().toISOString(),
          }));

          const { error: insertError } = await supabase
            .from('user_achievements')
            .insert(userAchievements);

          if (insertError) {
            console.error('[Stats] Error granting achievements:', insertError);
          } else {
            console.log('[Stats] Successfully granted', achievementRecords.length, 'achievements');
          }
        }
      }

      // Update user_stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_events: totalEvents,
          total_sports: uniqueSports.size,
          total_teams: uniqueTeams.size,
          total_venues: uniqueVenues.size,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (statsError) {
        console.error('[Stats] Error updating stats:', statsError);
      }

      // Refresh achievements in the UI
      await get().fetchAchievements(userId);
      await get().fetchStats(userId);

      console.log('[Stats] Achievement recalculation complete');
    } catch (error) {
      console.error('[Stats] Error recalculating achievements:', error);
    }
  },
}));
