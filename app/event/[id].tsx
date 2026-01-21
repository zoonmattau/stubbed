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
  Share,
  Linking,
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

  // Calculate winner info
  const isCricket = event.sport?.name?.toLowerCase() === 'cricket';
  const parseScore = (score: string | number | null | undefined): number => {
    if (score === null || score === undefined) return 0;
    const scoreStr = String(score);
    if (isCricket) {
      if (scoreStr.includes('+')) {
        return scoreStr.split('+').reduce((total, inning) => {
          const runs = inning.includes('/') ? parseInt(inning.split('/')[0], 10) : parseInt(inning, 10);
          return total + (runs || 0);
        }, 0);
      }
      if (scoreStr.includes('/')) {
        return parseInt(scoreStr.split('/')[0], 10) || 0;
      }
    }
    return parseInt(scoreStr, 10) || 0;
  };

  const homeScoreNum = parseScore(event.home_score);
  const awayScoreNum = parseScore(event.away_score);
  const hasScore = event.home_score !== null && event.away_score !== null;
  const homeWon = hasScore && homeScoreNum > awayScoreNum;
  const awayWon = hasScore && awayScoreNum > homeScoreNum;
  const isDraw = hasScore && homeScoreNum === awayScoreNum;
  const margin = Math.abs(homeScoreNum - awayScoreNum);
  const winnerName = homeWon
    ? (event.home_team?.name || 'Home')
    : (event.away_team?.name || 'Away');

  // Format cricket scores to show innings nicely
  const formatCricketScore = (score: string | number | null | undefined): { total: number; innings: string[] } => {
    if (score === null || score === undefined) return { total: 0, innings: [] };
    const scoreStr = String(score);
    if (scoreStr.includes('+')) {
      const parts = scoreStr.split('+').map(s => s.trim());
      const total = parts.reduce((sum, inning) => {
        const runs = inning.includes('/') ? parseInt(inning.split('/')[0], 10) : parseInt(inning, 10);
        return sum + (runs || 0);
      }, 0);
      return { total, innings: parts };
    }
    return { total: parseScore(score), innings: [scoreStr] };
  };

  const homeScoreData = isCricket ? formatCricketScore(event.home_score) : null;
  const awayScoreData = isCricket ? formatCricketScore(event.away_score) : null;
  const isTestMatch = isCricket && homeScoreData && homeScoreData.innings.length > 1;

  const handleToggleFavorite = async () => {
    await updateAttendedEvent(attendance.id, { is_favorite: !attendance.is_favorite });
  };

  const handleDelete = () => {
    const doDelete = async () => {
      const result = await deleteAttendedEvent(attendance.id);
      if (result.success) {
        handleBack();
      } else {
        const errorMsg = result.error || 'Failed to delete event. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
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

  const handleShare = async () => {
    const homeTeam = event.home_team?.name || event.home_team_name || 'Home';
    const awayTeam = event.away_team?.name || event.away_team_name || 'Away';
    const venue = event.venue?.name || event.venue_name || '';
    const date = formatDate(event.event_date);
    const score = hasScore ? `${event.home_score} - ${event.away_score}` : '';

    const message = `I attended ${homeTeam} vs ${awayTeam}${score ? ` (${score})` : ''} at ${venue} on ${date}! Tracked with Stubbed - Sports Attendance Tracker`;

    if (Platform.OS === 'web') {
      // Web share or copy to clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${homeTeam} vs ${awayTeam}`,
            text: message,
          });
        } catch (error) {
          // User cancelled or error
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(message);
          window.alert('Copied to clipboard!');
        } catch (error) {
          window.alert('Unable to share. Copy this:\n\n' + message);
        }
      }
    } else {
      // Native share
      try {
        await Share.share({
          message,
          title: `${homeTeam} vs ${awayTeam}`,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook') => {
    const homeTeam = event.home_team?.name || event.home_team_name || 'Home';
    const awayTeam = event.away_team?.name || event.away_team_name || 'Away';
    const venue = event.venue?.name || event.venue_name || '';
    const date = formatDate(event.event_date);
    const score = hasScore ? `${event.home_score} - ${event.away_score}` : '';

    const message = `I attended ${homeTeam} vs ${awayTeam}${score ? ` (${score})` : ''} at ${venue} on ${date}!`;
    const encodedMessage = encodeURIComponent(message);

    let url = '';
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`;
    }

    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with sport color */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <View style={styles.headerContent}>
          <Badge label={event.sport?.name || 'Sport'} size="md" color={`${sportColor}dd`} />
        </View>
      </View>

      {/* Teams & Score */}
      <Card style={styles.matchCard}>
        {/* Competition & Round - moved up */}
        {(event.competition || event.round) && (
          <View style={styles.matchHeader}>
            {event.competition && (
              <Text style={styles.matchCompetition}>{event.competition}</Text>
            )}
            {event.round && (
              <Text style={styles.matchRound}>{event.round}</Text>
            )}
          </View>
        )}

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
            {hasScore ? (
              <>
                {isTestMatch && homeScoreData && awayScoreData ? (
                  /* Test cricket with multiple innings */
                  <View style={styles.cricketScoresContainer}>
                    <View style={styles.cricketScoreColumn}>
                      {homeScoreData.innings.map((inn, i) => (
                        <Text key={i} style={[styles.cricketInning, homeWon && styles.cricketInningWinner]}>
                          {inn}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.cricketDivider}>v</Text>
                    <View style={styles.cricketScoreColumn}>
                      {awayScoreData.innings.map((inn, i) => (
                        <Text key={i} style={[styles.cricketInning, awayWon && styles.cricketInningWinner]}>
                          {inn}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : (
                  /* Standard score display */
                  <View style={styles.scoreRow}>
                    <Text style={[styles.score, homeWon && styles.scoreWinner, awayWon && styles.scoreLoser]}>
                      {event.home_score}
                    </Text>
                    <Text style={styles.scoreDivider}>-</Text>
                    <Text style={[styles.score, awayWon && styles.scoreWinner, homeWon && styles.scoreLoser]}>
                      {event.away_score}
                    </Text>
                  </View>
                )}
                {isDraw ? (
                  <Text style={styles.resultText}>Draw</Text>
                ) : (
                  <Text style={styles.resultText}>
                    {winnerName} won by {margin}{isCricket ? ' runs' : ''}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.vs}>VS</Text>
            )}
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

        {/* Quick user data summary */}
        <View style={styles.matchFooter}>
          {/* Supported Team */}
          {attendance.supported_team && (
            <View style={styles.matchFooterItem}>
              <Ionicons
                name={attendance.result === 'win' ? 'trophy' : attendance.result === 'loss' ? 'sad' : 'remove'}
                size={16}
                color={attendance.result === 'win' ? colors.gold : attendance.result === 'loss' ? colors.error : colors.textSecondary}
              />
              <Text style={[
                styles.matchFooterText,
                attendance.result === 'win' && { color: colors.gold, fontWeight: fontWeight.semibold },
                attendance.result === 'loss' && { color: colors.error },
              ]}>
                {attendance.supported_team === 'home'
                  ? event.home_team?.short_name || 'Home'
                  : attendance.supported_team === 'away'
                  ? event.away_team?.short_name || 'Away'
                  : 'Neutral'}
                {attendance.result && ` (${attendance.result})`}
              </Text>
            </View>
          )}

          {/* Rating */}
          {attendance.rating && (
            <View style={styles.matchFooterItem}>
              <StarRating rating={attendance.rating} size={16} readonly />
            </View>
          )}

          {/* Went With */}
          {((attendance.went_with && attendance.went_with.length > 0) ||
            (attendance.went_with_user_ids && attendance.went_with_user_ids.length > 0)) && (
            <View style={styles.matchFooterItem}>
              <Ionicons name="people" size={16} color={colors.textSecondary} />
              <Text style={styles.matchFooterText}>
                {attendance.went_with_user_ids?.length || attendance.went_with?.length || 0} people
              </Text>
            </View>
          )}

          {/* Section/Seating */}
          {attendance.section && (
            <View style={styles.matchFooterItem}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={styles.matchFooterText}>{attendance.section}</Text>
            </View>
          )}
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
          {/* Supported Team & Result */}
          {attendance.supported_team && (
            <View style={styles.experienceRow}>
              <Text style={styles.experienceLabel}>Supporting</Text>
              <View style={styles.experienceValueRow}>
                <Text style={[
                  styles.experienceValue,
                  attendance.result === 'win' && { color: colors.success },
                  attendance.result === 'loss' && { color: colors.error },
                ]}>
                  {attendance.supported_team === 'home'
                    ? event.home_team?.name || 'Home Team'
                    : attendance.supported_team === 'away'
                    ? event.away_team?.name || 'Away Team'
                    : 'Neutral'}
                </Text>
                {attendance.result && (
                  <Badge
                    label={attendance.result.toUpperCase()}
                    size="sm"
                    color={attendance.result === 'win' ? colors.success : attendance.result === 'loss' ? colors.error : colors.textSecondary}
                  />
                )}
              </View>
            </View>
          )}

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

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.info} />
          <Text style={[styles.actionButtonText, { color: colors.info }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Social Share */}
      <View style={styles.socialShare}>
        <Text style={styles.socialShareTitle}>Share on Social Media</Text>
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}
            onPress={() => handleSocialShare('twitter')}
          >
            <Ionicons name="logo-twitter" size={20} color={colors.white} />
            <Text style={styles.socialButtonText}>Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
            onPress={() => handleSocialShare('facebook')}
          >
            <Ionicons name="logo-facebook" size={20} color={colors.white} />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  matchCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
  },
  matchHeader: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matchCompetition: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  matchRound: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchFooterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scoreWinner: {
    color: colors.primary,
  },
  scoreLoser: {
    color: colors.textMuted,
  },
  scoreDivider: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  resultText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  vs: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  // Cricket-specific styles
  cricketScoresContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cricketScoreColumn: {
    alignItems: 'center',
  },
  cricketInning: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  cricketInningWinner: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  cricketTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cricketTotalWinner: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  cricketDivider: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
  experienceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  socialShare: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialShareTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  socialButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
});
