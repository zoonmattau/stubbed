import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

type FeedType = 'trending' | 'following' | 'leaderboard' | 'live';

interface FeedToggleProps {
  activeTab: FeedType;
  onTabChange: (tab: FeedType) => void;
}

const TABS: { key: FeedType; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'following', label: 'Following' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'live', label: 'Live Sports' },
];

export function FeedToggle({ activeTab, onTabChange }: FeedToggleProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLighter,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
