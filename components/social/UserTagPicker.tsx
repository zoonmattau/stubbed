import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui';
import { useFriends } from '@/hooks/useFriends';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { Profile } from '@/types';

type SearchTab = 'friends' | 'everyone';

interface UserTagPickerProps {
  selectedUserIds: string[];
  onSelectedUsersChange: (userIds: string[]) => void;
  textNames: string[];
  onTextNamesChange: (names: string[]) => void;
}

export function UserTagPicker({
  selectedUserIds,
  onSelectedUsersChange,
  textNames,
  onTextNamesChange,
}: UserTagPickerProps) {
  const { friendProfiles, searchFriends, searchAllUsers } = useFriends();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addNameModalVisible, setAddNameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('friends');
  const [allUserResults, setAllUserResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter friends based on search query and exclude already selected
  const filteredFriends = useMemo(() => {
    const results = searchFriends(searchQuery);
    return results.filter((friend) => !selectedUserIds.includes(friend.id));
  }, [searchFriends, searchQuery, selectedUserIds]);

  // Search all users when on "everyone" tab
  useEffect(() => {
    if (searchTab === 'everyone' && searchQuery.length >= 2) {
      setIsSearching(true);
      const timeoutId = setTimeout(async () => {
        const results = await searchAllUsers(searchQuery);
        setAllUserResults(results.filter((user) => !selectedUserIds.includes(user.id)));
        setIsSearching(false);
      }, 300); // Debounce

      return () => clearTimeout(timeoutId);
    } else if (searchTab === 'everyone') {
      setAllUserResults([]);
    }
  }, [searchQuery, searchTab, searchAllUsers, selectedUserIds]);

  // Get the current list based on tab
  const displayedUsers = searchTab === 'friends' ? filteredFriends : allUserResults;

  // Get selected friend profiles
  const selectedFriends = useMemo(() => {
    return friendProfiles.filter((friend) => selectedUserIds.includes(friend.id));
  }, [friendProfiles, selectedUserIds]);

  const handleSelectFriend = (friend: Profile) => {
    onSelectedUsersChange([...selectedUserIds, friend.id]);
    setSearchQuery('');
    setModalVisible(false);
  };

  const handleRemoveFriend = (friendId: string) => {
    onSelectedUsersChange(selectedUserIds.filter((id) => id !== friendId));
  };

  const handleRemoveTextName = (index: number) => {
    onTextNamesChange(textNames.filter((_, i) => i !== index));
  };

  const handleAddName = () => {
    if (newName.trim()) {
      onTextNamesChange([...textNames, newName.trim()]);
      setNewName('');
      setAddNameModalVisible(false);
    }
  };

  const renderSelectedItem = (item: { type: 'friend' | 'text'; data: Profile | string; key: string }) => {
    if (item.type === 'friend') {
      const friend = item.data as Profile;
      return (
        <View key={item.key} style={styles.chip}>
          <Avatar source={friend.avatar_url} name={friend.display_name || friend.username} size="sm" />
          <Text style={styles.chipText} numberOfLines={1}>
            {friend.display_name || friend.username}
          </Text>
          <TouchableOpacity
            style={styles.chipRemove}
            onPress={() => handleRemoveFriend(friend.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      );
    } else {
      const name = item.data as string;
      const index = textNames.indexOf(name);
      return (
        <View key={item.key} style={[styles.chip, styles.textChip]}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.chipText} numberOfLines={1}>
            {name}
          </Text>
          <TouchableOpacity
            style={styles.chipRemove}
            onPress={() => handleRemoveTextName(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Combine selected friends and text names for display
  const allSelected = [
    ...selectedFriends.map((f) => ({ type: 'friend' as const, data: f, key: `friend-${f.id}` })),
    ...textNames.map((n, i) => ({ type: 'text' as const, data: n, key: `text-${i}` })),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Went With</Text>

      {/* Selected items */}
      <View style={styles.selectedContainer}>
        {allSelected.map(renderSelectedItem)}

        {/* Add buttons */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="person-add" size={16} color={colors.primary} />
          <Text style={styles.addButtonText}>Tag Friend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, styles.addNameButton]}
          onPress={() => setAddNameModalVisible(true)}
        >
          <Ionicons name="add" size={16} color={colors.textSecondary} />
          <Text style={[styles.addButtonText, styles.addNameButtonText]}>Add Name</Text>
        </TouchableOpacity>
      </View>

      {/* User picker modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tag Someone</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, searchTab === 'friends' && styles.tabActive]}
              onPress={() => setSearchTab('friends')}
            >
              <Ionicons
                name="people"
                size={16}
                color={searchTab === 'friends' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, searchTab === 'friends' && styles.tabTextActive]}>
                Friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, searchTab === 'everyone' && styles.tabActive]}
              onPress={() => setSearchTab('everyone')}
            >
              <Ionicons
                name="globe"
                size={16}
                color={searchTab === 'everyone' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, searchTab === 'everyone' && styles.tabTextActive]}>
                Everyone
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchTab === 'friends' ? 'Search friends...' : 'Search by username...'}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {searchTab === 'everyone' && searchQuery.length < 2 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>
                Type at least 2 characters to search
              </Text>
            </View>
          ) : isSearching ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyStateText}>Searching...</Text>
            </View>
          ) : displayedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>
                {searchTab === 'friends'
                  ? friendProfiles.length === 0
                    ? 'Add some friends first!'
                    : 'No matching friends found'
                  : 'No users found'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendItem}
                  onPress={() => handleSelectFriend(item)}
                >
                  <Avatar
                    source={item.avatar_url}
                    name={item.display_name || item.username}
                    size="md"
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>
                      {item.display_name || item.username}
                    </Text>
                    <Text style={styles.friendUsername}>@{item.username}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.friendList}
            />
          )}
        </View>
      </Modal>

      {/* Add name modal */}
      <Modal
        visible={addNameModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAddNameModalVisible(false)}
      >
        <View style={styles.addNameModalOverlay}>
          <View style={styles.addNameModalContent}>
            <Text style={styles.addNameModalTitle}>Add Name</Text>
            <Text style={styles.addNameModalSubtitle}>
              For people who aren't on the app
            </Text>
            <TextInput
              style={styles.addNameInput}
              placeholder="Enter name"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.addNameModalButtons}>
              <TouchableOpacity
                style={[styles.addNameModalButton, styles.cancelButton]}
                onPress={() => {
                  setNewName('');
                  setAddNameModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addNameModalButton, styles.confirmButton]}
                onPress={handleAddName}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  textChip: {
    paddingLeft: spacing.sm,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    maxWidth: 100,
  },
  chipRemove: {
    marginLeft: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  addNameButton: {
    borderColor: colors.border,
  },
  addNameButtonText: {
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: `${colors.primary}15`,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: fontSize.md,
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  friendList: {
    padding: spacing.lg,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  friendUsername: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addNameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  addNameModalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
  addNameModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  addNameModalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  addNameInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  addNameModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addNameModalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
});
