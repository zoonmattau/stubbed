import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Event</Text>
        <Text style={styles.subtitle}>
          How would you like to add your event?
        </Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/event/search')}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="search" size={32} color={colors.primary} />
            </View>
            <Text style={styles.optionTitle}>Search Events</Text>
            <Text style={styles.optionDescription}>
              Find an existing event from our database
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/event/manual')}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.secondary}20` }]}>
              <Ionicons name="create" size={32} color={colors.secondary} />
            </View>
            <Text style={styles.optionTitle}>Manual Entry</Text>
            <Text style={styles.optionDescription}>
              Enter all the event details yourself
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>
              Search first to find pre-populated event data
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>
              Add photos to preserve your memories
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>
              Rate the atmosphere to track your best experiences
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  options: {
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  optionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  optionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tips: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
