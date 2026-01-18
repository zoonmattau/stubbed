import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    console.log('[Auth] Initializing...');
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Error getting session:', error);
      }

      console.log('[Auth] Session:', session ? 'exists' : 'none');
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        console.log('[Auth] Fetching profile for user:', session.user.id);
        await get().fetchProfile();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State change:', event);
        set({ session, user: session?.user ?? null });

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          try {
            // Check if profile exists, create if not (handles email confirmation flow)
            const { data: existingProfile, error: profileCheckError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (profileCheckError && profileCheckError.code !== 'PGRST116') {
              console.error('[Auth] Error checking profile:', profileCheckError);
            }

            if (!existingProfile) {
              console.log('[Auth] Creating profile for new user');
              // Create profile from user metadata
              const metadata = session.user.user_metadata;
              const { error: insertError } = await supabase.from('profiles').insert({
                id: session.user.id,
                username: metadata?.username || session.user.email?.split('@')[0],
                display_name: metadata?.username,
                email: session.user.email,
              });
              if (insertError) {
                console.error('[Auth] Error creating profile:', insertError);
              }

              const { error: statsError } = await supabase.from('user_stats').insert({
                user_id: session.user.id,
              });
              if (statsError) {
                console.error('[Auth] Error creating user_stats:', statsError);
              }
            }

            await get().fetchProfile();
          } catch (err) {
            console.error('[Auth] Error in auth state change handler:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          set({ profile: null });
        }
      });
    } catch (err) {
      console.error('[Auth] Initialize failed:', err);
    } finally {
      console.log('[Auth] Initialization complete');
      set({ isLoading: false, isInitialized: true });
    }
  },

  setSession: (session) => set({ session, user: session?.user ?? null }),

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        set({ profile: data as Profile });
      } else if (error) {
        console.error('Error fetching profile:', error);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },
}));
