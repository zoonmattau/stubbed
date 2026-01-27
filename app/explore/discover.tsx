import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFollows } from '@/hooks/useFollows';
import { UserCard } from '@/components/explore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { UserSuggestion } from '@/types';

export default function DiscoverScreen() {
  const { getSuggestedUsers, searchUsers } = useFollows();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(query.trim());
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

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
      setSearchResults(prev => prev.filter(u => u.user_id !== userId));
    }
  };

  // Render user item
  const renderItem = ({ item }: { item: UserSuggestion }) => (
    <UserCard
      user={item}
      onFollowChange={(isFollowing) => handleFollowChange(item.user_id, isFollowing)}
    />
  );

  const isSearchActive = searchQuery.trim().length > 0;
  const displayData = isSearchActive ? searchResults : suggestions;

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={isSearchActive ? 'search-outline' : 'people-outline'}
        size={64}
        color={colors.textMuted}
      />
      <Text style={styles.emptyTitle}>
        {isSearchActive ? 'No Users Found' : 'No Suggestions'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSearchActive
          ? `No results for "${searchQuery}"`
          : "We couldn't find any users to suggest right now"}
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
        data={displayData}
        keyExtractor={(item) => item.user_id}
        renderItem={renderItem}
        ListEmptyComponent={isSearching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : renderEmptyState}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or username..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {!isSearchActive && (
              <>
                <Text style={styles.headerTitle}>Suggested for you</Text>
                <Text style={styles.headerSubtitle}>
                  Users with public reviews you might be interested in
                </Text>
              </>
            )}
            {isSearchActive && !isSearching && (
              <Text style={styles.searchResultsText}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Text>
            )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
  },
  searchResultsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  searchingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
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
