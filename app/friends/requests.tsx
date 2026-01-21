import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '@/components/ui';
import { FriendCard } from '@/components/social';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { FriendWithProfile } from '@/types';

// Mock data
const mockRequests: FriendWithProfile[] = [];

export default function FriendRequestsScreen() {
  const [requests] = useState<FriendWithProfile[]>(mockRequests);
  const [searchUsername, setSearchUsername] = useState('');

  const handleAccept = (_id: string) => {
    // TODO: Implement accept friend request
  };

  const handleDecline = (_id: string) => {
    // TODO: Implement decline friend request
  };

  const handleSendRequest = () => {
    if (searchUsername.trim()) {
      // TODO: Implement send friend request
      setSearchUsername('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Add Friend Section */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Friend</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="at" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
              value={searchUsername}
              onChangeText={setSearchUsername}
              autoCapitalize="none"
            />
          </View>
          <Button
            title="Send"
            onPress={handleSendRequest}
            disabled={!searchUsername.trim()}
            size="md"
          />
        </View>
      </View>

      {/* Pending Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Pending Requests ({requests.length})
        </Text>

        {requests.length > 0 ? (
          <FlatList
            data={requests}
            renderItem={({ item }) => (
              <FriendCard
                friend={item}
                isPending
                onAccept={() => handleAccept(item.id)}
                onDecline={() => handleDecline(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
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
        <Text style={styles.sectionTitle}>Sent Requests</Text>
        <Card>
          <View style={styles.emptyContainer}>
            <Ionicons name="paper-plane-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No sent requests</Text>
            <Text style={styles.emptyText}>
              Requests you send will appear here until they're accepted
            </Text>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
});
