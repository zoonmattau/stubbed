import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExploreStore } from '@/stores/exploreStore';
import { useFollows } from '@/hooks/useFollows';
import { ReviewCard, UserCard } from '@/components/explore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { ReviewWithDetails, UserSuggestion } from '@/types';

type SearchTab = 'all' | 'reviews' | 'users';

export default function SearchScreen() {
  const { searchReviews, searchResults, isLoadingSearch } = useExploreStore();
  const { searchUsers } = useFollows();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [userResults, setUserResults] = useState<UserSuggestion[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);

    if (text.trim().length < 2) {
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    // Search reviews
    searchReviews(text, true);

    // Search users
    setIsSearchingUsers(true);
    const users = await searchUsers(text);
    setUserResults(users);
    setIsSearchingUsers(false);
  }, []);

  // Combined results for "all" tab
  const renderAllResults = () => {
    const hasReviews = searchResults.length > 0;
    const hasUsers = userResults.length > 0;

    if (!hasReviews && !hasUsers && hasSearched && !isLoadingSearch && !isSearchingUsers) {
      return renderEmptyState();
    }

    return (
      <>
        {/* Users Section */}
        {hasUsers && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Users</Text>
              {userResults.length > 3 && (
                <TouchableOpacity onPress={() => setActiveTab('users')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            {userResults.slice(0, 3).map((user) => (
              <UserCard key={user.user_id} user={user} compact />
            ))}
          </View>
        )}

        {/* Reviews Section */}
        {hasReviews && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {searchResults.length > 3 && (
                <TouchableOpacity onPress={() => setActiveTab('reviews')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchResults.slice(0, 3).map((review) => (
              <ReviewCard key={review.review_id} review={review} />
            ))}
          </View>
        )}
      </>
    );
  };

  // Render review item
  const renderReviewItem = ({ item }: { item: ReviewWithDetails }) => (
    <View style={styles.reviewWrapper}>
      <ReviewCard review={item} />
    </View>
  );

  // Render user item
  const renderUserItem = ({ item }: { item: UserSuggestion }) => (
    <UserCard user={item} compact />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Results Found</Text>
      <Text style={styles.emptySubtitle}>
        Try searching for a team name, username, or keyword
      </Text>
    </View>
  );

  // Render initial state
  const renderInitialState = () => (
    <View style={styles.initialContainer}>
      <Ionicons name="search" size={48} color={colors.textMuted} />
      <Text style={styles.initialTitle}>Search</Text>
      <Text style={styles.initialSubtitle}>
        Find reviews, users, teams, and more
      </Text>
    </View>
  );

  const isLoading = isLoadingSearch || isSearchingUsers;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Search',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Search reviews, users, teams..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => {
                setQuery('');
                setHasSearched(false);
              }}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Buttons */}
        {hasSearched && (
          <View style={styles.tabContainer}>
            {(['all', 'reviews', 'users'] as SearchTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {!hasSearched ? (
              renderInitialState()
            ) : activeTab === 'all' ? (
              <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={renderAllResults}
                contentContainerStyle={styles.listContent}
              />
            ) : activeTab === 'reviews' ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.review_id}
                renderItem={renderReviewItem}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <FlatList
                data={userResults}
                keyExtractor={(item) => item.user_id}
                renderItem={renderUserItem}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLighter,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  reviewWrapper: {
    marginBottom: spacing.md,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  initialTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  initialSubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
