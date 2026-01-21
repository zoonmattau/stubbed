import { Platform } from 'react-native';
import { supabase } from './supabase';
import { storePendingProfile } from './pendingProfile';
import type { AuthError, User } from '@supabase/supabase-js';

const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://stubbed.com.au';

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
}

export async function signUp(
  email: string,
  password: string,
  username: string,
  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  }
): Promise<AuthResult> {
  const redirectTo = Platform.OS === 'web'
    ? `${siteUrl}/auth/callback`
    : 'stubbed://auth/callback';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { user: null, error };
  }

  // Store profile data locally - it will be saved after email verification
  if (data.user) {
    await storePendingProfile({
      username,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      dateOfBirth: profile?.dateOfBirth,
      email,
    });
  }

  return { user: data.user, error: null };
}

export async function signIn(
  emailOrUsername: string,
  password: string,
  isUsername: boolean = false
): Promise<AuthResult> {
  let email = emailOrUsername;

  // If logging in with username, look up the email first
  if (isUsername) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', emailOrUsername)
      .single();

    if (profileError || !profile?.email) {
      return {
        user: null,
        error: { message: 'Username not found', name: 'AuthError', status: 400 } as any,
      };
    }

    email = profile.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const redirectTo = Platform.OS === 'web'
    ? `${siteUrl}/auth/reset-password`
    : 'stubbed://reset-password';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function updateProfile(
  userId: string,
  updates: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    favorite_sport?: string;
    favorite_team?: string;
  }
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return { error };
}
