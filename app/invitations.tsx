import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { useEventInvitations } from '@/hooks/useEventInvitations';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate } from '@/utils/dates';
import { getSportColor } from '@/constants/sports';
import type { EventTagInvitationWithDetails } from '@/types';

export default function InvitationsScreen() {
  const {
    pendingInvitations,
    isLoading,
    acceptInvitation,
    declineInvitation,
    refresh,
  } = useEventInvitations();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const { user } = useAuthStore();
  const { fetchAttendedEvents } = useEventsStore();

  const handleAccept = async (invitation: EventTagInvitationWithDetails) => {
    const result = await acceptInvitation(invitation.id);
    if (result.success) {
      // Refresh events so the accepted event shows up immediately
      if (user?.id) {
        fetchAttendedEvents(user.id);
      }
      Alert.alert('Accepted', 'Event has been added to your history!');
    } else {
      Alert.alert('Error', result.error || 'Failed to accept invitation');
    }
  };

  const handleDecline = (invitation: EventTagInvitationWithDetails) => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const result = await declineInvitation(invitation.id);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to decline invitation');
            }
          },
        },
      ]
    );
  };

  const renderInvitation = ({ item }: { item: EventTagInvitationWithDetails }) => {
    const event = item.attended_event?.event;
    const fromUser = item.from_user;
    const sportColor = event?.sport?.name
      ? getSportColor(event.sport.name.toLowerCase())
      : colors.primary;

    return (
      <Card style={styles.invitationCard}>
        {/* Who tagged you */}
        <View style={styles.taggerRow}>
          <Avatar
            source={fromUser?.avatar_url}
            name={fromUser?.display_name || fromUser?.username}
            size="sm"
          />
          <View style={styles.taggerInfo}>
            <Text style={styles.taggerText}>
              <Text style={styles.taggerName}>
                {fromUser?.display_name || fromUser?.username}
              </Text>
              {' tagged you in an event'}
            </Text>
          </View>
        </View>

        {/* Event details */}
        {event && (
          <View style={styles.eventDetails}>
            <View style={styles.eventHeader}>
              <Badge
                label={event.sport?.name || 'Sport'}
                size="sm"
                color={sportColor}
              />
              {event.competition && (
                <Text style={styles.competition}>{event.competition}</Text>
              )}
            </View>

            <View style={styles.teamsRow}>
              <View style={styles.team}>
                {event.home_team?.logo_url ? (
                  <Image
                    source={{ uri: event.home_team.logo_url }}
                    style={styles.teamLogo}
                  />
                ) : (
                  <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                    <Text style={styles.teamLogoText}>
                      {event.home_team?.short_name?.[0] || 'H'}
                    </Text>
                  </View>
                )}
                <Text style={styles.teamName} numberOfLines={1}>
                  {event.home_team?.name || 'Home'}
                </Text>
              </View>

              <View style={styles.scoreContainer}>
                {event.home_score && event.away_score ? (
                  <Text style={styles.score}>
                    {event.home_score} - {event.away_score}
                  </Text>
                ) : (
                  <Text style={styles.vs}>VS</Text>
                )}
              </View>

              <View style={styles.team}>
                {event.away_team?.logo_url ? (
                  <Image
                    source={{ uri: event.away_team.logo_url }}
                    style={styles.teamLogo}
                  />
                ) : (
                  <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                    <Text style={styles.teamLogoText}>
                      {event.away_team?.short_name?.[0] || 'A'}
                    </Text>
                  </View>
                )}
                <Text style={styles.teamName} numberOfLines={1}>
                  {event.away_team?.name || 'Away'}
                </Text>
              </View>
            </View>

            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{formatDate(event.event_date)}</Text>
              </View>
              {event.venue && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{event.venue.name}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDecline(item)}
          >
            <Ionicons name="close" size={20} color={colors.error} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item)}
          >
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (isLoading && pendingInvitations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pendingInvitations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Pending Invitations</Text>
          <Text style={styles.emptySubtitle}>
            When someone tags you in an event, it'll appear here
          </Text>
          <Button
            title="Go Back"
            variant="outline"
            onPress={handleBack}
            style={styles.backButton}
          />
        </View>
      ) : (
        <FlatList
          data={pendingInvitations}
          keyExtractor={(item) => item.id}
          renderItem={renderInvitation}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  invitationCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  taggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taggerInfo: {
    flex: 1,
  },
  taggerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  taggerName: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  eventDetails: {
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  competition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  teamLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  teamName: {
    fontSize: fontSize.xs,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 80,
  },
  scoreContainer: {
    paddingHorizontal: spacing.md,
  },
  score: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  vs: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  declineButton: {
    backgroundColor: colors.surface,
  },
  declineText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.error,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  acceptText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.lg,
  },
});
