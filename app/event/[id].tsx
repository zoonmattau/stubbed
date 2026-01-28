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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Button, StarRating, Avatar } from '@/components/ui';
import { TaggedUsersList } from '@/components/social/TaggedUsersList';
import { ConflictResolver } from '@/components/events/ConflictResolver';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import { useReviews } from '@/hooks/useReviews';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate, formatTime, parseLocalDate } from '@/utils/dates';
import { getSportColor, getSportById, SPORTS } from '@/constants/sports';
import { parseTennisScore } from '@/utils/scores';
import type { AttendedEventWithDetails, ReviewWithDetails, Event } from '@/types';

// Helper to get display name from sport code
function getSportDisplayName(sportCode: string | null | undefined): string {
  if (!sportCode) return 'Sport';
  // Try to find in SPORTS constant
  const sport = SPORTS.find(s => s.id.toLowerCase() === sportCode.toLowerCase());
  if (sport) return sport.name;
  // Fallback: capitalize first letter
  return sportCode.charAt(0).toUpperCase() + sportCode.slice(1);
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { attendedEvents, updateAttendedEvent, deleteAttendedEvent, fetchAttendedEvents, addAttendedEvent, isLoading } = useEventsStore();
  const { getTeamLogo } = useTeamLogos();
  const { getReviewForAttendedEvent, getEventReviews } = useReviews();

  const [attendance, setAttendance] = useState<AttendedEventWithDetails | null>(null);
  const [publicEvent, setPublicEvent] = useState<Event | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);
  const [publicReviews, setPublicReviews] = useState<ReviewWithDetails[]>([]);
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [fetchingPublicEvent, setFetchingPublicEvent] = useState(false);

  // Public event stats
  const [eventStats, setEventStats] = useState<{
    attendeeCount: number;
    avgRating: number | null;
    avgAtmosphere: number | null;
  }>({ attendeeCount: 0, avgRating: null, avgAtmosphere: null });
  const [attendees, setAttendees] = useState<Array<{
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }>>([]);
  const [attendeePhotos, setAttendeePhotos] = useState<string[]>([]);

  // Went with profiles (for own events)
  const [wentWithProfiles, setWentWithProfiles] = useState<Array<{
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }>>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  // Fetch events on mount if not loaded (e.g., page refresh)
  useEffect(() => {
    if (user?.id && attendedEvents.length === 0 && !hasFetched && !isLoading) {
      setHasFetched(true);
      fetchAttendedEvents(user.id);
    }
  }, [user?.id, attendedEvents.length, hasFetched, isLoading, fetchAttendedEvents]);

  useEffect(() => {
    const found = attendedEvents.find((e) => e.event_id === id);
    setAttendance(found || null);

    // If not in user's events, fetch public event data
    if (!found && id && !fetchingPublicEvent) {
      setFetchingPublicEvent(true);
      fetchPublicEvent();
    }
  }, [id, attendedEvents]);

  // Fetch public event data (for viewing others' events)
  const fetchPublicEvent = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          sport:sports(*),
          home_team:teams!events_home_team_id_fkey(*),
          away_team:teams!events_away_team_id_fkey(*),
          venue:venues(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPublicEvent(data);
    } catch (err) {
      console.error('Error fetching public event:', err);
    } finally {
      setFetchingPublicEvent(false);
    }
  };

  // Fetch event stats for public events
  const fetchEventStats = async () => {
    if (!id) return;
    try {
      // Get attendees with their profiles
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('attended_events')
        .select(`
          user_id,
          rating,
          atmosphere_rating,
          photo_urls,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('event_id', id)
        .limit(20);

      if (!attendeesError && attendeesData) {
        // Calculate stats
        const ratings = attendeesData.filter(a => a.rating).map(a => a.rating as number);
        const atmospheres = attendeesData.filter(a => a.atmosphere_rating).map(a => a.atmosphere_rating as number);

        setEventStats({
          attendeeCount: attendeesData.length,
          avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
          avgAtmosphere: atmospheres.length > 0 ? atmospheres.reduce((a, b) => a + b, 0) / atmospheres.length : null,
        });

        // Get unique attendees with profiles (exclude current user)
        const uniqueAttendees = attendeesData
          .filter(a => a.profiles && a.user_id !== user?.id)
          .map(a => ({
            user_id: a.user_id,
            username: (a.profiles as any).username,
            display_name: (a.profiles as any).display_name,
            avatar_url: (a.profiles as any).avatar_url,
          }))
          .slice(0, 10);
        setAttendees(uniqueAttendees);

        // Collect all photos
        const allPhotos = attendeesData
          .filter(a => a.photo_urls && a.photo_urls.length > 0)
          .flatMap(a => a.photo_urls as string[])
          .slice(0, 6);
        setAttendeePhotos(allPhotos);
      }
    } catch (err) {
      console.error('Error fetching event stats:', err);
    }
  };

  // Fetch stats for all events (social feature)
  useEffect(() => {
    if (id) {
      fetchEventStats();
    }
  }, [id, user?.id]);

  // Fetch went with profiles for own events
  useEffect(() => {
    const fetchWentWithProfiles = async () => {
      if (!attendance?.went_with_user_ids || attendance.went_with_user_ids.length === 0) {
        setWentWithProfiles([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', attendance.went_with_user_ids);

        if (!error && data) {
          setWentWithProfiles(data.map(p => ({
            user_id: p.id,
            username: p.username,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
          })));
        }
      } catch (err) {
        console.error('Error fetching went with profiles:', err);
      }
    };

    if (attendance) {
      fetchWentWithProfiles();
    }
  }, [attendance?.went_with_user_ids]);

  // Handle "I Was There" - add event to user's attendance
  const handleIWasThere = async () => {
    if (!user || !publicEvent) return;

    setIsAddingAttendance(true);
    try {
      const result = await addAttendedEvent(
        user.id,
        {
          id: publicEvent.id,  // Use 'id' not 'event_id' - store checks for this
          sport_id: publicEvent.sport_id,
          event_date: publicEvent.event_date,
          home_team_name: publicEvent.home_team?.name || publicEvent.home_team_name,
          away_team_name: publicEvent.away_team?.name || publicEvent.away_team_name,
          venue_name: publicEvent.venue?.name || publicEvent.venue_name,
          home_score: publicEvent.home_score || undefined,
          away_score: publicEvent.away_score || undefined,
          competition: publicEvent.competition || undefined,
        },
        {}
      );

      if (result.success && result.attendedEventId) {
        // Refresh attended events to get the new attendance
        await fetchAttendedEvents(user.id);
        // Navigate to edit page so user can add their details
        router.push(`/event/edit/${result.attendedEventId}`);
      } else {
        throw new Error(result.error || 'Failed to add event');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to add event';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsAddingAttendance(false);
    }
  };

  // Check if user already has a review for this event
  useEffect(() => {
    const checkReview = async () => {
      if (!attendance?.id) {
        setCheckingReview(false);
        return;
      }
      setCheckingReview(true);
      const existingReview = await getReviewForAttendedEvent(attendance.id);
      setHasExistingReview(!!existingReview);
      setCheckingReview(false);
    };
    checkReview();
  }, [attendance?.id, getReviewForAttendedEvent]);

  // Fetch public reviews for this event
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      const reviews = await getEventReviews(id, 5);
      setPublicReviews(reviews);
    };
    fetchReviews();
  }, [id, getEventReviews]);

  // Show loading while fetching
  if (isLoading || fetchingPublicEvent || (!attendance && !publicEvent && !hasFetched && attendedEvents.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.notFoundText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Check if this is the user's own event or a public event
  const isOwnEvent = !!attendance;
  const event = attendance?.event || publicEvent;

  if (!event) {
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

  // Use text fields as fallback for manually entered events
  const homeTeamName = event.home_team?.name || event.home_team_name || 'Home Team';
  const awayTeamName = event.away_team?.name || event.away_team_name || 'Away Team';
  const homeTeamShort = event.home_team?.short_name || event.home_team_name || 'Home';
  const awayTeamShort = event.away_team?.short_name || event.away_team_name || 'Away';
  const venueName = event.venue?.name || event.venue_name;
  const venueCity = event.venue?.city;
  const sportName = getSportDisplayName(event.sport?.name || event.sport_name);
  const sportColor = getSportColor(sportName.toLowerCase());

  // Get logos - try FK first, then lookup by name
  const homeTeamLogo = event.home_team?.logo_url || getTeamLogo(homeTeamName);
  const awayTeamLogo = event.away_team?.logo_url || getTeamLogo(awayTeamName);

  // Calculate winner info
  const isCricket = sportName.toLowerCase() === 'cricket';
  const isTennis = sportName.toLowerCase() === 'tennis';

  // Tennis: parse from home_score field which contains "6-4, 6-3" format
  const tennisResult = isTennis ? parseTennisScore(event.home_score) : null;

  // Parse cricket score to get runs and wickets
  const parseCricketScore = (score: string | number | null | undefined): { runs: number; wickets: number } => {
    if (score === null || score === undefined) return { runs: 0, wickets: 10 };
    const scoreStr = String(score);
    if (scoreStr.includes('+')) {
      // Test match with multiple innings - sum runs, use last innings wickets
      const innings = scoreStr.split('+').map(s => s.trim());
      const totalRuns = innings.reduce((total, inning) => {
        const runs = inning.includes('/') ? parseInt(inning.split('/')[0], 10) : parseInt(inning, 10);
        return total + (runs || 0);
      }, 0);
      const lastInning = innings[innings.length - 1];
      const wickets = lastInning.includes('/') ? parseInt(lastInning.split('/')[1], 10) || 10 : 10;
      return { runs: totalRuns, wickets };
    }
    if (scoreStr.includes('/')) {
      const [runs, wickets] = scoreStr.split('/');
      return { runs: parseInt(runs, 10) || 0, wickets: parseInt(wickets, 10) || 10 };
    }
    return { runs: parseInt(scoreStr, 10) || 0, wickets: 10 };
  };

  const parseScore = (score: string | number | null | undefined): number => {
    if (score === null || score === undefined) return 0;
    const scoreStr = String(score);
    if (isCricket) {
      return parseCricketScore(score).runs;
    }
    return parseInt(scoreStr, 10) || 0;
  };

  const homeScoreNum = parseScore(event.home_score);
  const awayScoreNum = parseScore(event.away_score);

  // For cricket: parse wickets to determine win type
  // Convention: home team bats first, so if away wins, they won by wickets
  const homeCricketScore = isCricket ? parseCricketScore(event.home_score) : null;
  const awayCricketScore = isCricket ? parseCricketScore(event.away_score) : null;

  // Tennis uses different logic: winner by sets won
  const hasScore = isTennis
    ? tennisResult !== null && tennisResult.sets.length > 0
    : event.home_score !== null && event.away_score !== null;
  const homeWon = isTennis
    ? tennisResult?.winner === 'home'
    : hasScore && homeScoreNum > awayScoreNum;
  const awayWon = isTennis
    ? tennisResult?.winner === 'away'
    : hasScore && awayScoreNum > homeScoreNum;
  const isDraw = isTennis
    ? tennisResult?.winner === 'draw'
    : hasScore && homeScoreNum === awayScoreNum;

  // Calculate margin/wickets for result text
  const getCricketResultText = (): string => {
    if (!homeCricketScore || !awayCricketScore) return '';
    if (homeWon) {
      // Home team batted first and won = won by runs
      return `${Math.abs(homeScoreNum - awayScoreNum)} runs`;
    } else if (awayWon) {
      // Away team batted second and won = won by wickets remaining
      const wicketsRemaining = 10 - awayCricketScore.wickets;
      return `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    }
    return '';
  };

  const margin = isTennis
    ? Math.abs((tennisResult?.player1Sets || 0) - (tennisResult?.player2Sets || 0))
    : Math.abs(homeScoreNum - awayScoreNum);
  const winnerName = homeWon ? homeTeamShort : awayTeamShort;

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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Badge label={sportName} size="md" color={`${sportColor}dd`} />
        </View>
      </View>

      {/* Conflict Resolution Banner (if there are data conflicts) - only for own events */}
      {isOwnEvent && attendance && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <ConflictResolver
            eventId={attendance.event_id}
            attendanceId={attendance.id}
            onResolved={() => {
              // Refresh data after conflict resolution
              if (user?.id) {
                fetchAttendedEvents(user.id);
              }
            }}
          />
        </View>
      )}

      {/* "I Was There" Button - for public events the user hasn't added yet */}
      {!isOwnEvent && user && (
        <View style={styles.iWasThereSection}>
          <TouchableOpacity
            style={styles.iWasThereButton}
            onPress={handleIWasThere}
            disabled={isAddingAttendance}
          >
            {isAddingAttendance ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="hand-left" size={24} color={colors.white} />
                <Text style={styles.iWasThereText}>I Was There Too!</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.iWasThereHint}>Add this event to your attendance history</Text>
        </View>
      )}

      {/* Community Stats - show for all events */}
      {eventStats.attendeeCount > 0 && (
        <Card style={styles.publicStatsCard}>
          <View style={styles.publicStatsRow}>
            <View style={styles.publicStatItem}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={styles.publicStatValue}>{eventStats.attendeeCount}</Text>
              <Text style={styles.publicStatLabel}>Attended</Text>
            </View>
            {eventStats.avgRating && (
              <View style={styles.publicStatItem}>
                <Ionicons name="star" size={24} color={colors.gold} />
                <Text style={styles.publicStatValue}>{eventStats.avgRating.toFixed(1)}</Text>
                <Text style={styles.publicStatLabel}>Avg Rating</Text>
              </View>
            )}
            {eventStats.avgAtmosphere && (
              <View style={styles.publicStatItem}>
                <Ionicons name="flame" size={24} color={colors.secondary} />
                <Text style={styles.publicStatValue}>{eventStats.avgAtmosphere.toFixed(1)}</Text>
                <Text style={styles.publicStatLabel}>Atmosphere</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Who Was There - all attendees (community) */}
      {attendees.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Also Attended</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.attendeesRow}>
              {attendees.map((attendee) => (
                <TouchableOpacity
                  key={attendee.user_id}
                  style={styles.attendeeItem}
                  onPress={() => router.push(`/profile/${attendee.user_id}`)}
                >
                  <Avatar
                    uri={attendee.avatar_url || undefined}
                    name={attendee.display_name || attendee.username}
                    size={50}
                  />
                  <Text style={styles.attendeeName} numberOfLines={1}>
                    {attendee.display_name || attendee.username}
                  </Text>
                </TouchableOpacity>
              ))}
              {eventStats.attendeeCount > attendees.length && (
                <View style={styles.moreAttendeesItem}>
                  <View style={styles.moreAttendeesCircle}>
                    <Text style={styles.moreAttendeesText}>
                      +{eventStats.attendeeCount - attendees.length}
                    </Text>
                  </View>
                  <Text style={styles.attendeeName}>more</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Fan Photos - photos from all attendees */}
      {attendeePhotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fan Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.fanPhotosRow}>
              {attendeePhotos.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.fanPhoto} />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* My Group - people you went with (own events only) */}
      {isOwnEvent && (wentWithProfiles.length > 0 || (attendance?.went_with && attendance.went_with.length > 0)) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.attendeesRow}>
              {wentWithProfiles.map((profile) => (
                <TouchableOpacity
                  key={profile.user_id}
                  style={styles.attendeeItem}
                  onPress={() => router.push(`/profile/${profile.user_id}`)}
                >
                  <Avatar
                    uri={profile.avatar_url || undefined}
                    name={profile.display_name || profile.username}
                    size={50}
                  />
                  <Text style={styles.attendeeName} numberOfLines={1}>
                    {profile.display_name || profile.username}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Show text-only names (non-users) */}
              {attendance?.went_with?.map((name, index) => (
                <View key={`text-${index}`} style={styles.attendeeItem}>
                  <View style={styles.textOnlyAvatar}>
                    <Text style={styles.textOnlyAvatarText}>{name[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.attendeeName} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

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
          <TouchableOpacity
            style={styles.teamColumn}
            onPress={() => router.push(`/team/${encodeURIComponent(homeTeamName)}`)}
          >
            <View style={styles.teamLogoContainer}>
              {homeTeamLogo ? (
                <Image
                  source={{ uri: homeTeamLogo }}
                  style={styles.teamLogo}
                />
              ) : (
                <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                  <Text style={styles.teamLogoText}>
                    {homeTeamShort[0]}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.teamName, styles.teamNameClickable]}>{homeTeamName}</Text>
          </TouchableOpacity>

          <View style={styles.scoreColumn}>
            {attendance?.is_abandoned ? (
              <View style={styles.abandonedContainer}>
                <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
                <Text style={styles.abandonedText}>Abandoned</Text>
              </View>
            ) : hasScore ? (
              <>
                {isTennis && tennisResult ? (
                  /* Tennis score display - show sets */
                  <View style={styles.tennisScoreContainer}>
                    {tennisResult.sets.map((set, i) => (
                      <Text key={i} style={[
                        styles.tennisSet,
                        set.winner === 'home' && styles.tennisSetHomeWon,
                        set.winner === 'away' && styles.tennisSetAwayWon,
                      ]}>
                        {set.player1}-{set.player2}
                      </Text>
                    ))}
                  </View>
                ) : isTestMatch && homeScoreData && awayScoreData ? (
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
                    {winnerName} won{isTennis
                      ? ` ${tennisResult?.player1Sets}-${tennisResult?.player2Sets}`
                      : isCricket
                      ? ` by ${getCricketResultText()}`
                      : ` by ${margin}`}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.vs}>VS</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.teamColumn}
            onPress={() => router.push(`/team/${encodeURIComponent(awayTeamName)}`)}
          >
            <View style={styles.teamLogoContainer}>
              {awayTeamLogo ? (
                <Image
                  source={{ uri: awayTeamLogo }}
                  style={styles.teamLogo}
                />
              ) : (
                <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                  <Text style={styles.teamLogoText}>
                    {awayTeamShort[0]}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.teamName, styles.teamNameClickable]}>{awayTeamName}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick user data summary - only for own events, or just venue for public */}
        <View style={styles.matchFooter}>
          {/* Supported Team - own events only */}
          {isOwnEvent && attendance?.supported_team && (
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
                  ? homeTeamShort
                  : attendance.supported_team === 'away'
                  ? awayTeamShort
                  : 'Neutral'}
                {attendance.result && ` (${attendance.result})`}
              </Text>
            </View>
          )}

          {/* Rating - own events only */}
          {isOwnEvent && attendance?.rating && (
            <View style={styles.matchFooterItem}>
              <StarRating rating={attendance.rating} size={16} readonly />
            </View>
          )}

          {/* Went With - own events only */}
          {isOwnEvent && ((attendance?.went_with && attendance.went_with.length > 0) ||
            (attendance?.went_with_user_ids && attendance.went_with_user_ids.length > 0)) && (
            <View style={styles.matchFooterItem}>
              <Ionicons name="people" size={16} color={colors.textSecondary} />
              <Text style={styles.matchFooterText}>
                {attendance.went_with_user_ids?.length || attendance.went_with?.length || 0} people
              </Text>
            </View>
          )}

          {/* Venue/Stadium - always show */}
          {venueName && (
            <View style={styles.matchFooterItem}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={styles.matchFooterText}>{venueName}</Text>
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
        {venueName && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {venueName}
              {venueCity && `, ${venueCity}`}
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

      {/* Your Experience - only for own events */}
      {isOwnEvent && attendance && (
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
                    ? homeTeamName
                    : attendance.supported_team === 'away'
                    ? awayTeamName
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
      )}

      {/* Photos - only for own events */}
      {isOwnEvent && attendance && attendance.photo_urls && attendance.photo_urls.length > 0 && (
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

      {/* Write Review Button - only show if no existing review and own event */}
      {isOwnEvent && attendance && !checkingReview && !hasExistingReview && (
        <View style={styles.reviewSection}>
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => router.push(`/event/review/${attendance.id}`)}
          >
            <Ionicons name="create-outline" size={24} color={colors.white} />
            <Text style={styles.writeReviewText}>Write a Public Review</Text>
          </TouchableOpacity>
          <Text style={styles.reviewHint}>Share your experience with the community</Text>
        </View>
      )}

      {/* Already reviewed indicator - only for own events */}
      {isOwnEvent && !checkingReview && hasExistingReview && (
        <View style={styles.reviewSection}>
          <View style={styles.reviewedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.reviewedText}>Review Published</Text>
          </View>
          <Text style={styles.reviewHint}>Your review is visible on the Explore feed</Text>
        </View>
      )}

      {/* Public Reviews Section */}
      {publicReviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Reviews</Text>
          <Card>
            {publicReviews.map((review, index) => (
              <View
                key={review.review_id}
                style={[
                  styles.reviewItem,
                  index < publicReviews.length - 1 && styles.reviewItemBorder,
                ]}
              >
                <View style={styles.reviewHeader}>
                  <Avatar
                    source={review.avatar_url}
                    name={review.display_name || review.username}
                    size="sm"
                  />
                  <View style={styles.reviewAuthor}>
                    <Text style={styles.reviewAuthorName}>
                      {review.display_name || review.username || 'Anonymous'}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {parseLocalDate(review.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {review.is_watched && ' • Watched'}
                    </Text>
                  </View>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={14} color={colors.gold} />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                {review.review_text && (
                  <Text style={styles.reviewText} numberOfLines={3}>
                    {review.review_text}
                  </Text>
                )}
                <View style={styles.reviewStats}>
                  <View style={styles.reviewStat}>
                    <Ionicons name="heart" size={14} color={colors.textMuted} />
                    <Text style={styles.reviewStatText}>{review.likes_count || 0}</Text>
                  </View>
                  <View style={styles.reviewStat}>
                    <Ionicons name="chatbubble" size={14} color={colors.textMuted} />
                    <Text style={styles.reviewStatText}>{review.comments_count || 0}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Actions - only for own events */}
      {isOwnEvent && attendance && (
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
      )}

      {/* Social Share - only for own events */}
      {isOwnEvent && (
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
      )}
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    padding: spacing.sm,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerSpacer: {
    width: 40,
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
  teamNameClickable: {
    textDecorationLine: 'underline',
    color: colors.primary,
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
  abandonedContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  abandonedText: {
    fontSize: fontSize.md,
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
  // Tennis-specific styles
  tennisScoreContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tennisSet: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  tennisSetHomeWon: {
    color: colors.primary,
  },
  tennisSetAwayWon: {
    color: colors.error,
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
  reviewSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  writeReviewText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  reviewHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.success}15`,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  reviewedText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  reviewItem: {
    paddingVertical: spacing.md,
  },
  reviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reviewAuthor: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  reviewDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewRatingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gold,
  },
  reviewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  reviewStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  reviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewStatText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  iWasThereSection: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  iWasThereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  iWasThereText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  iWasThereHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  // Public event stats
  publicStatsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  publicStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  publicStatItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  publicStatValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  publicStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // Attendees
  attendeesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  attendeeItem: {
    alignItems: 'center',
    width: 70,
  },
  attendeeName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  moreAttendeesItem: {
    alignItems: 'center',
    width: 70,
  },
  moreAttendeesCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAttendeesText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  textOnlyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOnlyAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Fan photos
  fanPhotosRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fanPhoto: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
});
