import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SportsDBPlayerResult, SportsDBTeamResult } from '@/lib/thesportsdb';

interface FavoritePlayer {
  id: string;
  name: string;
  team: string;
  teamId: string;
  sport: string;
  position: string;
  thumbnail?: string;
  addedAt: number;
}

interface FavoriteTeam {
  id: string;
  name: string;
  sport: string;
  league: string;
  badge?: string;
  addedAt: number;
}

interface FavoritesState {
  players: FavoritePlayer[];
  teams: FavoriteTeam[];

  // Player actions
  addPlayer: (player: SportsDBPlayerResult) => void;
  removePlayer: (playerId: string) => void;
  isPlayerFavorite: (playerId: string) => boolean;

  // Team actions
  addTeam: (team: SportsDBTeamResult) => void;
  removeTeam: (teamId: string) => void;
  isTeamFavorite: (teamId: string) => boolean;

  // Utility
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      players: [],
      teams: [],

      addPlayer: (player) => {
        const existing = get().players.find((p) => p.id === player.id);
        if (existing) return;

        const favorite: FavoritePlayer = {
          id: player.id,
          name: player.name,
          team: player.team,
          teamId: player.teamId,
          sport: player.sport,
          position: player.position,
          thumbnail: player.thumbnail,
          addedAt: Date.now(),
        };

        set((state) => ({
          players: [favorite, ...state.players],
        }));
      },

      removePlayer: (playerId) => {
        set((state) => ({
          players: state.players.filter((p) => p.id !== playerId),
        }));
      },

      isPlayerFavorite: (playerId) => {
        return get().players.some((p) => p.id === playerId);
      },

      addTeam: (team) => {
        const existing = get().teams.find((t) => t.id === team.id);
        if (existing) return;

        const favorite: FavoriteTeam = {
          id: team.id,
          name: team.name,
          sport: team.sport,
          league: team.league,
          badge: team.badge,
          addedAt: Date.now(),
        };

        set((state) => ({
          teams: [favorite, ...state.teams],
        }));
      },

      removeTeam: (teamId) => {
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== teamId),
        }));
      },

      isTeamFavorite: (teamId) => {
        return get().teams.some((t) => t.id === teamId);
      },

      clearAll: () => {
        set({ players: [], teams: [] });
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
