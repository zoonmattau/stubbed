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
        // @ts-expect-error - Supabase table type inference issue
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
      console.log('[Stats] fetchAchievements: Loading achievements for user:', userId);

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

      console.log('[Stats] fetchAchievements: Found', typedData.length, 'unlocked achievements');
      console.log('[Stats] fetchAchievements: Unlocked codes:', typedData.map(ua => ua.achievement?.code).filter(Boolean));

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

      const unlockedCount = allAchievements.filter(a => a.unlocked).length;
      console.log('[Stats] fetchAchievements: Setting state with', unlockedCount, 'unlocked out of', allAchievements.length);
      console.log('[Stats] fetchAchievements: team_loyal_2 unlocked?', allAchievements.find(a => a.code === 'team_loyal_2')?.unlocked);
      console.log('[Stats] fetchAchievements: home_ground_2 unlocked?', allAchievements.find(a => a.code === 'home_ground_2')?.unlocked);

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
      console.log('[Stats] ========================================');
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

        // Count venues - always use display name for consistency
        const venueName = (event.venue?.name || event.venue_name || '').toLowerCase();
        if (venueName) {
          uniqueVenues.add(venueName);
          venueCounts[venueName] = (venueCounts[venueName] || 0) + 1;
        }

        // Count home team - always use display name for consistency
        const homeTeamName = (event.home_team?.name || event.home_team_name || '').toLowerCase();
        if (homeTeamName) {
          uniqueTeams.add(homeTeamName);
          teamCounts[homeTeamName] = (teamCounts[homeTeamName] || 0) + 1;
        }

        // Count away team - always use display name for consistency
        const awayTeamName = (event.away_team?.name || event.away_team_name || '').toLowerCase();
        if (awayTeamName) {
          uniqueTeams.add(awayTeamName);
          teamCounts[awayTeamName] = (teamCounts[awayTeamName] || 0) + 1;
        }
      });

      const maxSameTeam = Object.values(teamCounts).length > 0
        ? Math.max(...Object.values(teamCounts))
        : 0;
      const maxSameVenue = Object.values(venueCounts).length > 0
        ? Math.max(...Object.values(venueCounts))
        : 0;

      console.log('[Stats] Achievement evaluation counts:', {
        totalEvents,
        uniqueTeams: uniqueTeams.size,
        uniqueVenues: uniqueVenues.size,
        uniqueSports: uniqueSports.size,
        maxSameTeam,
        maxSameVenue,
        teamsList: Array.from(uniqueTeams),
        venuesList: Array.from(uniqueVenues),
      });

      // Fetch user's current unlocked achievements
      type UnlockedAchievement = {
        id: string;
        user_id: string;
        achievement_id: string;
        unlocked_at: string;
        achievement: { id: string; code: string; name: string; points: number } | null;
      };
      const { data: unlockedData, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId) as { data: UnlockedAchievement[] | null; error: any };

      if (unlockedError) {
        console.error('[Stats] Error fetching unlocked achievements:', unlockedError);
        return;
      }

      const currentUnlocked = unlockedData || [];
      console.log('[Stats] Current unlocked user_achievements:', currentUnlocked.length, 'records');
      console.log('[Stats] Unlocked with valid achievement join:', currentUnlocked.filter(ua => ua.achievement).map(ua => ua.achievement?.code));
      console.log('[Stats] Orphaned (no achievement join):', currentUnlocked.filter(ua => !ua.achievement).length, 'records');

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

          // Debug log for loyalty achievements
          if (req.sameTeam !== undefined || req.sameVenue !== undefined) {
            console.log(`[Stats] Checking ${achievement.code}:`, {
              requirement: req,
              maxSameTeam,
              maxSameVenue,
              wouldQualify: (req.sameTeam === undefined || maxSameTeam >= (req.sameTeam as number)) &&
                           (req.sameVenue === undefined || maxSameVenue >= (req.sameVenue as number))
            });
          }

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

        // Check specific achievements
        if (achievement.requirementType === 'specific') {
          const req = achievement.requirementValue;
          let qualifies = false;

          for (const ae of attendedEvents) {
            const event = (ae as any).event;
            if (!event) continue;

            // Check competition name (Australian Open, Ashes, State of Origin, World Cup, Olympics)
            if (req.competition !== undefined) {
              const competition = (event.competition || '').toLowerCase();
              const targetComp = (req.competition as string).toLowerCase();
              if (competition.includes(targetComp) || targetComp.includes(competition)) {
                qualifies = true;
                break;
              }
            }

            // Check time of day (evening = after 6pm)
            if (req.timeOfDay === 'evening') {
              const eventTime = event.event_time;
              if (eventTime) {
                const hour = parseInt(eventTime.split(':')[0], 10);
                if (hour >= 18) {
                  qualifies = true;
                  break;
                }
              }
            }

            // Check round (Finals, Grand Final, Championship)
            if (req.round !== undefined) {
              const round = (event.round || '').toLowerCase();
              const targetRound = (req.round as string).toLowerCase();
              if (round.includes(targetRound) || round.includes('final') && targetRound.includes('final')) {
                qualifies = true;
                break;
              }
            }

            // Check specific events (boxing_day_test, super_bowl)
            if (req.event !== undefined) {
              const eventName = (event.event_name || event.competition || '').toLowerCase();
              const venueName = (event.venue?.name || event.venue_name || '').toLowerCase();
              const eventDate = event.event_date || '';
              const targetEvent = (req.event as string).toLowerCase();

              // Boxing Day Test: MCG venue + December 26
              if (targetEvent === 'boxing_day_test') {
                if (venueName.includes('mcg') || venueName.includes('melbourne cricket ground')) {
                  const date = new Date(eventDate);
                  if (date.getMonth() === 11 && date.getDate() === 26) { // December 26
                    qualifies = true;
                    break;
                  }
                }
              }

              // Super Bowl
              if (targetEvent === 'super_bowl' && eventName.includes('super bowl')) {
                qualifies = true;
                break;
              }
            }

            // Check match type (derby, international)
            if (req.matchType !== undefined) {
              const matchType = (req.matchType as string).toLowerCase();

              if (matchType === 'international') {
                // Check if competition suggests international (World Cup, Test, International)
                const competition = (event.competition || '').toLowerCase();
                if (competition.includes('international') ||
                    competition.includes('world cup') ||
                    competition.includes('test') ||
                    competition.includes('nations')) {
                  qualifies = true;
                  break;
                }
              }

              // Derby detection would need team rivalry data - skip for now
            }
          }

          if (qualifies) {
            achievementsToGrant.push(achievement.code);
          }
        }
      }

      // Grant new achievements
      if (achievementsToGrant.length > 0) {
        console.log('[Stats] Achievements to grant:', achievementsToGrant);

        // Get achievement IDs from the database (achievements are pre-populated via migration)
        const { data: achievementRecords, error: fetchError } = await supabase
          .from('achievements')
          .select('id, code')
          .in('code', achievementsToGrant);

        console.log('[Stats] Achievement records from DB:', achievementRecords);

        if (fetchError) {
          console.error('[Stats] Error fetching achievement records:', fetchError);
        } else if (achievementRecords && achievementRecords.length > 0) {
          console.log('[Stats] Achievement records found:', achievementRecords);

          // Insert user_achievements records
          const userAchievements = (achievementRecords as { id: string; code: string }[]).map(a => ({
            user_id: userId,
            achievement_id: a.id,
            unlocked_at: new Date().toISOString(),
          }));

          console.log('[Stats] Inserting user achievements:', userAchievements);

          // Use upsert to handle duplicates gracefully (in case of partial grants from previous runs)
          const achievementsTable = supabase.from('user_achievements');
          // @ts-ignore - Supabase table type inference issue
          const { data: insertData, error: insertError } = await achievementsTable.upsert(userAchievements, {
            onConflict: 'user_id,achievement_id',
            ignoreDuplicates: true
          }).select();

          if (insertError) {
            console.error('[Stats] Error granting achievements:', insertError);
          } else {
            console.log('[Stats] Successfully granted achievements:', insertData);
          }
        } else {
          console.warn('[Stats] No achievement records found for codes:', achievementsToGrant,
            '- Run migration 021_populate_achievements.sql to populate achievement definitions');
        }
      } else {
        console.log('[Stats] No new achievements to grant');
      }

      // Calculate total XP (mirrors usePoints logic)
      let activityPoints = totalEvents * 10; // ATTEND_EVENT = 10
      // Discovery bonuses: 5 per unique team, 5 per unique sport, 5 per unique venue
      activityPoints += uniqueTeams.size * 5;
      activityPoints += uniqueSports.size * 5;
      activityPoints += uniqueVenues.size * 5;
      // Win bonuses
      let winPoints = 0;
      attendedEvents.forEach((ae: any) => {
        if (ae.result === 'win' && ae.supported_team && ae.supported_team !== 'neutral') {
          winPoints += 5; // TEAM_WIN = 5
        }
      });
      activityPoints += winPoints;

      // Achievement points (from all unlocked achievements after grants/revokes)
      const { data: finalAchievements } = await supabase
        .from('user_achievements')
        .select('achievement:achievements(points)')
        .eq('user_id', userId);
      const achievementPoints = (finalAchievements || []).reduce(
        (sum: number, ua: any) => sum + (ua.achievement?.points || 0), 0
      );

      const totalPoints = activityPoints + achievementPoints;

      // Update user_stats
      const statsTable = supabase.from('user_stats');
      // @ts-ignore - Supabase table type inference issue
      const { error: statsError } = await statsTable.upsert({
        user_id: userId,
        total_events: totalEvents,
        total_sports: uniqueSports.size,
        total_teams: uniqueTeams.size,
        total_venues: uniqueVenues.size,
        total_points: totalPoints,
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
