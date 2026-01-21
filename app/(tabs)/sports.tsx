import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { SPORTS } from '@/constants/sports';
import { SPORTSDB_LEAGUES, SPORTSDB_CATEGORIES } from '@/lib/thesportsdb';

interface SportCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  route?: string;
  leagues?: string[];
  description?: string;
}

// Sorted alphabetically
const SPORT_CATEGORIES: SportCategory[] = [
  {
    id: 'afl',
    name: 'AFL',
    icon: 'football',
    color: '#3b82f6',
    route: '/sports/afl',
    description: 'Australian Football League',
  },
  {
    id: 'aleague',
    name: 'A-League',
    icon: 'football',
    color: '#a855f7',
    route: '/sports/aleague',
    description: 'Australian Soccer League',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: 'basketball',
    color: '#f97316',
    route: '/sports/basketball',
    description: 'WNBA & EuroLeague',
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: 'baseball',
    color: '#22c55e',
    route: '/sports/cricket',
    description: 'BBL, IPL, The Hundred & more',
  },
  {
    id: 'golf',
    name: 'Golf',
    icon: 'golf',
    color: '#10b981',
    route: '/sports/golf',
    description: 'PGA, LPGA & DP World Tour',
  },
  {
    id: 'motorsport',
    name: 'Motorsport',
    icon: 'car-sport',
    color: '#ef4444',
    route: '/sports/motorsport',
    description: 'F1, MotoGP, Supercars & more',
  },
  {
    id: 'netball',
    name: 'Netball',
    icon: 'people',
    color: '#ec4899',
    route: '/sports/netball',
    description: 'Super Netball',
  },
  {
    id: 'nrl',
    name: 'NRL',
    icon: 'football-outline',
    color: '#8b5cf6',
    route: '/sports/nrl',
    description: 'National Rugby League',
  },
  {
    id: 'rugby',
    name: 'Rugby Union',
    icon: 'american-football',
    color: '#f59e0b',
    route: '/sports/rugby',
    description: 'Super Rugby, Six Nations & more',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: 'tennisball',
    color: '#84cc16',
    route: '/tennis',
    description: 'Live scores, ATP & WTA rankings',
  },
  {
    id: 'combat',
    name: 'UFC & Boxing',
    icon: 'fitness',
    color: '#f97316',
    route: '/sports/combat',
    description: 'UFC & Boxing',
  },
];

export default function SportsScreen() {
  const router = useRouter();

  const handleCategoryPress = (category: SportCategory) => {
    if (category.route) {
      router.push(category.route as any);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Sports</Text>
        <Text style={styles.subtitle}>Explore live scores, fixtures & rankings</Text>
      </View>

      <View style={styles.grid}>
        {SPORT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon as any} size={28} color={category.color} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
            {category.description && (
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
            )}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonTitle}>More Sports Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          We're adding more sports and leagues regularly. Stay tuned!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  arrowContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  comingSoon: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  comingSoonText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
