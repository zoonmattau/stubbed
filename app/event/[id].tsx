import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Button, StarRating } from '@/components/ui';
import { TaggedUsersList } from '@/components/social/TaggedUsersList';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/dates';
import { getSportColor } from '@/constants/sports';
import type { AttendedEventWithDetails } from '@/types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { attendedEvents, updateAttendedEvent, deleteAttendedEvent } = useEventsStore();

  const [attendance, setAttendance] = useState<AttendedEventWithDetails | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  useEffect(() => {
    const found = attendedEvents.find((e) => e.event_id === id);
    setAttendance(found || null);
  }, [id, attendedEvents]);

  if (!attendance || !attendance.event) {
    return (
      <View style={styles.container}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.notFoundText}>Event not found</Text>
          <Button title="Go Back" onPress={handleBack} variant="outline" />
        </View>
      </View>
    );
  }

  const event = attendance.event;
  const sportColor = getSportColor(event.sport?.name?.toLowerCase() || '');

  const handleToggleFavorite = async () => {
    await updateAttendedEvent(attendance.id, { is_favorite: !attendance.is_favorite });
  };

  const handleDelete = () => {
    const doDelete = async () => {
      const result = await deleteAttendedEvent(attendance.id);
      if (result.success) {
        handleBack();
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove this event from your history?');
      if (confirmed) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Event',
        'Are you sure you want to remove this event from your history?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleEdit = () => {
    router.push(`/event/edit/${attendance.id}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with sport color */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <View style={styles.headerContent}>
          <Badge label={event.sport?.name || 'Sport'} size="md" color={`${sportColor}dd`} />
          {event.competition && (
            <Text style={styles.competition}>{event.competition}</Text>
          )}
          {event.round && <Text style={styles.round}>{event.round}</Text>}
        </View>
      </View>

      {/* Teams & Score */}
      <Card style={styles.matchCard}>
        <View style={styles.teamsContainer}>
          <View style={styles.teamColumn}>
            <View style={styles.teamLogoContainer}>
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
            </View>
            <Text style={styles.teamName}>{event.home_team?.name || 'Home'}</Text>
          </View>

          <View style={styles.scoreColumn}>
            {event.home_score && event.away_score ? (
              <>
                <Text style={styles.score}>{event.home_score}</Text>
                <Text style={styles.scoreDivider}>-</Text>
                <Text style={styles.score}>{event.away_score}</Text>
              </>
            ) : (
              <Text style={styles.vs}>VS</Text>
            )}
            {event.is_draw && <Badge label="Draw" size="sm" variant="info" />}
          </View>

          <View style={styles.teamColumn}>
            <View style={styles.teamLogoContainer}>
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
            </View>
            <Text style={styles.teamName}>{event.away_team?.name || 'Away'}</Text>
          </View>
        </View>
      </Card>

      {/* Event Info */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formatDate(event.event_date)}</Text>
        </View>
        {event.event_time && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>{formatTime(event.event_time)}</Text>
          </View>
        )}
        {event.venue && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {event.venue.name}
              {event.venue.city && `, ${event.venue.city}`}
            </Text>
          </View>
        )}
        {event.season && (
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>Season {event.season}</Text>
          </View>
        )}
      </Card>

      {/* Your Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Experience</Text>
        <Card>
          {/* Rating */}
          {attendance.rating && (
            <View style={styles.experienceRow}>
              <Text style={styles.experienceLabel}>Overall Rating</Text>
              <StarRating rating={attendance.rating} size={20} readonly />
            </View>
          )}

          {/* Atmosphere */}
          {attendance.atmosphere_rating && (
            <View style={styles.experienceRow}>
              <Text style={styles.experienceLabel}>Atmosphere</Text>
              <StarRating
                rating={attendance.atmosphere_rating}
                size={20}
                color={colors.secondary}
                readonly
              />
            </View>
          )}

          {/* Seat Info */}
          {(attendance.section || attendance.seat_info) && (
            <View style={styles.experienceRow}>
              <Text style={styles.experienceLabel}>Seating</Text>
              <Text style={styles.experienceValue}>
                {[attendance.section, attendance.seat_info].filter(Boolean).join(' - ')}
              </Text>
            </View>
          )}

          {/* Ticket Price */}
          {attendance.ticket_price && (
            <View style={styles.experienceRow}>
              <Text style={styles.experienceLabel}>Ticket Price</Text>
              <Text style={styles.experienceValue}>
                ${attendance.ticket_price.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Went With */}
          {((attendance.went_with && attendance.went_with.length > 0) ||
            (attendance.went_with_user_ids && attendance.went_with_user_ids.length > 0)) && (
            <TaggedUsersList
              userIds={attendance.went_with_user_ids}
              textNames={attendance.went_with}
            />
          )}

          {/* Notes */}
          {attendance.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.experienceLabel}>Notes</Text>
              <Text style={styles.notesText}>{attendance.notes}</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Photos */}
      {attendance.photo_urls && attendance.photo_urls.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {attendance.photo_urls.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.photo} />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, attendance.is_favorite && styles.actionButtonActive]}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={attendance.is_favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={attendance.is_favorite ? colors.error : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionButtonText,
              attendance.is_favorite && styles.actionButtonTextActive,
            ]}
          >
            {attendance.is_favorite ? 'Favorited' : 'Favorite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <Ionicons name="pencil-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  header: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  competition: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  round: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  matchCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogoContainer: {
    marginBottom: spacing.sm,
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  teamLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  teamName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  scoreColumn: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  score: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scoreDivider: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
  vs: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  infoCard: {
    margin: spacing.lg,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  experienceLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  experienceValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  notesContainer: {
    paddingTop: spacing.md,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButtonActive: {},
  actionButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionButtonTextActive: {
    color: colors.error,
  },
});
