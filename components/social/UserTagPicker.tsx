import React, { useState, useEffect } from 'react';
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
import { useFollows } from '@/hooks/useFollows';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { Profile } from '@/types';

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
  const { searchAllUsers } = useFollows();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addNameModalVisible, setAddNameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search all users with debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      const timeoutId = setTimeout(async () => {
        const results = await searchAllUsers(searchQuery);
        setSearchResults(results.filter((user) => !selectedUserIds.includes(user.id)));
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchAllUsers, selectedUserIds]);

  const handleSelectUser = (user: Profile) => {
    onSelectedUsersChange([...selectedUserIds, user.id]);
    setSearchQuery('');
    setModalVisible(false);
  };

  const handleRemoveUser = (userId: string) => {
    onSelectedUsersChange(selectedUserIds.filter((id) => id !== userId));
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

  const renderSelectedItem = (item: { type: 'user' | 'text'; data: Profile | string; key: string }) => {
    if (item.type === 'user') {
      const user = item.data as Profile;
      return (
        <View key={item.key} style={styles.chip}>
          <Avatar source={user.avatar_url} name={user.display_name || user.username} size="sm" />
          <Text style={styles.chipText} numberOfLines={1}>
            {user.display_name || user.username}
          </Text>
          <TouchableOpacity
            style={styles.chipRemove}
            onPress={() => handleRemoveUser(user.id)}
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

  // Combine selected users and text names for display
  const allSelected = [
    ...selectedUserIds.map((id) => ({ type: 'user' as const, data: { id, username: '', display_name: null, avatar_url: null } as Profile, key: `user-${id}` })),
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
          <Text style={styles.addButtonText}>Tag User</Text>
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

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
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

          {searchQuery.length < 2 ? (
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
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleSelectUser(item)}
                >
                  <Avatar
                    source={item.avatar_url}
                    name={item.display_name || item.username}
                    size="md"
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.display_name || item.username}
                    </Text>
                    <Text style={styles.userUsername}>@{item.username}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.userList}
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
  userList: {
    padding: spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  userUsername: {
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
