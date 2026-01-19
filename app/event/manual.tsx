import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, Badge } from '@/components/ui';
import { UserTagPicker } from '@/components/social/UserTagPicker';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useEventInvitations } from '@/hooks/useEventInvitations';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { SPORTS } from '@/constants/sports';
import { pickImage, uploadEventPhoto } from '@/lib/storage';
import type { ESPNSearchResult } from '@/lib/espn';

// Map sport types from APIs to local sport IDs
// Handles both ESPN sport values and SportsDB sport names
const SPORT_TO_LOCAL: Record<string, string> = {
  // ESPN sport types (lowercase with hyphens)
  'australian-football': 'afl',
  'rugby-league': 'nrl',
  'rugby': 'rugby',
  'soccer': 'soccer',
  'basketball': 'basketball',
  'football': 'basketball', // American football
  'baseball': 'baseball',
  'hockey': 'basketball', // Ice hockey fallback
  'tennis': 'tennis',
  'cricket': 'cricket',
  // SportsDB sport names (title case)
  'Australian Football': 'afl',
  'aussie rules': 'afl',
  'afl': 'afl',
  'Rugby League': 'nrl',
  'nrl': 'nrl',
  'Rugby': 'rugby',
  'Rugby Union': 'rugby',
  'Soccer': 'soccer',
  'Football': 'soccer',
  'Basketball': 'basketball',
  'nba': 'basketball',
  'Baseball': 'basketball',
  'mlb': 'basketball',
  'Ice Hockey': 'basketball',
  'nhl': 'basketball',
  'Tennis': 'tennis',
  'Cricket': 'cricket',
  'Motorsport': 'motorsport',
  'Formula 1': 'motorsport',
  'MotoGP': 'motorsport',
  'Golf': 'golf',
  'Fighting': 'mma',
  'MMA': 'mma',
  'UFC': 'mma',
  'Netball': 'netball',
  // League-based mappings
  'epl': 'soccer',
  'laliga': 'soccer',
  'bundesliga': 'soccer',
  'serie_a': 'soccer',
  'ligue_1': 'soccer',
  'champions_league': 'soccer',
  'mls': 'soccer',
  'aleague': 'soccer',
};

// Helper to get local sport ID from any sport string
function getLocalSportId(sportString: string | undefined): string {
  if (!sportString) return '';

  // Try exact match first
  if (SPORT_TO_LOCAL[sportString]) {
    return SPORT_TO_LOCAL[sportString];
  }

  // Try lowercase match
  const lowerSport = sportString.toLowerCase();
  for (const [key, value] of Object.entries(SPORT_TO_LOCAL)) {
    if (key.toLowerCase() === lowerSport) {
      return value;
    }
  }

  // Try partial match
  for (const [key, value] of Object.entries(SPORT_TO_LOCAL)) {
    if (lowerSport.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerSport)) {
      return value;
    }
  }

  return '';
}

const eventSchema = z.object({
  sport_id: z.string().min(1, 'Please select a sport'),
  home_team: z.string().min(1, 'Home team is required'),
  away_team: z.string().min(1, 'Away team is required'),
  venue: z.string().min(1, 'Venue is required'),
  event_date: z.string().min(1, 'Date is required'),
  event_time: z.string().optional(),
  competition: z.string().optional(),
  round: z.string().optional(),
  home_score: z.string().optional(),
  away_score: z.string().optional(),
  section: z.string().optional(),
  seat_info: z.string().optional(),
  ticket_price: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  atmosphere_rating: z.number().min(1).max(5).optional(),
});

type EventForm = z.infer<typeof eventSchema>;

