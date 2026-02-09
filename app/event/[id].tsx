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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge, Button, StarRating, Avatar } from '@/components/ui';
import { TaggedUsersList } from '@/components/social/TaggedUsersList';
import { ConflictResolver } from '@/components/events/ConflictResolver';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import { useReviews } from '@/hooks/useReviews';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/constants/theme';
import { formatDate, formatTime, parseLocalDate } from '@/utils/dates';
import { getSportColor, getSportById, SPORTS } from '@/constants/sports';
import { parseTennisScore } from '@/utils/scores';
import type { AttendedEventWithDetails, ReviewWithDetails, Event } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to get display name from sport code
function getSportDisplayName(sportCode: string | null | undefined): string {
  if (!sportCode) return 'Sport';
  const sport = SPORTS.find(s => s.id.toLowerCase() === sportCode.toLowerCase());
  if (sport) return sport.name;
  return sportCode.charAt(0).toUpperCase() + sportCode.slice(1);
}

// Helper to lighten a hex color
function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(amount * 255));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(amount * 255));
  const b = Math.min(255, (num & 0x0000FF) + Math.round(amount * 255));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
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

  // People you follow who attended
  const [followedAttendees, setFollowedAttendees] = useState<Array<{
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }>>([]);

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

  // Fetch events on mount if not loaded
  useEffect(() => {
    if (user?.id && attendedEvents.length === 0 && !hasFetched && !isLoading) {
      setHasFetched(true);
      fetchAttendedEvents(user.id);
    }
  }, [user?.id, attendedEvents.length, hasFetched, isLoading, fetchAttendedEvents]);

  useEffect(() => {
    const found = attendedEvents.find((e) => e.event_id === id);
    setAttendance(found || null);

    if (!found && id && !fetchingPublicEvent) {
      setFetchingPublicEvent(true);
      fetchPublicEvent();
    }
  }, [id, attendedEvents]);

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

  // Fetch event stats and cross-reference with following
  const fetchEventStats = async () => {
    if (!id) return;
    try {
      type AttendeeData = {
        user_id: string;
        rating: number | null;
        atmosphere_rating: number | null;
        photo_urls: string[] | null;
        profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
      };
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
        .limit(20) as { data: AttendeeData[] | null; error: any };

      if (!attendeesError && attendeesData) {
        const ratings = attendeesData.filter(a => a.rating).map(a => a.rating as number);
        const atmospheres = attendeesData.filter(a => a.atmosphere_rating).map(a => a.atmosphere_rating as number);

        setEventStats({
          attendeeCount: attendeesData.length,
          avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
          avgAtmosphere: atmospheres.length > 0 ? atmospheres.reduce((a, b) => a + b, 0) / atmospheres.length : null,
        });

        const uniqueAttendees = attendeesData
          .filter(a => a.profiles && a.user_id !== user?.id)
          .map(a => ({
            user_id: a.user_id,
            username: a.profiles!.username,
            display_name: a.profiles!.display_name,
            avatar_url: a.profiles!.avatar_url,
          }))
          .slice(0, 10);
        setAttendees(uniqueAttendees);

        const allPhotos = attendeesData
          .filter(a => a.photo_urls && a.photo_urls.length > 0)
          .flatMap(a => a.photo_urls as string[])
          .slice(0, 6);
        setAttendeePhotos(allPhotos);

        // Cross-reference with following list
        if (user?.id && uniqueAttendees.length > 0) {
          try {
            const attendeeIds = uniqueAttendees.map(a => a.user_id);
            const { data: followData } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', user.id)
              .in('following_id', attendeeIds) as { data: { following_id: string }[] | null };

            if (followData && followData.length > 0) {
              const followedIds = new Set(followData.map((f: { following_id: string }) => f.following_id));
              setFollowedAttendees(uniqueAttendees.filter(a => followedIds.has(a.user_id)));
            }
          } catch {
            // Silently fail - this is a nice-to-have feature
          }
        }
      }
    } catch (err) {
      console.error('Error fetching event stats:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventStats();
    }
  }, [id, user?.id]);

  // Fetch went with profiles
  useEffect(() => {
    const fetchWentWithProfiles = async () => {
      if (!attendance?.went_with_user_ids || attendance.went_with_user_ids.length === 0) {
        setWentWithProfiles([]);
        return;
      }

      try {
        type ProfileData = { id: string; username: string; display_name: string | null; avatar_url: string | null };
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', attendance.went_with_user_ids) as { data: ProfileData[] | null; error: any };

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

  // Handle "I Was There"
  const handleIWasThere = async () => {
    if (!user || !publicEvent) return;

    setIsAddingAttendance(true);
    try {
      const result = await addAttendedEvent(
        user.id,
        {
          id: publicEvent.id,
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
        await fetchAttendedEvents(user.id);
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

  // Check if user already has a review
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

  // Fetch public reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      const reviews = await getEventReviews(id, 5);
      setPublicReviews(reviews);
    };
    fetchReviews();
  }, [id, getEventReviews]);

  // Loading state
  if (isLoading || fetchingPublicEvent || (!attendance && !publicEvent && !hasFetched && attendedEvents.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </View>
    );
  }

  const isOwnEvent = !!attendance;
  const event = attendance?.event || publicEvent;

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.loadingText}>Event not found</Text>
          <Button title="Go Back" onPress={handleBack} variant="outline" />
        </View>
      </View>
    );
  }

  // Derived data
  const homeTeamName = event.home_team?.name || event.home_team_name || 'Home Team';
  const awayTeamName = event.away_team?.name || event.away_team_name || 'Away Team';
  const homeTeamShort = event.home_team?.short_name || event.home_team_name || 'Home';
  const awayTeamShort = event.away_team?.short_name || event.away_team_name || 'Away';
  const venueName = event.venue?.name || event.venue_name;
  const venueCity = event.venue?.city;
  const sportName = getSportDisplayName(event.sport?.name || event.sport_name);
  const sportColor = getSportColor(sportName.toLowerCase());
  const gradientEnd = lightenColor(sportColor, 0.15);

  const homeTeamLogo = event.home_team?.logo_url || getTeamLogo(homeTeamName);
  const awayTeamLogo = event.away_team?.logo_url || getTeamLogo(awayTeamName);

  // Score calculations
  const isCricket = sportName.toLowerCase() === 'cricket';
  const isTennis = sportName.toLowerCase() === 'tennis';
  const tennisResult = isTennis ? parseTennisScore(event.home_score) : null;

  const parseCricketScore = (score: string | number | null | undefined): { runs: number; wickets: number } => {
    if (score === null || score === undefined) return { runs: 0, wickets: 10 };
    const scoreStr = String(score);
    if (scoreStr.includes('+')) {
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
    if (isCricket) return parseCricketScore(score).runs;
    return parseInt(scoreStr, 10) || 0;
  };

  const homeScoreNum = parseScore(event.home_score);
  const awayScoreNum = parseScore(event.away_score);
  const homeCricketScore = isCricket ? parseCricketScore(event.home_score) : null;
  const awayCricketScore = isCricket ? parseCricketScore(event.away_score) : null;

  const hasScore = isTennis
    ? tennisResult !== null && tennisResult.sets.length > 0
    : event.home_score !== null && event.away_score !== null;
  const homeWon = isTennis ? tennisResult?.winner === 'home' : hasScore && homeScoreNum > awayScoreNum;
  const awayWon = isTennis ? tennisResult?.winner === 'away' : hasScore && awayScoreNum > homeScoreNum;
  const isDraw = isTennis ? tennisResult?.winner === 'draw' : hasScore && homeScoreNum === awayScoreNum;

  const getCricketResultText = (): string => {
    if (!homeCricketScore || !awayCricketScore) return '';
    if (homeWon) {
      return `${Math.abs(homeScoreNum - awayScoreNum)} runs`;
    } else if (awayWon) {
      const wicketsRemaining = 10 - awayCricketScore.wickets;
      return `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    }
    return '';
  };

  const margin = isTennis
    ? Math.abs((tennisResult?.player1Sets || 0) - (tennisResult?.player2Sets || 0))
    : Math.abs(homeScoreNum - awayScoreNum);
  const winnerName = homeWon ? homeTeamShort : awayTeamShort;

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

  // Handlers
  const handleToggleFavorite = async () => {
    if (!attendance) return;
    await updateAttendedEvent(attendance.id, { is_favorite: !attendance.is_favorite });
  };

  const handleDelete = () => {
    if (!attendance) return;
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
      if (confirmed) doDelete();
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
    if (!attendance) return;
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
      if (navigator.share) {
        try {
          await navigator.share({ title: `${homeTeam} vs ${awayTeam}`, text: message });
        } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(message);
          window.alert('Copied to clipboard!');
        } catch {
          window.alert('Unable to share. Copy this:\n\n' + message);
        }
      }
    } else {
      try {
        await Share.share({ message, title: `${homeTeam} vs ${awayTeam}` });
      } catch {}
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

  // Render score section (reused in hero)
  const renderScore = () => {
    if (attendance?.is_abandoned) {
      return (
        <View style={styles.abandonedContainer}>
          <Ionicons name="cloud-offline-outline" size={28} color="rgba(255,255,255,0.7)" />
          <Text style={styles.abandonedText}>Abandoned</Text>
        </View>
      );
    }

    if (!hasScore) {
      return <Text style={styles.heroVs}>VS</Text>;
    }

    if (isTennis && tennisResult) {
      return (
        <View style={styles.tennisScoreContainer}>
          {tennisResult.sets.map((set, i) => (
            <Text key={i} style={[
              styles.tennisSet,
              set.winner === 'home' && styles.tennisSetWon,
              set.winner === 'away' && styles.tennisSetLost,
            ]}>
              {set.player1}-{set.player2}
            </Text>
          ))}
        </View>
      );
    }

    if (isTestMatch && homeScoreData && awayScoreData) {
      return (
        <View style={styles.cricketScoresContainer}>
          <View style={styles.cricketScoreColumn}>
            {homeScoreData.innings.map((inn, i) => (
              <Text key={i} style={[styles.cricketInning, homeWon && styles.cricketInningWon]}>
                {inn}
              </Text>
            ))}
          </View>
          <Text style={styles.cricketDivider}>v</Text>
          <View style={styles.cricketScoreColumn}>
            {awayScoreData.innings.map((inn, i) => (
              <Text key={i} style={[styles.cricketInning, awayWon && styles.cricketInningWon]}>
                {inn}
              </Text>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.heroScoreRow}>
        <Text style={[styles.heroScore, homeWon && styles.heroScoreWinner, awayWon && styles.heroScoreDim]}>
          {event.home_score}
        </Text>
        <Text style={styles.heroScoreDivider}>-</Text>
        <Text style={[styles.heroScore, awayWon && styles.heroScoreWinner, homeWon && styles.heroScoreDim]}>
          {event.away_score}
        </Text>
      </View>
    );
  };

  const renderResultText = () => {
    if (!hasScore || attendance?.is_abandoned) return null;
    if (isDraw) {
      return <Text style={styles.heroResultText}>Draw</Text>;
    }
    return (
      <Text style={styles.heroResultText}>
        {winnerName} won{isTennis
          ? ` ${tennisResult?.player1Sets}-${tennisResult?.player2Sets}`
          : isCricket
          ? ` by ${getCricketResultText()}`
          : ` by ${margin}`}
      </Text>
    );
  };

  // Determine FAB action
  const showFab = isOwnEvent && attendance && !checkingReview && !hasExistingReview;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, showFab && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ HERO SECTION ============ */}
        <LinearGradient
          colors={[sportColor, gradientEnd, `${sportColor}dd`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroBackButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <Badge label={sportName} size="md" color="rgba(255,255,255,0.25)" />
          </View>

          {/* Competition & Round */}
          {(event.competition || event.round) && (
            <View style={styles.heroCompetitionRow}>
              {event.competition && (
                <Text style={styles.heroCompetition}>{event.competition}</Text>
              )}
              {event.round && (
                <Text style={styles.heroRound}>{event.round}</Text>
              )}
            </View>
          )}

          {/* Teams & Score */}
          <View style={styles.heroMatchup}>
            <TouchableOpacity
              style={styles.heroTeam}
              onPress={() => router.push(`/team/${encodeURIComponent(homeTeamName)}`)}
            >
              <View style={styles.heroLogoContainer}>
                {homeTeamLogo ? (
                  <Image source={{ uri: homeTeamLogo }} style={styles.heroLogo} />
                ) : (
                  <View style={styles.heroLogoPlaceholder}>
                    <Text style={styles.heroLogoText}>{homeTeamShort[0]}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTeamName} numberOfLines={2}>{homeTeamName}</Text>
            </TouchableOpacity>

            <View style={styles.heroCenter}>
              {renderScore()}
              {renderResultText()}
            </View>

            <TouchableOpacity
              style={styles.heroTeam}
              onPress={() => router.push(`/team/${encodeURIComponent(awayTeamName)}`)}
            >
              <View style={styles.heroLogoContainer}>
                {awayTeamLogo ? (
                  <Image source={{ uri: awayTeamLogo }} style={styles.heroLogo} />
                ) : (
                  <View style={styles.heroLogoPlaceholder}>
                    <Text style={styles.heroLogoText}>{awayTeamShort[0]}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTeamName} numberOfLines={2}>{awayTeamName}</Text>
            </TouchableOpacity>
          </View>

          {/* User's result badge in hero */}
          {isOwnEvent && attendance?.supported_team && attendance?.result && (
            <View style={styles.heroUserResult}>
              <Ionicons
                name={attendance.result === 'win' ? 'trophy' : attendance.result === 'loss' ? 'sad-outline' : 'remove-circle-outline'}
                size={16}
                color={colors.white}
              />
              <Text style={styles.heroUserResultText}>
                You supported {attendance.supported_team === 'home' ? homeTeamShort : attendance.supported_team === 'away' ? awayTeamShort : 'Neutral'}
                {' '}({attendance.result})
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* ============ QUICK STATS BAR ============ */}
        {eventStats.attendeeCount > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statPill}>
              <Ionicons name="people" size={18} color={sportColor} />
              <Text style={styles.statPillValue}>{eventStats.attendeeCount}</Text>
              <Text style={styles.statPillLabel}>Attended</Text>
            </View>
            {eventStats.avgRating && (
              <View style={styles.statPill}>
                <Ionicons name="star" size={18} color={colors.gold} />
                <Text style={styles.statPillValue}>{eventStats.avgRating.toFixed(1)}</Text>
                <Text style={styles.statPillLabel}>Rating</Text>
              </View>
            )}
            {eventStats.avgAtmosphere && (
              <View style={styles.statPill}>
                <Ionicons name="flame" size={18} color={colors.secondary} />
                <Text style={styles.statPillValue}>{eventStats.avgAtmosphere.toFixed(1)}</Text>
                <Text style={styles.statPillLabel}>Atmosphere</Text>
              </View>
            )}
            {isOwnEvent && attendance?.rating && (
              <View style={styles.statPill}>
                <Ionicons name="person" size={18} color={colors.primary} />
                <Text style={styles.statPillValue}>{attendance.rating}</Text>
                <Text style={styles.statPillLabel}>Your Rating</Text>
              </View>
            )}
          </View>
        )}

        {/* ============ EVENT INFO CHIPS ============ */}
        <View style={styles.infoChipsRow}>
          <View style={styles.infoChip}>
            <Ionicons name="calendar" size={14} color={sportColor} />
            <Text style={styles.infoChipText}>{formatDate(event.event_date)}</Text>
          </View>
          {event.event_time && (
            <View style={styles.infoChip}>
              <Ionicons name="time" size={14} color={sportColor} />
              <Text style={styles.infoChipText}>{formatTime(event.event_time)}</Text>
            </View>
          )}
          {venueName && (
            <View style={styles.infoChip}>
              <Ionicons name="location" size={14} color={sportColor} />
              <Text style={styles.infoChipText}>{venueName}{venueCity ? `, ${venueCity}` : ''}</Text>
            </View>
          )}
          {event.season && (
            <View style={styles.infoChip}>
              <Ionicons name="flag" size={14} color={sportColor} />
              <Text style={styles.infoChipText}>Season {event.season}</Text>
            </View>
          )}
        </View>

        {/* ============ CONFLICT RESOLVER ============ */}
        {isOwnEvent && attendance && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ConflictResolver
              eventId={attendance.event_id}
              attendanceId={attendance.id}
              onResolved={() => {
                if (user?.id) fetchAttendedEvents(user.id);
              }}
            />
          </View>
        )}

        {/* ============ "I WAS THERE" BUTTON ============ */}
        {!isOwnEvent && user && (
          <View style={styles.iWasThereSection}>
            <TouchableOpacity
              style={[styles.iWasThereButton, { backgroundColor: sportColor }]}
              onPress={handleIWasThere}
              disabled={isAddingAttendance}
              activeOpacity={0.8}
            >
              {isAddingAttendance ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="hand-left" size={22} color={colors.white} />
                  <Text style={styles.iWasThereText}>I Was There Too!</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.iWasThereHint}>Add this event to your attendance history</Text>
          </View>
        )}

        {/* ============ PEOPLE YOU FOLLOW WERE HERE ============ */}
        {followedAttendees.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.followedCard, { borderLeftColor: sportColor }]}>
              <View style={styles.followedHeader}>
                <Ionicons name="people-circle" size={22} color={sportColor} />
                <Text style={styles.followedTitle}>
                  {followedAttendees.length} {followedAttendees.length === 1 ? 'person' : 'people'} you follow {followedAttendees.length === 1 ? 'was' : 'were'} here
                </Text>
              </View>
              <View style={styles.followedAvatars}>
                {followedAttendees.slice(0, 5).map((attendee) => (
                  <TouchableOpacity
                    key={attendee.user_id}
                    onPress={() => router.push(`/profile/${attendee.user_id}`)}
                    style={styles.followedAvatarItem}
                  >
                    <Avatar
                      source={attendee.avatar_url}
                      name={attendee.display_name || attendee.username}
                      size="md"
                    />
                    <Text style={styles.followedAvatarName} numberOfLines={1}>
                      {attendee.display_name || attendee.username}
                    </Text>
                  </TouchableOpacity>
                ))}
                {followedAttendees.length > 5 && (
                  <View style={styles.followedAvatarItem}>
                    <View style={styles.moreCircle}>
                      <Text style={styles.moreCircleText}>+{followedAttendees.length - 5}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ============ COMMUNITY ATTENDEES ============ */}
        {attendees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who Was There</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.attendeesRow}>
                {attendees.map((attendee) => (
                  <TouchableOpacity
                    key={attendee.user_id}
                    style={styles.attendeeItem}
                    onPress={() => router.push(`/profile/${attendee.user_id}`)}
                  >
                    <Avatar
                      source={attendee.avatar_url}
                      name={attendee.display_name || attendee.username}
                      size="lg"
                    />
                    <Text style={styles.attendeeName} numberOfLines={1}>
                      {attendee.display_name || attendee.username}
                    </Text>
                  </TouchableOpacity>
                ))}
                {eventStats.attendeeCount > attendees.length + 1 && (
                  <View style={styles.attendeeItem}>
                    <View style={styles.moreCircleLg}>
                      <Text style={styles.moreCircleLgText}>
                        +{eventStats.attendeeCount - attendees.length - (isOwnEvent ? 1 : 0)}
                      </Text>
                    </View>
                    <Text style={styles.attendeeName}>more</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ============ YOUR EXPERIENCE ============ */}
        {isOwnEvent && attendance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Experience</Text>
            <View style={styles.experienceCard}>
              {/* Ratings row */}
              {(attendance.rating || attendance.atmosphere_rating) && (
                <View style={styles.experienceRatingsRow}>
                  {attendance.rating && (
                    <View style={styles.experienceRatingBox}>
                      <Text style={styles.experienceRatingLabel}>Overall</Text>
                      <StarRating rating={attendance.rating} size={18} readonly />
                    </View>
                  )}
                  {attendance.atmosphere_rating && (
                    <View style={styles.experienceRatingBox}>
                      <Text style={styles.experienceRatingLabel}>Atmosphere</Text>
                      <StarRating rating={attendance.atmosphere_rating} size={18} color={colors.secondary} readonly />
                    </View>
                  )}
                </View>
              )}

              {/* Details grid */}
              <View style={styles.experienceDetails}>
                {attendance.supported_team && (
                  <View style={styles.experienceDetail}>
                    <Ionicons name="shirt" size={16} color={colors.textSecondary} />
                    <Text style={styles.experienceDetailLabel}>Supporting</Text>
                    <View style={styles.experienceDetailValueRow}>
                      <Text style={[
                        styles.experienceDetailValue,
                        attendance.result === 'win' && { color: colors.success },
                        attendance.result === 'loss' && { color: colors.error },
                      ]}>
                        {attendance.supported_team === 'home' ? homeTeamShort : attendance.supported_team === 'away' ? awayTeamShort : 'Neutral'}
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

                {(attendance.section || attendance.seat_info) && (
                  <View style={styles.experienceDetail}>
                    <Ionicons name="ticket" size={16} color={colors.textSecondary} />
                    <Text style={styles.experienceDetailLabel}>Seating</Text>
                    <Text style={styles.experienceDetailValue}>
                      {[attendance.section, attendance.seat_info].filter(Boolean).join(' - ')}
                    </Text>
                  </View>
                )}

                {attendance.ticket_price != null && attendance.ticket_price > 0 && (
                  <View style={styles.experienceDetail}>
                    <Ionicons name="cash" size={16} color={colors.textSecondary} />
                    <Text style={styles.experienceDetailLabel}>Ticket</Text>
                    <Text style={styles.experienceDetailValue}>${attendance.ticket_price.toFixed(2)}</Text>
                  </View>
                )}
              </View>

              {/* Went With */}
              {((attendance.went_with && attendance.went_with.length > 0) ||
                (attendance.went_with_user_ids && attendance.went_with_user_ids.length > 0)) && (
                <View style={styles.experienceWentWith}>
                  <TaggedUsersList
                    userIds={attendance.went_with_user_ids}
                    textNames={attendance.went_with}
                  />
                </View>
              )}

              {/* Notes */}
              {attendance.notes && (
                <View style={styles.experienceNotes}>
                  <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                  <Text style={styles.experienceNotesText}>{attendance.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ============ MY GROUP ============ */}
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
                      source={profile.avatar_url}
                      name={profile.display_name || profile.username}
                      size="lg"
                    />
                    <Text style={styles.attendeeName} numberOfLines={1}>
                      {profile.display_name || profile.username}
                    </Text>
                  </TouchableOpacity>
                ))}
                {attendance?.went_with?.map((name, index) => (
                  <View key={`text-${index}`} style={styles.attendeeItem}>
                    <View style={styles.textOnlyAvatar}>
                      <Text style={styles.textOnlyAvatarText}>{name[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.attendeeName} numberOfLines={1}>{name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ============ PHOTOS ============ */}
        {/* Own photos */}
        {isOwnEvent && attendance?.photo_urls && attendance.photo_urls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Photos</Text>
            <View style={styles.photoGrid}>
              {attendance.photo_urls.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.photoGridItem} />
              ))}
            </View>
          </View>
        )}

        {/* Fan photos from community */}
        {attendeePhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fan Photos</Text>
            <View style={styles.photoGrid}>
              {attendeePhotos.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.photoGridItem} />
              ))}
            </View>
          </View>
        )}

        {/* ============ REVIEW STATUS ============ */}
        {isOwnEvent && attendance && !checkingReview && hasExistingReview && (
          <View style={styles.section}>
            <View style={styles.reviewedBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.reviewedBannerText}>Your review is published</Text>
            </View>
          </View>
        )}

        {/* ============ COMMUNITY REVIEWS ============ */}
        {publicReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Reviews</Text>
            {publicReviews.map((review, index) => (
              <View
                key={review.review_id}
                style={[
                  styles.reviewCard,
                  index < publicReviews.length - 1 && { marginBottom: spacing.md },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <TouchableOpacity
                    style={styles.reviewAuthorRow}
                    onPress={() => router.push(`/profile/${review.user_id}`)}
                  >
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
                        {review.is_watched && ' \u00B7 Watched'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {review.rating && (
                    <View style={styles.reviewRatingPill}>
                      <Ionicons name="star" size={12} color={colors.gold} />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  )}
                </View>
                {review.review_text && (
                  <Text style={styles.reviewText} numberOfLines={4}>
                    {review.review_text}
                  </Text>
                )}
                <View style={styles.reviewFooter}>
                  <View style={styles.reviewStat}>
                    <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.reviewStatText}>{review.likes_count || 0}</Text>
                  </View>
                  <View style={styles.reviewStat}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.reviewStatText}>{review.comments_count || 0}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ============ ACTIONS BAR ============ */}
        {isOwnEvent && attendance && (
          <View style={styles.actionsSection}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, attendance.is_favorite && styles.actionBtnActive]}
                onPress={handleToggleFavorite}
              >
                <Ionicons
                  name={attendance.is_favorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={attendance.is_favorite ? colors.error : colors.textSecondary}
                />
                <Text style={[styles.actionBtnText, attendance.is_favorite && { color: colors.error }]}>
                  {attendance.is_favorite ? 'Favorited' : 'Favorite'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={22} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={colors.info} />
                <Text style={[styles.actionBtnText, { color: colors.info }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Social Share */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#1DA1F2' }]}
                onPress={() => handleSocialShare('twitter')}
              >
                <Ionicons name="logo-twitter" size={18} color={colors.white} />
                <Text style={styles.socialBtnText}>Tweet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => handleSocialShare('facebook')}
              >
                <Ionicons name="logo-facebook" size={18} color={colors.white} />
                <Text style={styles.socialBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ============ FLOATING ACTION BUTTON ============ */}
      {showFab && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: sportColor }]}
          onPress={() => router.push(`/event/review/${attendance.id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="create" size={22} color={colors.white} />
          <Text style={styles.fabText}>Write Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },

  // ============ HERO ============
  hero: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCompetitionRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroCompetition: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  heroRound: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  heroMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTeam: {
    flex: 1,
    alignItems: 'center',
  },
  heroLogoContainer: {
    marginBottom: spacing.sm,
  },
  heroLogo: {
    width: 72,
    height: 72,
  },
  heroLogoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroTeamName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    textAlign: 'center',
    maxWidth: 100,
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minWidth: 100,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroScore: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroScoreWinner: {
    color: colors.white,
  },
  heroScoreDim: {
    color: 'rgba(255,255,255,0.5)',
  },
  heroScoreDivider: {
    fontSize: fontSize['2xl'],
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: spacing.sm,
  },
  heroVs: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: 'rgba(255,255,255,0.6)',
  },
  heroResultText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  heroUserResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
  },
  heroUserResultText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  abandonedContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  abandonedText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: 'rgba(255,255,255,0.7)',
  },

  // Tennis
  tennisScoreContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tennisSet: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: spacing.xs,
  },
  tennisSetWon: {
    color: colors.white,
  },
  tennisSetLost: {
    color: 'rgba(255,255,255,0.4)',
  },

  // Cricket
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
    color: 'rgba(255,255,255,0.6)',
  },
  cricketInningWon: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  cricketDivider: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
  },

  // ============ QUICK STATS BAR ============
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },
  statPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  statPillValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statPillLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // ============ INFO CHIPS ============
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },

  // ============ I WAS THERE ============
  iWasThereSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  iWasThereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    width: '100%',
    ...shadows.sm,
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

  // ============ PEOPLE YOU FOLLOW ============
  followedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  followedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  followedTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  followedAvatars: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  followedAvatarItem: {
    alignItems: 'center',
    width: 60,
  },
  followedAvatarName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  moreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCircleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },

  // ============ SECTIONS ============
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // ============ ATTENDEES ============
  attendeesRow: {
    flexDirection: 'row',
    paddingRight: spacing.lg,
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
  moreCircleLg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCircleLgText: {
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

  // ============ YOUR EXPERIENCE ============
  experienceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  experienceRatingsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  experienceRatingBox: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  experienceRatingLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  experienceDetails: {
    gap: spacing.md,
  },
  experienceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  experienceDetailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    minWidth: 80,
  },
  experienceDetailValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  experienceDetailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  experienceWentWith: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  experienceNotes: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  experienceNotesText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
  },

  // ============ PHOTOS GRID ============
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3,
    height: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3,
    borderRadius: borderRadius.lg,
  },

  // ============ REVIEW STATUS ============
  reviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.success}12`,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  reviewedBannerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.success,
  },

  // ============ COMMUNITY REVIEWS ============
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  reviewAuthor: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  reviewDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  reviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.gold}18`,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  reviewRatingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gold,
  },
  reviewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  reviewFooter: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  reviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewStatText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // ============ ACTIONS ============
  actionsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  actionBtnActive: {},
  actionBtnText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  socialBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },

  // ============ FAB ============
  fab: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  fabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
