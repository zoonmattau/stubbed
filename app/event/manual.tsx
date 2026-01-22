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
  Switch,
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
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useEventInvitations } from '@/hooks/useEventInvitations';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { SPORTS, isIndividualSport, isRacingSport } from '@/constants/sports';
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
  const { isTeamNameFavorite } = useFavoritesStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [textNames, setTextNames] = useState<string[]>([]);
  const [supportedTeam, setSupportedTeam] = useState<'home' | 'away' | 'neutral' | null>(null);
  const [autoSetSupport, setAutoSetSupport] = useState(false); // Track if we auto-set
  const [timeAmPm, setTimeAmPm] = useState<'AM' | 'PM'>('PM');
  const [isAbandoned, setIsAbandoned] = useState(false);

  // Date dropdown state
  const currentDate = new Date();
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/add');
    }
  };

  // Date dropdown options
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const years = Array.from({ length: 50 }, (_, i) => (currentDate.getFullYear() - i).toString());

  // Update form date when dropdowns change
  const updateFormDate = (day: string, month: string, year: string) => {
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    setValue('event_date', formattedDate);
  };

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setShowDayPicker(false);
    updateFormDate(day, selectedMonth, selectedYear);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
    updateFormDate(selectedDay, month, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setShowYearPicker(false);
    updateFormDate(selectedDay, selectedMonth, year);
  };

  const getMonthLabel = (value: string) => {
    const month = months.find(m => m.value === value);
    return month?.label || value;
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
    watch,
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  // Watch team names for support section
  const homeTeamName = watch('home_team');
  const awayTeamName = watch('away_team');

  // Determine if this is an individual sport (tennis, golf, mma)
  const isIndividual = isIndividualSport(selectedSport);
  const isRacing = isRacingSport(selectedSport);
  const participantLabel = isIndividual ? 'Player' : 'Team';

  useEffect(() => {
    fetchSports();
  }, []);

  // Initialize form date from dropdown values on mount
  useEffect(() => {
    if (!espnData) {
      updateFormDate(selectedDay, selectedMonth, selectedYear);
    }
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
      // Set date dropdowns from ESPN data
      const eventDate = new Date(espnData.date);
      setSelectedDay(eventDate.getDate().toString());
      setSelectedMonth((eventDate.getMonth() + 1).toString());
      setSelectedYear(eventDate.getFullYear().toString());
    }
  }, [espnData, defaultValues, reset, setValue]);

  // Auto-set supported team based on favorite teams
  useEffect(() => {
    // Only auto-set if user hasn't manually selected yet
    if (supportedTeam && !autoSetSupport) return;

    const homeFavorite = homeTeamName && isTeamNameFavorite(homeTeamName);
    const awayFavorite = awayTeamName && isTeamNameFavorite(awayTeamName);

    if (homeFavorite && !awayFavorite) {
      setSupportedTeam('home');
      setAutoSetSupport(true);
    } else if (awayFavorite && !homeFavorite) {
      setSupportedTeam('away');
      setAutoSetSupport(true);
    }
    // If both are favorites or neither, don't auto-set
  }, [homeTeamName, awayTeamName, isTeamNameFavorite]);

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

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time: string, amPm: 'AM' | 'PM'): string => {
    if (!time) return '';
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';

    if (isNaN(hour)) return time;

    if (amPm === 'PM' && hour !== 12) {
      hour += 12;
    } else if (amPm === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  const onSubmit = async (data: EventForm) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add events');
      return;
    }

    setIsLoading(true);

    try {
      // Convert time to 24-hour format if provided
      const formattedTime = data.event_time ? convertTo24Hour(data.event_time, timeAmPm) : null;

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

      // Determine winner and result from user's perspective
      let isDraw = false;
      let userResult: 'win' | 'loss' | 'draw' | 'no_result' | null = null;

      // Check if match was abandoned/washed out
      if (isAbandoned) {
        userResult = 'no_result';
      } else if (data.home_score && data.away_score) {
        const homeNum = parseInt(data.home_score, 10);
        const awayNum = parseInt(data.away_score, 10);
        if (!isNaN(homeNum) && !isNaN(awayNum)) {
          if (homeNum === awayNum) {
            isDraw = true;
            userResult = supportedTeam && supportedTeam !== 'neutral' ? 'draw' : null;
          } else if (supportedTeam && supportedTeam !== 'neutral') {
            const homeWon = homeNum > awayNum;
            if (supportedTeam === 'home') {
              userResult = homeWon ? 'win' : 'loss';
            } else {
              userResult = homeWon ? 'loss' : 'win';
            }
          }
        }
      }

      const result = await addAttendedEvent(
        user.id,
        {
          sport_id: data.sport_id,
          event_date: data.event_date,
          event_time: formattedTime,
          home_team_name: data.home_team,
          away_team_name: data.away_team,
          venue_name: data.venue,
          competition: data.competition || null,
          round: data.round || null,
          home_score: isAbandoned ? null : data.home_score || null,
          away_score: isAbandoned ? null : data.away_score || null,
          is_draw: isDraw,
          is_abandoned: isAbandoned,
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
          supported_team: supportedTeam,
          result: userResult,
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
        if (Platform.OS === 'web') {
          window.alert('Event added to your history!');
          handleBack();
        } else {
          Alert.alert('Success', 'Event added to your history!', [
            { text: 'OK', onPress: handleBack },
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to add event');
        } else {
          Alert.alert('Error', result.error || 'Failed to add event');
        }
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
      {[1, 2, 3, 4, 5].map((star) => {
        const isFullStar = star <= value;
        const isHalfStar = !isFullStar && star - 0.5 <= value && star - 0.5 > value - 1;

        return (
          <View key={star} style={styles.starContainer}>
            {/* Left half - tap for half star */}
            <TouchableOpacity
              style={styles.starHalf}
              onPress={() => onSelect(star - 0.5)}
            >
              <View style={styles.starHalfInner} />
            </TouchableOpacity>
            {/* Right half - tap for full star */}
            <TouchableOpacity
              style={styles.starHalf}
              onPress={() => onSelect(star)}
            >
              <View style={styles.starHalfInner} />
            </TouchableOpacity>
            {/* Star icon overlay */}
            <View style={styles.starIconOverlay} pointerEvents="none">
              <Ionicons
                name={isFullStar ? 'star' : isHalfStar ? 'star-half' : 'star-outline'}
                size={32}
                color={isFullStar || isHalfStar ? color : colors.textMuted}
              />
            </View>
          </View>
        );
      })}
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

        {/* Teams/Players/Race */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRacing ? 'Race Details' : isIndividual ? 'Match Details' : 'Match Details'}
          </Text>
          {isRacing ? (
            <>
              {/* Racing sports: Event name and optional position */}
              <Controller
                control={control}
                name="home_team"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Race/Event Name *"
                    placeholder="e.g. Melbourne Cup, Race 7"
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
                    label="Your Selection (Optional)"
                    placeholder="e.g. Horse/Driver name you backed"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </>
          ) : (
            <>
              {/* Regular sports: Home/Away teams or Player 1/2 */}
              <Controller
                control={control}
                name="home_team"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={isIndividual ? 'Player 1 *' : 'Home Team *'}
                    placeholder={isIndividual ? 'Enter player name' : 'Enter home team name'}
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
                    label={isIndividual ? 'Player 2 *' : 'Away Team *'}
                    placeholder={isIndividual ? 'Enter player name' : 'Enter away team name'}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.away_team?.message}
                  />
                )}
              />
            </>
          )}
          <Controller
            control={control}
            name="venue"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={isRacing ? 'Track/Venue *' : 'Venue *'}
                placeholder={isRacing ? 'e.g. Flemington, Randwick' : 'Enter venue name'}
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
          <Text style={styles.dateLabel}>Date *</Text>
          <View style={styles.dateDropdownsRow}>
            {/* Day Dropdown */}
            <View style={styles.dateDropdownContainer}>
              <TouchableOpacity
                style={styles.dateDropdown}
                onPress={() => {
                  setShowDayPicker(!showDayPicker);
                  setShowMonthPicker(false);
                  setShowYearPicker(false);
                }}
              >
                <Text style={styles.dateDropdownText}>{selectedDay.padStart(2, '0')}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {showDayPicker && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dropdownItem, day === selectedDay && styles.dropdownItemActive]}
                      onPress={() => handleDayChange(day)}
                    >
                      <Text style={[styles.dropdownItemText, day === selectedDay && styles.dropdownItemTextActive]}>
                        {day.padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Month Dropdown */}
            <View style={[styles.dateDropdownContainer, styles.monthDropdownContainer]}>
              <TouchableOpacity
                style={styles.dateDropdown}
                onPress={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowDayPicker(false);
                  setShowYearPicker(false);
                }}
              >
                <Text style={styles.dateDropdownText}>{getMonthLabel(selectedMonth)}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {showMonthPicker && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[styles.dropdownItem, month.value === selectedMonth && styles.dropdownItemActive]}
                      onPress={() => handleMonthChange(month.value)}
                    >
                      <Text style={[styles.dropdownItemText, month.value === selectedMonth && styles.dropdownItemTextActive]}>
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Year Dropdown */}
            <View style={styles.dateDropdownContainer}>
              <TouchableOpacity
                style={styles.dateDropdown}
                onPress={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowDayPicker(false);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={styles.dateDropdownText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {showYearPicker && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.dropdownItem, year === selectedYear && styles.dropdownItemActive]}
                      onPress={() => handleYearChange(year)}
                    >
                      <Text style={[styles.dropdownItemText, year === selectedYear && styles.dropdownItemTextActive]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
          {errors.event_date && (
            <Text style={styles.error}>{errors.event_date.message}</Text>
          )}

          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Time</Text>
            <View style={styles.timeInputRow}>
              <Controller
                control={control}
                name="event_time"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.timeInputWrapper}>
                    <Input
                      placeholder="HH:MM"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
              <View style={styles.amPmInlineContainer}>
                <TouchableOpacity
                  style={[
                    styles.amPmInlineButton,
                    timeAmPm === 'AM' && styles.amPmButtonActive,
                  ]}
                  onPress={() => setTimeAmPm('AM')}
                >
                  <Text style={[
                    styles.amPmText,
                    timeAmPm === 'AM' && styles.amPmTextActive,
                  ]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.amPmInlineButton,
                    timeAmPm === 'PM' && styles.amPmButtonActive,
                  ]}
                  onPress={() => setTimeAmPm('PM')}
                >
                  <Text style={[
                    styles.amPmText,
                    timeAmPm === 'PM' && styles.amPmTextActive,
                  ]}>PM</Text>
                </TouchableOpacity>
              </View>
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

        {/* Score / Result */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isRacing ? 'Result (Optional)' : 'Final Score'}</Text>
          {isRacing ? (
            <>
              <Controller
                control={control}
                name="home_score"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Your Selection's Position"
                    placeholder="e.g. 1st, 2nd, DNF (leave blank if unknown)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="default"
                  />
                )}
              />
              <Text style={styles.helperText}>Leave blank if you don't know the result</Text>
            </>
          ) : selectedSport === 'tennis' ? (
            <>
              <Controller
                control={control}
                name="home_score"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Match Score"
                    placeholder="e.g. 6-4, 6-3, 7-5"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="default"
                  />
                )}
              />
              <Text style={styles.helperText}>Enter the set scores (e.g. 6-4, 6-3 for a 2-set match)</Text>
            </>
          ) : (
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Controller
                  control={control}
                  name="home_score"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={isIndividual ? 'Player 1 Score' : 'Home Score'}
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
                      label={isIndividual ? 'Player 2 Score' : 'Away Score'}
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
          )}

          {/* Abandoned/Washed Out Toggle - only for non-racing sports */}
          {!isRacing && (
            <View style={styles.abandonedToggle}>
              <View style={styles.abandonedInfo}>
                <Text style={styles.abandonedLabel}>Match Abandoned / Washed Out</Text>
                <Text style={styles.abandonedDescription}>
                  {selectedSport === 'cricket' ? 'Rain delay, bad light, etc.' : 'Match did not complete'}
                </Text>
              </View>
              <Switch
                value={isAbandoned}
                onValueChange={setIsAbandoned}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          )}
        </View>

        {/* Who Did You Support - hidden for racing sports */}
        {!isRacing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who did you support?</Text>
            <Text style={styles.supportSubtitle}>
              {isIndividual ? 'Earn bonus points when your player wins!' : 'Earn bonus points when your team wins!'}
            </Text>
            {autoSetSupport && supportedTeam && supportedTeam !== 'neutral' && (
              <View style={styles.autoSelectHint}>
                <Ionicons name="heart" size={14} color={colors.primary} />
                <Text style={styles.autoSelectHintText}>
                  Auto-selected from your favorite teams
                </Text>
              </View>
            )}
            <View style={styles.supportOptions}>
              <TouchableOpacity
                style={[
                  styles.supportOption,
                  supportedTeam === 'home' && styles.supportOptionActive,
                ]}
                onPress={() => { setSupportedTeam('home'); setAutoSetSupport(false); }}
              >
                <Ionicons
                  name={isIndividual ? 'person' : 'home'}
                  size={20}
                  color={supportedTeam === 'home' ? colors.white : colors.text}
                />
                <Text style={[
                  styles.supportOptionText,
                  supportedTeam === 'home' && styles.supportOptionTextActive,
                ]} numberOfLines={1}>{homeTeamName || (isIndividual ? 'Player 1' : 'Home')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.supportOption,
                  supportedTeam === 'away' && styles.supportOptionActive,
                ]}
                onPress={() => { setSupportedTeam('away'); setAutoSetSupport(false); }}
              >
                <Ionicons
                  name={isIndividual ? 'person-outline' : 'airplane'}
                  size={20}
                  color={supportedTeam === 'away' ? colors.white : colors.text}
                />
                <Text style={[
                  styles.supportOptionText,
                  supportedTeam === 'away' && styles.supportOptionTextActive,
                ]} numberOfLines={1}>{awayTeamName || (isIndividual ? 'Player 2' : 'Away')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.supportOption,
                  supportedTeam === 'neutral' && styles.supportOptionActive,
                  supportedTeam === 'neutral' && styles.supportOptionNeutral,
                ]}
                onPress={() => { setSupportedTeam('neutral'); setAutoSetSupport(false); }}
              >
                <Ionicons
                  name="eye"
                  size={20}
                  color={supportedTeam === 'neutral' ? colors.white : colors.text}
                />
                <Text style={[
                  styles.supportOptionText,
                  supportedTeam === 'neutral' && styles.supportOptionTextActive,
                ]}>Neutral</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  starContainer: {
    width: 32,
    height: 32,
    position: 'relative',
    flexDirection: 'row',
  },
  starHalf: {
    width: 16,
    height: 32,
    zIndex: 1,
  },
  starHalfInner: {
    width: '100%',
    height: '100%',
  },
  starIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  supportSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  autoSelectHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  autoSelectHintText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  supportOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  supportOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  supportOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  supportOptionNeutral: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
  supportOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  supportOptionTextActive: {
    color: colors.white,
  },
  timeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  timeInputWrapper: {
    flex: 1,
  },
  amPmContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  amPmInlineContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  amPmButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  amPmInlineButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  amPmButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  amPmText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  amPmTextActive: {
    color: colors.white,
  },
  abandonedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  abandonedInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  abandonedLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  abandonedDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateDropdownsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateDropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  monthDropdownContainer: {
    flex: 2,
  },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  dateDropdownText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dropdownItemActive: {
    backgroundColor: colors.primary,
  },
  dropdownItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  dropdownItemTextActive: {
    color: colors.white,
  },
  timeSection: {
    marginTop: spacing.sm,
  },
});
