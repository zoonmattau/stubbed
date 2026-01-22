import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Platform, ScrollView, Image, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Avatar } from '@/components/ui';
import { FriendCard } from '@/components/social';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getCurrentLevel } from '@/constants/levels';
import { useFriends } from '@/hooks/useFriends';
import type { FriendWithProfile, Profile } from '@/types';

interface UserWithStats extends Profile {
  total_events?: number;
  favorite_sport?: string;
  favorite_team?: string;
}

export default function FriendRequestsScreen() {
  const {
    pendingRequests,
    sentRequests: hookSentRequests,
    sendRequest: sendFriendRequest,
    acceptRequest,
    declineRequest,
    searchUsersWithStats,
    refreshAll
  } = useFriends();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithStats[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<'search' | 'pending' | 'sent'>('search');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchUsername.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchUsersWithStats(searchUsername);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchUsername, searchUsersWithStats]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/friends');
    }
  };

  const handleAccept = async (id: string) => {
    const result = await acceptRequest(id);
    if (result.success) {
      if (Platform.OS === 'web') {
        window.alert('Friend request accepted!');
      } else {
        Alert.alert('Success', 'Friend request accepted!');
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(result.error || 'Failed to accept request');
      } else {
        Alert.alert('Error', result.error || 'Failed to accept request');
      }
    }
  };

  const handleDecline = async (id: string) => {
    const doDecline = async () => {
      const result = await declineRequest(id);
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert('Friend request declined');
        } else {
          Alert.alert('Success', 'Friend request declined');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Decline this friend request?');
      if (confirmed) {
        doDecline();
      }
    } else {
      Alert.alert(
        'Decline Friend Request',
        'Are you sure you want to decline this friend request?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Decline', style: 'destructive', onPress: doDecline },
        ]
      );
    }
  };

  const handleSendRequestToUser = async (user: UserWithStats) => {
    const result = await sendFriendRequest(user.username);
    if (result.success) {
      setSearchUsername('');
      setShowDropdown(false);
      setSearchResults([]);
      if (Platform.OS === 'web') {
        window.alert(`Friend request sent to @${user.username}`);
      } else {
        Alert.alert('Request Sent', `Friend request sent to @${user.username}`);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(result.error || 'Failed to send request');
      } else {
        Alert.alert('Error', result.error || 'Failed to send request');
      }
    }
  };

  const handleSendRequest = async () => {
    if (searchUsername.trim()) {
      const result = await sendFriendRequest(searchUsername.trim());
      if (result.success) {
        setSearchUsername('');
        setShowDropdown(false);
        if (Platform.OS === 'web') {
          window.alert(`Friend request sent to @${searchUsername.trim()}`);
        } else {
          Alert.alert('Request Sent', `Friend request sent to @${searchUsername.trim()}`);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to send request');
        } else {
          Alert.alert('Error', result.error || 'Failed to send request');
        }
      }
    }
  };

  // Show user profile preview modal
  const handleViewProfile = (user: UserWithStats, requestType: 'search' | 'pending' | 'sent' = 'search', requestId?: string) => {
    setSelectedUser(user);
    setSelectedRequestType(requestType);
    setSelectedRequestId(requestId || null);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
    setSelectedRequestType('search');
    setSelectedRequestId(null);
  };

  const handleAddFromModal = async () => {
    if (selectedUser) {
      await handleSendRequestToUser(selectedUser);
      handleCloseProfileModal();
    }
  };

  const handleAcceptFromModal = async () => {
    if (selectedRequestId) {
      await handleAccept(selectedRequestId);
      handleCloseProfileModal();
    }
  };

  const handleDeclineFromModal = async () => {
    if (selectedRequestId) {
      await handleDecline(selectedRequestId);
      handleCloseProfileModal();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
      {/* Add Friend Section */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Friend</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or name..."
                placeholderTextColor={colors.textMuted}
                value={searchUsername}
                onChangeText={setSearchUsername}
                autoCapitalize="none"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
              {searchUsername.length > 0 && !isSearching && (
                <TouchableOpacity onPress={() => {
                  setSearchUsername('');
                  setShowDropdown(false);
                }}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <View style={styles.dropdown}>
              {searchResults.map((user, index) => {
                // Calculate user level based on their total_events (approximate points)
                const estimatedPoints = (user.total_events || 0) * 25; // rough estimate
                const userLevel = getCurrentLevel(estimatedPoints);

                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.dropdownItem,
                      index < searchResults.length - 1 && styles.dropdownItemBorder
                    ]}
                    onPress={() => handleViewProfile(user)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userPreview}>
                      {user.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatarPlaceholder}>
                          <Text style={styles.userAvatarText}>
                            {(user.display_name || user.username || '?')[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName} numberOfLines={1}>
                            {user.display_name || user.username}
                          </Text>
                          <View style={[styles.levelBadge, { backgroundColor: `${userLevel.color}20` }]}>
                            <Ionicons name={userLevel.icon as any} size={10} color={userLevel.color} />
                            <Text style={[styles.levelText, { color: userLevel.color }]}>
                              {userLevel.name}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                        <View style={styles.userStats}>
                          <View style={styles.userStat}>
                            <Ionicons name="ticket-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.userStatText}>
                              {user.total_events || 0} events
                            </Text>
                          </View>
                          {user.favorite_sport && (
                            <View style={styles.userStat}>
                              <Ionicons name="football-outline" size={12} color={colors.textMuted} />
                              <Text style={styles.userStatText}>{user.favorite_sport}</Text>
                            </View>
                          )}
                          {user.favorite_team && (
                            <View style={styles.userStat}>
                              <Ionicons name="shield-outline" size={12} color={colors.textMuted} />
                              <Text style={styles.userStatText}>{user.favorite_team}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleSendRequestToUser(user)}
                      >
                        <Ionicons name="person-add" size={18} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* No results message */}
          {showDropdown && searchResults.length === 0 && searchUsername.length >= 2 && !isSearching && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No users found</Text>
            </View>
          )}
        </View>
      </View>

      {/* Pending Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Pending Requests ({pendingRequests.length})
        </Text>

        {pendingRequests.length > 0 ? (
          <Card>
            {pendingRequests.map((request, index) => {
              const profile = request.profile;
              return (
                <TouchableOpacity
                  key={request.id}
                  style={[
                    styles.requestItem,
                    index < pendingRequests.length - 1 && styles.requestItemBorder,
                  ]}
                  onPress={() => handleViewProfile(
                    { ...profile, total_events: 0 } as UserWithStats,
                    'pending',
                    request.id
                  )}
                >
                  <Avatar
                    source={profile?.avatar_url}
                    name={profile?.username}
                    size="md"
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {profile?.display_name || profile?.username}
                    </Text>
                    <Text style={styles.requestUsername}>
                      Received {getRelativeTime(request.created_at)}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAccept(request.id);
                      }}
                    >
                      <Ionicons name="checkmark" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDecline(request.id);
                      }}
                    >
                      <Ionicons name="close" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
        ) : (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyText}>
                When someone sends you a friend request, it will appear here
              </Text>
            </View>
          </Card>
        )}
      </View>

      {/* Sent Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sent Requests ({hookSentRequests.length})</Text>
        {hookSentRequests.length > 0 ? (
          <Card>
            {hookSentRequests.map((request, index) => {
              const profile = request.profile;
              return (
                <TouchableOpacity
                  key={request.id}
                  style={[
                    styles.requestItem,
                    index < hookSentRequests.length - 1 && styles.requestItemBorder,
                  ]}
                  onPress={() => handleViewProfile(
                    { ...profile, total_events: 0 } as UserWithStats,
                    'sent',
                    request.id
                  )}
                >
                  <Avatar
                    source={profile?.avatar_url}
                    name={profile?.username}
                    size="md"
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {profile?.display_name || profile?.username}
                    </Text>
                    <Text style={styles.requestUsername}>
                      Sent {getRelativeTime(request.created_at)}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
        ) : (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="paper-plane-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No sent requests</Text>
              <Text style={styles.emptyText}>
                Requests you send will appear here until they're accepted
              </Text>
            </View>
          </Card>
        )}
      </View>
      </ScrollView>

      {/* Profile Preview Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseProfileModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (() => {
              const estimatedPoints = (selectedUser.total_events || 0) * 25;
              const userLevel = getCurrentLevel(estimatedPoints);

              return (
                <>
                  {/* Close button */}
                  <TouchableOpacity
                    style={styles.modalCloseButtonTop}
                    onPress={handleCloseProfileModal}
                  >
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Avatar */}
                  <View style={styles.avatarContainerNoBanner}>
                    {selectedUser.avatar_url ? (
                      <Image source={{ uri: selectedUser.avatar_url }} style={styles.modalAvatar} />
                    ) : (
                      <View style={[styles.modalAvatarPlaceholder, { borderColor: colors.border }]}>
                        <Text style={styles.modalAvatarText}>
                          {(selectedUser.display_name || selectedUser.username || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.modalLevelBadge, { backgroundColor: userLevel.color }]}>
                      <Ionicons name={userLevel.icon as any} size={14} color={colors.white} />
                      <Text style={styles.modalLevelText}>{userLevel.name}</Text>
                    </View>
                  </View>

                  {/* User Info */}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {selectedUser.display_name || selectedUser.username}
                    </Text>
                    <Text style={styles.profileUsername}>@{selectedUser.username}</Text>

                    {selectedUser.bio && (
                      <Text style={styles.profileBio}>{selectedUser.bio}</Text>
                    )}
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Ionicons name="ticket" size={24} color={colors.primary} />
                      <Text style={styles.statValue}>{selectedUser.total_events || 0}</Text>
                      <Text style={styles.statLabel}>Events</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Ionicons name="star" size={24} color={colors.gold} />
                      <Text style={styles.statValue}>{estimatedPoints}</Text>
                      <Text style={styles.statLabel}>Points</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Ionicons name="trophy" size={24} color={userLevel.color} />
                      <Text style={styles.statValue}>Lvl {userLevel.level}</Text>
                      <Text style={styles.statLabel}>{userLevel.name}</Text>
                    </View>
                  </View>

                  {/* Favorites */}
                  {(selectedUser.favorite_sport || selectedUser.favorite_team) && (
                    <View style={styles.favoritesSection}>
                      <Text style={styles.favoritesTitle}>Favorites</Text>
                      <View style={styles.favoritesList}>
                        {selectedUser.favorite_sport && (
                          <View style={styles.favoriteItem}>
                            <Ionicons name="football" size={18} color={colors.primary} />
                            <Text style={styles.favoriteText}>{selectedUser.favorite_sport}</Text>
                          </View>
                        )}
                        {selectedUser.favorite_team && (
                          <View style={styles.favoriteItem}>
                            <Ionicons name="shield" size={18} color={colors.warning} />
                            <Text style={styles.favoriteText}>{selectedUser.favorite_team}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Action Buttons - vary by request type */}
                  <View style={styles.modalActions}>
                    {selectedRequestType === 'search' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={handleAddFromModal}
                      >
                        <Ionicons name="person-add" size={20} color={colors.white} />
                        <Text style={styles.actionButtonText}>Add Friend</Text>
                      </TouchableOpacity>
                    )}

                    {selectedRequestType === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.success, flex: 1 }]}
                          onPress={handleAcceptFromModal}
                        >
                          <Ionicons name="checkmark" size={20} color={colors.white} />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.error, flex: 1 }]}
                          onPress={handleDeclineFromModal}
                        >
                          <Ionicons name="close" size={20} color={colors.white} />
                          <Text style={styles.actionButtonText}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {selectedRequestType === 'sent' && (
                      <View style={styles.sentStatusContainer}>
                        <Ionicons name="time-outline" size={20} color={colors.warning} />
                        <Text style={styles.sentStatusText}>Request Pending</Text>
                      </View>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  addSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
  section: {
    marginBottom: spacing.xl,
  },
  listContent: {
    gap: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sentRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  sentRequestBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sentRequestInfo: {
    flex: 1,
  },
  sentRequestUsername: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  sentRequestTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  cancelButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    padding: spacing.md,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  userUsername: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userStatText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  levelText: {
    fontSize: 9,
    fontWeight: fontWeight.semibold,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  pendingBadge: {
    backgroundColor: `${colors.warning}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  pendingBadgeText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  profileBanner: {
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerPattern: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.3,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -45,
  },
  avatarContainerNoBanner: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  modalCloseButtonTop: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.border,
  },
  modalAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  modalAvatarText: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  modalLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  modalLevelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileUsername: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileBio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  favoritesSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  favoritesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoritesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  favoriteText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  addFriendButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  // Request item styles
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  requestItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  requestUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal action styles
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    margin: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flex: 1,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  sentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.lg,
    flex: 1,
  },
  sentStatusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.warning,
  },
});
