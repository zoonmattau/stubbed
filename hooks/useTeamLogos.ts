import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface TeamLogoCache {
  [teamName: string]: string | null;
}

// Global cache to avoid refetching
let globalTeamCache: TeamLogoCache = {};
let cacheLoaded = false;

export function useTeamLogos() {
  const [teamLogos, setTeamLogos] = useState<TeamLogoCache>(globalTeamCache);
  const [isLoading, setIsLoading] = useState(!cacheLoaded);

  // Load all teams on first use
  useEffect(() => {
    if (cacheLoaded) return;

    const loadTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('name, logo_url');

        if (error) throw error;

        const cache: TeamLogoCache = {};
        (data || []).forEach((team: { name: string; logo_url: string | null }) => {
          // Store by lowercase name for case-insensitive lookup
          cache[team.name.toLowerCase()] = team.logo_url;
        });

        globalTeamCache = cache;
        cacheLoaded = true;
        setTeamLogos(cache);
      } catch (err) {
        console.error('Error loading team logos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeams();
  }, []);

  // Lookup function that checks both exact and normalized names
  const getTeamLogo = useCallback(
    (teamName: string | null | undefined): string | null => {
      if (!teamName) return null;

      const normalized = teamName.toLowerCase().trim();
      return teamLogos[normalized] || null;
    },
    [teamLogos]
  );

  return {
    getTeamLogo,
    isLoading,
  };
}
