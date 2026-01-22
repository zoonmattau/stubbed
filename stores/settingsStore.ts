import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface UserSettings {
  user_id: string;
  // Push Notifications
  push_enabled: boolean;
  // Notification Types
  notify_friend_requests: boolean;
  notify_achievements: boolean;
  notify_event_reminders: boolean;
  // Email
  email_enabled: boolean;
  email_weekly_digest: boolean;
  // Privacy
  profile_public: boolean;
  show_stats: boolean;
  show_events: boolean;
  allow_tagging: boolean;
  show_on_leaderboards: boolean;
  // Reviews & Explore
  reviews_public: boolean;
  allow_comments: boolean;
  show_watched_reviews: boolean;
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  push_enabled: true,
  notify_friend_requests: true,
  notify_achievements: true,
  notify_event_reminders: true,
  email_enabled: true,
  email_weekly_digest: false,
  profile_public: true,
  show_stats: true,
  show_events: true,
  allow_tagging: true,
  show_on_leaderboards: true,
  reviews_public: true,
  allow_comments: true,
  show_watched_reviews: true,
};

interface SettingsStore {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: (userId: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        set({
          settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
          isLoading: false
        });
        return;
      }

      // If no settings exist, create default settings
      if (!data) {
        try {
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: userId, ...DEFAULT_SETTINGS })
            .select()
            .single();

          if (insertError) {
            set({
              settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
              isLoading: false
            });
            return;
          }

          set({ settings: newData, isLoading: false });
          return;
        } catch {
          set({
            settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
            isLoading: false
          });
          return;
        }
      }

      set({ settings: data, isLoading: false });
    } catch (error: any) {
      set({
        settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
        error: error.message,
        isLoading: false
      });
    }
  },

  updateSettings: async (updates: Partial<UserSettings>) => {
    const { settings } = get();
    if (!settings) return;

    // Optimistic update
    set({ settings: { ...settings, ...updates } });

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', settings.user_id);

      if (error) {
        // Revert on error
        set({ settings });
        throw error;
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  resetSettings: () => {
    set({ settings: null, isLoading: false, error: null });
  },
}));
