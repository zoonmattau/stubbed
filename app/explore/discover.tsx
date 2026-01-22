import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFollows } from '@/hooks/useFollows';
import { UserCard } from '@/components/explore';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { UserSuggestion } from '@/types';

export default function DiscoverScreen() {
  const { getSuggestedUsers } = useFollows();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    const users = await getSuggestedUsers(20);
    setSuggestions(users);
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchSuggestions();
      setIsLoading(false);
    };
    load();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuggestions();
    setRefreshing(false);
  };

  // Remove user from suggestions when followed
  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    if (isFollowing) {
      setSuggestions(prev => prev.filter(u => u.user_id !== userId));
    }
  };

  // Render user item
  const renderItem = ({ item }: { item: UserSuggestion }) => (
    <UserCard
      user={item}
      onFollowChange={(isFollowing) => handleFollowChange(item.user_id, isFollowing)}
    />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Suggestions</Text>
      <Text style={styles.emptySubtitle}>
        We couldn't find any users to suggest right now
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Discover Users',
          headerBackTitle: 'Back',
        }}
      />

      <FlatList
        style={styles.container}
        data={suggestions}
        keyExtractor={(item) => item.user_id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Suggested for you</Text>
            <Text style={styles.headerSubtitle}>
              Users with public reviews you might be interested in
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
