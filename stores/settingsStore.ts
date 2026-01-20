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
    console.log('[SettingsStore] fetchSettings called with userId:', userId);
    set({ isLoading: true, error: null });

    try {
      console.log('[SettingsStore] Fetching from Supabase...');
      // Use maybeSingle() to avoid 406 error when no row exists
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[SettingsStore] Supabase response:', { data, error });

      if (error) {
        // For any error, use defaults locally
        console.error('Error fetching settings:', error);
        set({
          settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
          isLoading: false
        });
        return;
      }

      // If no settings exist, create default settings
      if (!data) {
        console.log('[SettingsStore] No settings found, creating defaults...');
        try {
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: userId, ...DEFAULT_SETTINGS })
            .select()
            .single();

          if (insertError) {
            // If insert fails, use defaults locally
            console.error('Error creating settings:', insertError);
            set({
              settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
              isLoading: false
            });
            return;
          }

          set({ settings: newData, isLoading: false });
          return;
        } catch (insertErr) {
          // Fallback to local defaults
          set({
            settings: { user_id: userId, ...DEFAULT_SETTINGS } as UserSettings,
            isLoading: false
          });
          return;
        }
      }

      set({ settings: data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      // Fallback to local defaults so UI doesn't get stuck
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
      console.error('Error updating settings:', error);
      set({ error: error.message });
    }
  },

  resetSettings: () => {
    set({ settings: null, isLoading: false, error: null });
  },
}));
