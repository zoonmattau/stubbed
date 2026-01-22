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

  // Lookup function that checks exact, normalized, and partial matches
  const getTeamLogo = useCallback(
    (teamName: string | null | undefined): string | null => {
      if (!teamName) return null;

      const normalized = teamName.toLowerCase().trim();

      // Try exact match first
      if (teamLogos[normalized]) {
        return teamLogos[normalized];
      }

      // Try removing common suffixes
      const withoutSuffixes = normalized
        .replace(/\s*(fc|football club|rugby|cricket|basketball|united|city)$/i, '')
        .trim();
      if (withoutSuffixes !== normalized && teamLogos[withoutSuffixes]) {
        return teamLogos[withoutSuffixes];
      }

      // Try partial match (team name contains or is contained by database name)
      for (const [dbName, logo] of Object.entries(teamLogos)) {
        if (!logo) continue;

        // Check if the search term contains the db name or vice versa
        if (normalized.includes(dbName) || dbName.includes(normalized)) {
          return logo;
        }

        // Check if first word matches (e.g., "Brisbane" matches "Brisbane Lions")
        const normalizedFirst = normalized.split(' ')[0];
        const dbFirst = dbName.split(' ')[0];
        if (normalizedFirst === dbFirst && normalizedFirst.length > 3) {
          return logo;
        }
      }

      return null;
    },
    [teamLogos]
  );

  return {
    getTeamLogo,
    isLoading,
  };
}
