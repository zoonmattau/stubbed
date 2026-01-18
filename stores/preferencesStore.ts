import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// All available sport categories
export const ALL_SPORT_CATEGORIES = [
  'American Football',
  'Basketball',
  'Baseball',
  'Ice Hockey',
  'Soccer',
  'Cricket',
  'Australian Football',
  'Rugby League',
  'Rugby Union',
  'Tennis',
  'Golf',
  'Motorsport',
  'Combat Sports',
  'Netball',
] as const;

export type SportCategory = (typeof ALL_SPORT_CATEGORIES)[number];

interface PreferencesState {
  // Enabled sports (all enabled by default)
  enabledSports: Record<SportCategory, boolean>;

  // Actions
  toggleSport: (sport: SportCategory) => void;
  setSportEnabled: (sport: SportCategory, enabled: boolean) => void;
  enableAllSports: () => void;
  disableAllSports: () => void;
  getEnabledSports: () => SportCategory[];
}

// Default: all sports enabled
const defaultEnabledSports: Record<SportCategory, boolean> = ALL_SPORT_CATEGORIES.reduce(
  (acc, sport) => {
    acc[sport] = true;
    return acc;
  },
  {} as Record<SportCategory, boolean>
);

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      enabledSports: { ...defaultEnabledSports },

      toggleSport: (sport) =>
        set((state) => ({
          enabledSports: {
            ...state.enabledSports,
            [sport]: !state.enabledSports[sport],
          },
        })),

      setSportEnabled: (sport, enabled) =>
        set((state) => ({
          enabledSports: {
            ...state.enabledSports,
            [sport]: enabled,
          },
        })),

      enableAllSports: () =>
        set({ enabledSports: { ...defaultEnabledSports } }),

      disableAllSports: () =>
        set({
          enabledSports: ALL_SPORT_CATEGORIES.reduce(
            (acc, sport) => {
              acc[sport] = false;
              return acc;
            },
            {} as Record<SportCategory, boolean>
          ),
        }),

      getEnabledSports: () => {
        const { enabledSports } = get();
        return ALL_SPORT_CATEGORIES.filter((sport) => enabledSports[sport]);
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
