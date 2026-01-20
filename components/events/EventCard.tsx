import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/dates';
import { getSportColor } from '@/constants/sports';
import type { EventWithDetails, AttendedEventWithDetails } from '@/types';

interface EventCardProps {
  event: EventWithDetails;
  attendance?: AttendedEventWithDetails;
  onPress?: () => void;
  compact?: boolean;
  mini?: boolean;
}

export function EventCard({ event, attendance, onPress, compact = false, mini = false }: EventCardProps) {
  const sportColor = getSportColor(event.sport?.name?.toLowerCase() || '');

  // Mini version - very compact single line style
  if (mini) {
    return (
      <Card onPress={onPress} style={styles.miniContainer}>
        <View style={[styles.miniSportIndicator, { backgroundColor: sportColor }]} />
        <View style={styles.miniContent}>
          <View style={styles.miniTop}>
            <View style={styles.miniMeta}>
              <Badge label={event.sport?.name || 'Sport'} size="sm" color={sportColor} />
              {event.competition && (
                <Text style={styles.miniCompetition} numberOfLines={1}>{event.competition}</Text>
              )}
            </View>
            {attendance?.rating && (
              <View style={styles.miniRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= attendance.rating! ? 'star' : 'star-outline'}
                    size={12}
                    color={colors.gold}
                  />
                ))}
              </View>
            )}
          </View>
          <View style={styles.miniBottom}>
            <Text style={styles.miniTeams} numberOfLines={1}>
              {event.home_team?.short_name || event.home_team?.name || 'Home'} vs {event.away_team?.short_name || event.away_team?.name || 'Away'}
            </Text>
            {(event.home_score !== null && event.away_score !== null) && (
              <Text style={styles.miniScore}>{event.home_score} - {event.away_score}</Text>
            )}
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={[styles.sportIndicator, { backgroundColor: sportColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Badge
              label={event.sport?.name || 'Sport'}
              size="sm"
              color={sportColor}
            />
            {event.competition && (
              <Text style={styles.competition}>{event.competition}</Text>
            )}
          </View>
          <Text style={styles.headerDate}>{formatDate(event.event_date)}</Text>
        </View>

        <View style={styles.teams}>
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
              {event.home_team?.name || 'Home Team'}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            {event.home_score && event.away_score ? (
              <>
                <Text style={styles.score}>{event.home_score}</Text>
                <Text style={styles.scoreDivider}>-</Text>
                <Text style={styles.score}>{event.away_score}</Text>
              </>
            ) : (
              <Text style={styles.vs}>vs</Text>
            )}
          </View>

          <View style={[styles.team, styles.teamRight]}>
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
              {event.away_team?.name || 'Away Team'}
            </Text>
          </View>
        </View>

        {!compact && (event.event_time || event.venue?.name) && (
          <View style={styles.details}>
            {event.event_time && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{formatTime(event.event_time)}</Text>
              </View>
            )}
            {event.venue?.name && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {event.venue.name}
                </Text>
              </View>
            )}
          </View>
        )}

        {attendance && (
          <View style={styles.attendanceInfo}>
            {attendance.rating && (
              <View style={styles.rating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= attendance.rating! ? 'star' : 'star-outline'}
                    size={14}
                    color={colors.gold}
                  />
                ))}
              </View>
            )}
            {attendance.is_favorite && (
              <Ionicons name="heart" size={16} color={colors.error} />
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Mini styles
  miniContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  miniSportIndicator: {
    width: 3,
  },
  miniContent: {
    flex: 1,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  miniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  miniTeams: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  miniScore: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  miniBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  miniCompetition: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  miniRating: {
    flexDirection: 'row',
    gap: 1,
  },

  // Regular styles
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sportIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  competition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamRight: {
    alignItems: 'center',
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
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.lg,
  },
  teamName: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  score: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scoreDivider: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  vs: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
});
