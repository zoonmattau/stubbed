import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Avatar } from '@/components/ui';
import { FriendCard } from '@/components/social';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { FriendWithProfile } from '@/types';

// Mock data for incoming requests
const mockRequests: FriendWithProfile[] = [];

interface SentRequest {
  id: string;
  username: string;
  sentAt: Date;
}

export default function FriendRequestsScreen() {
  const [requests] = useState<FriendWithProfile[]>(mockRequests);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState('');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/friends');
    }
  };

  const handleAccept = (id: string) => {
    const doAccept = () => {
      // TODO: Implement actual accept friend request API call
      console.log('Accepting friend request:', id);
      if (Platform.OS === 'web') {
        window.alert('Friend request accepted!');
      } else {
        Alert.alert('Success', 'Friend request accepted!');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Accept this friend request?');
      if (confirmed) {
        doAccept();
      }
    } else {
      Alert.alert(
        'Accept Friend Request',
        'Accept this friend request?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Accept', onPress: doAccept },
        ]
      );
    }
  };

  const handleDecline = (id: string) => {
    const doDecline = () => {
      // TODO: Implement actual decline friend request API call
      console.log('Declining friend request:', id);
      if (Platform.OS === 'web') {
        window.alert('Friend request declined');
      } else {
        Alert.alert('Success', 'Friend request declined');
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

  const handleSendRequest = () => {
    if (searchUsername.trim()) {
      const username = searchUsername.trim();

      // Check if already sent
      if (sentRequests.some(r => r.username.toLowerCase() === username.toLowerCase())) {
        if (Platform.OS === 'web') {
          window.alert(`You already sent a request to @${username}`);
        } else {
          Alert.alert('Already Sent', `You already sent a request to @${username}`);
        }
        return;
      }

      const confirmSend = () => {
        // TODO: Implement actual send friend request API call
        console.log('Sending friend request to:', username);

        // Add to sent requests immediately
        setSentRequests(prev => [...prev, {
          id: Date.now().toString(),
          username,
          sentAt: new Date(),
        }]);

        setSearchUsername('');
        // Show success message
        if (Platform.OS === 'web') {
          window.alert(`Friend request sent to @${username}`);
        } else {
          Alert.alert('Request Sent', `Friend request sent to @${username}`);
        }
      };

      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Send friend request to @${username}?`);
        if (confirmed) {
          confirmSend();
        }
      } else {
        Alert.alert(
          'Send Friend Request',
          `Send friend request to @${username}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send', onPress: confirmSend },
          ]
        );
      }
    }
  };

  const handleCancelRequest = (id: string, username: string) => {
    const doCancel = () => {
      setSentRequests(prev => prev.filter(r => r.id !== id));
      if (Platform.OS === 'web') {
        window.alert(`Request to @${username} cancelled`);
      } else {
        Alert.alert('Cancelled', `Request to @${username} cancelled`);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Cancel friend request to @${username}?`)) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Request',
        `Cancel friend request to @${username}?`,
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: doCancel },
        ]
      );
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

      <ScrollView style={styles.content}>
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
        <Text style={styles.sectionTitle}>Sent Requests ({sentRequests.length})</Text>
        {sentRequests.length > 0 ? (
          <Card>
            {sentRequests.map((request, index) => (
              <View
                key={request.id}
                style={[
                  styles.sentRequestItem,
                  index < sentRequests.length - 1 && styles.sentRequestBorder,
                ]}
              >
                <Avatar name={request.username} size="md" />
                <View style={styles.sentRequestInfo}>
                  <Text style={styles.sentRequestUsername}>@{request.username}</Text>
                  <Text style={styles.sentRequestTime}>
                    Sent {request.sentAt.toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCancelRequest(request.id, request.username)}
                  style={styles.cancelButton}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
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
    </View>
  );
}

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
});
