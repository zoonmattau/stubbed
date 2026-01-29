import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { getPendingProfile, clearPendingProfile } from '@/lib/pendingProfile';
import type { User, Session, Subscription } from '@supabase/supabase-js';
import type { Profile } from '@/types';

// Store the auth subscription outside the store to prevent re-subscribing
let authSubscription: Subscription | null = null;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  cleanup: () => void;
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
    // Prevent multiple subscriptions
    if (authSubscription) {
      return;
    }

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Error getting session:', error);
      }

      set({ session, user: session?.user ?? null });

      if (session?.user) {
        await get().fetchProfile();
      }

      // Listen for auth changes and store the subscription
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
              // Check for pending profile data from registration
              const pendingProfile = await getPendingProfile();
              const metadata = session.user.user_metadata;

              // Build display name from pending profile or fallback to metadata
              let displayName = metadata?.username || session.user.email?.split('@')[0];
              let firstName: string | undefined;
              let lastName: string | undefined;
              let dateOfBirth: string | undefined;
              const username = pendingProfile?.username || metadata?.username || session.user.email?.split('@')[0];

              if (pendingProfile) {
                firstName = pendingProfile.firstName;
                lastName = pendingProfile.lastName;

                if (firstName && lastName) {
                  displayName = `${firstName} ${lastName}`;
                }

                // Convert DD-MM-YYYY to YYYY-MM-DD for PostgreSQL
                if (pendingProfile.dateOfBirth) {
                  const [day, month, year] = pendingProfile.dateOfBirth.split('-');
                  dateOfBirth = `${year}-${month}-${day}`;
                }
              }

              const profilesTable = supabase.from('profiles');
              // @ts-ignore - Supabase table type inference issue
              const { error: insertError } = await profilesTable.insert({
                id: session.user.id,
                username,
                display_name: displayName,
                email: session.user.email,
                first_name: firstName,
                last_name: lastName,
                date_of_birth: dateOfBirth,
              });
              if (insertError) {
                console.error('[Auth] Error creating profile:', insertError);
              }

              // Clear pending profile after successful creation
              if (!insertError) {
                await clearPendingProfile();
              }
            }

            // Always ensure user_stats exists (separate from profile creation)
            const { data: existingStats } = await supabase
              .from('user_stats')
              .select('user_id')
              .eq('user_id', session.user.id)
              .single();

            if (!existingStats) {
              const statsTable = supabase.from('user_stats');
              // @ts-ignore - Supabase table type inference issue
              const { error: statsError } = await statsTable.insert({
                user_id: session.user.id,
              });
              if (statsError && statsError.code !== '23505') { // Ignore duplicate key error
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

      // Store the subscription for cleanup
      authSubscription = subscription;
    } catch (err) {
      console.error('[Auth] Initialize failed:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  cleanup: () => {
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
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
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    } finally {
      set({ user: null, session: null, profile: null });
    }
  },
}));
