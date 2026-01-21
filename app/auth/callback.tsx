import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the current session - Supabase should have already processed the tokens from the URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }

      if (session) {
        setStatus('success');
        // Brief delay to show success message
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      } else {
        // No session yet - might need to exchange tokens
        // Check if we have tokens in URL hash (for web)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              setErrorMessage(setSessionError.message);
              setStatus('error');
              return;
            }

            setStatus('success');
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 1500);
            return;
          }
        }

        setErrorMessage('Unable to verify your email. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verifying your email...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
        </View>
        <Text style={styles.title}>Verification Failed</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        <Button
          title="Back to Login"
          onPress={() => router.replace('/(auth)/login')}
          size="lg"
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, styles.successIcon]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      </View>
      <Text style={styles.title}>Email Verified!</Text>
      <Text style={styles.message}>Your account has been verified. Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.error}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    backgroundColor: `${colors.success}20`,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 24,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  button: {
    width: '100%',
  },
});
