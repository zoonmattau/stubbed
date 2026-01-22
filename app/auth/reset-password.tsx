import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if we have a valid session from the reset password link
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }

      if (session) {
        setStatus('ready');
      } else {
        // Try to get session from URL hash
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
              setError(setSessionError.message);
              setStatus('error');
              return;
            }

            setStatus('ready');
            return;
          }
        }

        setError('Invalid or expired reset link. Please request a new one.');
        setStatus('error');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setStatus('error');
    }
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      setStatus('success');
    } catch (err) {
      setError('Failed to update password. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
        </View>
        <Text style={styles.title}>Reset Failed</Text>
        <Text style={styles.message}>{error}</Text>
        <Button
          title="Back to Login"
          onPress={() => router.replace('/(auth)/login')}
          size="lg"
          style={styles.button}
        />
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.centerContainer}>
        <View style={[styles.iconContainer, styles.successIcon]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        </View>
        <Text style={styles.title}>Password Updated!</Text>
        <Text style={styles.message}>
          Your password has been successfully updated. You can now log in with your new password.
        </Text>
        <Button
          title="Go to Login"
          onPress={() => router.replace('/(auth)/login')}
          size="lg"
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Enter your new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                }
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={confirmPasswordRef}
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit(onSubmit)}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                }
              />
            )}
          />

          <Button
            title="Update Password"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="lg"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: spacing['3xl'],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}20`,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.lg,
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
