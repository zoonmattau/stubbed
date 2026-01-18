import { supabase } from './supabase';
import type { AuthError, User } from '@supabase/supabase-js';

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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    return { user: null, error };
  }

  // Create profile after successful signup
  if (data.user) {
    const displayName = profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : username;

    // Convert DD-MM-YYYY to YYYY-MM-DD for PostgreSQL
    let formattedDob: string | undefined;
    if (profile?.dateOfBirth) {
      const [day, month, year] = profile.dateOfBirth.split('-');
      formattedDob = `${year}-${month}-${day}`;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
      display_name: displayName,
      email,
      first_name: profile?.firstName,
      last_name: profile?.lastName,
      date_of_birth: formattedDob,
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Initialize user stats
    await supabase.from('user_stats').insert({
      user_id: data.user.id,
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'stubbed://reset-password',
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