export default function ManualEventScreen() {
  const { eventId, espnEvent } = useLocalSearchParams<{ eventId?: string; espnEvent?: string }>();
  const { user } = useAuthStore();
  const { sports, fetchSports, addAttendedEvent } = useEventsStore();

  // Parse ESPN event data if provided
  const espnData: ESPNSearchResult | null = useMemo(() => {
    if (espnEvent) {
      try {
        return JSON.parse(espnEvent) as ESPNSearchResult;
      } catch {
        return null;
      }
    }
    return null;
  }, [espnEvent]);

  const { createInvitations } = useEventInvitations();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [textNames, setTextNames] = useState<string[]>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/add');
    }
  };

  // Calculate default values based on ESPN data
  const defaultValues = useMemo(() => {
    if (espnData) {
      const eventDate = new Date(espnData.date);
      // Try to get sport from the sport field, or fall back to league name
      const sportId = getLocalSportId(espnData.sport) || getLocalSportId(espnData.league);
      return {
        sport_id: sportId,
        home_team: espnData.homeTeam.name,
        away_team: espnData.awayTeam.name,
        venue: espnData.venue?.name || '',
        event_date: eventDate.toISOString().split('T')[0],
        event_time: eventDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
        competition: espnData.league,
        round: '',
        home_score: espnData.homeScore || '',
        away_score: espnData.awayScore || '',
        section: '',
        seat_info: '',
        ticket_price: '',
        notes: '',
      };
    }
    return {
      sport_id: '',
      home_team: '',
      away_team: '',
      venue: '',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '',
      competition: '',
      round: '',
      home_score: '',
      away_score: '',
      section: '',
      seat_info: '',
      ticket_price: '',
      notes: '',
    };
  }, [espnData]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  useEffect(() => {
    fetchSports();
  }, []);

  // Pre-fill form and select sport when ESPN data is available
  useEffect(() => {
    if (espnData) {
      reset(defaultValues);
      const sportId = getLocalSportId(espnData.sport) || getLocalSportId(espnData.league);
      if (sportId) {
        setSelectedSport(sportId);
        setValue('sport_id', sportId);
      }
    }
  }, [espnData, defaultValues, reset, setValue]);

  const handleSelectSport = (sportId: string) => {
    setSelectedSport(sportId);
    setValue('sport_id', sportId);
  };

  const handleAddPhoto = async () => {
    const uri = await pickImage();
    if (uri) {
      setPhotos([...photos, uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EventForm) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add events');
      return;
    }

    setIsLoading(true);

    try {
      // Upload photos first
      const photoUrls: string[] = [];
      for (const photoUri of photos) {
        try {
          const result = await uploadEventPhoto(photoUri, user.id, Date.now().toString());
          if (result.url) {
            photoUrls.push(result.url);
          }
        } catch (photoError) {
          console.warn('Failed to upload photo:', photoError);
          // Continue with other photos
        }
      }

      // Determine winner
      let isDraw = false;
      if (data.home_score && data.away_score) {
        const homeNum = parseInt(data.home_score, 10);
        const awayNum = parseInt(data.away_score, 10);
        if (!isNaN(homeNum) && !isNaN(awayNum)) {
          if (homeNum === awayNum) {
            isDraw = true;
          }
        }
      }

      const result = await addAttendedEvent(
        user.id,
        {
          sport_id: data.sport_id,
          event_date: data.event_date,
          event_time: data.event_time || null,
          home_team_name: data.home_team,
          away_team_name: data.away_team,
          venue_name: data.venue,
          competition: data.competition || null,
          round: data.round || null,
          home_score: data.home_score || null,
          away_score: data.away_score || null,
          is_draw: isDraw,
        },
        {
          section: data.section || null,
          seat_info: data.seat_info || null,
          ticket_price: data.ticket_price ? parseFloat(data.ticket_price) : null,
          notes: data.notes || null,
          went_with: textNames.length > 0 ? textNames : null,
          went_with_user_ids: selectedFriendIds.length > 0 ? selectedFriendIds : null,
          rating: rating || null,
          atmosphere_rating: atmosphereRating || null,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
        }
      );

      if (result.success && result.attendedEventId && selectedFriendIds.length > 0) {
        // Create tag invitations for each tagged friend
        try {
          await createInvitations(result.attendedEventId, selectedFriendIds);
        } catch (inviteError) {
          console.warn('Failed to create invitations:', inviteError);
          // Don't fail the whole operation if invites fail
        }
      }

      if (result.success) {
        Alert.alert('Success', 'Event added to your history!', [
          { text: 'OK', onPress: handleBack },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to add event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (
    value: number,
    onSelect: (v: number) => void,
    color: string
  ) => (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onSelect(star)}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={32}
            color={star <= value ? color : colors.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ESPN Event Preview */}
        {espnData && (
          <Card style={styles.espnPreview}>
            <View style={styles.espnHeader}>
              <Badge label={espnData.league} size="sm" color={colors.primary} />
              <Text style={styles.espnStatus}>
                {espnData.status === 'completed' ? 'FINAL' : espnData.status === 'in_progress' ? 'LIVE' : 'SCHEDULED'}
              </Text>
            </View>
            <View style={styles.espnTeams}>
              <View style={styles.espnTeamRow}>
                {espnData.awayTeam.logo && (
                  <Image source={{ uri: espnData.awayTeam.logo }} style={styles.espnTeamLogo} />
                )}
                <Text style={styles.espnTeamName} numberOfLines={1}>{espnData.awayTeam.name}</Text>
                {espnData.status !== 'scheduled' && (
                  <Text style={styles.espnScore}>{espnData.awayScore || '0'}</Text>
                )}
              </View>
              <View style={styles.espnTeamRow}>
                {espnData.homeTeam.logo && (
                  <Image source={{ uri: espnData.homeTeam.logo }} style={styles.espnTeamLogo} />
                )}
                <Text style={styles.espnTeamName} numberOfLines={1}>{espnData.homeTeam.name}</Text>
                {espnData.status !== 'scheduled' && (
                  <Text style={styles.espnScore}>{espnData.homeScore || '0'}</Text>
                )}
              </View>
            </View>
            {espnData.venue && (
              <View style={styles.espnVenue}>
                <Ionicons name="location" size={14} color={colors.textMuted} />
                <Text style={styles.espnVenueText}>
                  {espnData.venue.name}{espnData.venue.city ? `, ${espnData.venue.city}` : ''}
                </Text>
              </View>
            )}
            <Text style={styles.espnNote}>Event details pre-filled from ESPN</Text>
          </Card>
        )}

        {/* Sport Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sport *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sportsList}>
              {SPORTS.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportChip,
                    selectedSport === sport.id && {
                      backgroundColor: sport.color,
                      borderColor: sport.color,
                    },
                  ]}
                  onPress={() => handleSelectSport(sport.id)}
                >
                  <Text
                    style={[
                      styles.sportChipText,
                      selectedSport === sport.id && styles.sportChipTextActive,
                    ]}
                  >
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {errors.sport_id && (
            <Text style={styles.error}>{errors.sport_id.message}</Text>
          )}
        </View>

        {/* Teams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Details</Text>
          <Controller
            control={control}
            name="home_team"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Home Team *"
                placeholder="Enter home team name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.home_team?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="away_team"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Away Team *"
                placeholder="Enter away team name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.away_team?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="venue"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Venue *"
                placeholder="Enter venue name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.venue?.message}
              />
            )}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="event_date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Date *"
                    placeholder="YYYY-MM-DD"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.event_date?.message}
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="event_time"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Time"
                    placeholder="HH:MM"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Competition & Round */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="competition"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Competition"
                    placeholder="e.g. AFL Premiership"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="round"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Round"
                    placeholder="e.g. Round 10"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Final Score</Text>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="home_score"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Home Score"
                    placeholder="e.g. 85"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="default"
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="away_score"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Away Score"
                    placeholder="e.g. 72"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="default"
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Your Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Experience</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Overall Rating</Text>
            {renderStars(rating, setRating, colors.gold)}
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Atmosphere</Text>
            {renderStars(atmosphereRating, setAtmosphereRating, colors.secondary)}
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="section"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Section"
                    placeholder="e.g. Level 2"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="seat_info"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Seat"
                    placeholder="e.g. Row G, Seat 15"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="ticket_price"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Ticket Price ($)"
                placeholder="e.g. 85.00"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
              />
            )}
          />

          <UserTagPicker
            selectedUserIds={selectedFriendIds}
            onSelectedUsersChange={setSelectedFriendIds}
            textNames={textNames}
            onTextNamesChange={setTextNames}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Notes"
                placeholder="Any memories or notes about the event..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
              />
            )}
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosRow}>
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          <Button
            title="Add Event"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sportsList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sportChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  sportChipTextActive: {
    color: colors.white,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  ratingContainer: {
    marginBottom: spacing.lg,
  },
  ratingLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photosRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    position: 'relative',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  submitContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  espnPreview: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  espnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  espnStatus: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  espnTeams: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  espnTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  espnTeamLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  espnTeamName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  espnScore: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    minWidth: 30,
    textAlign: 'right',
  },
  espnVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  espnVenueText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  espnNote: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
