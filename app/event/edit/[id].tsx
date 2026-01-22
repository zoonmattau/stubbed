import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, StarRating } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { AttendedEventWithDetails } from '@/types';

type SupportedTeam = 'home' | 'away' | 'neutral' | null;

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { attendedEvents, updateAttendedEvent, updateEvent, venues, fetchVenues } = useEventsStore();

  const [attendance, setAttendance] = useState<AttendedEventWithDetails | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [atmosphereRating, setAtmosphereRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [section, setSection] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [supportedTeam, setSupportedTeam] = useState<SupportedTeam>(null);
  const [wentWith, setWentWith] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Event details
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  // Venue editing
  const [venueName, setVenueName] = useState('');
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  // Date/Time editing
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [timeAmPm, setTimeAmPm] = useState<'AM' | 'PM'>('PM');
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowDayPicker(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
    setShowVenueSuggestions(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  // Date dropdown options
  const currentDate = new Date();
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

  const getMonthLabel = (value: string) => {
    const month = months.find(m => m.value === value);
    return month?.label || value;
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

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    const found = attendedEvents.find((e) => e.id === id);
    if (found) {
      setAttendance(found);
      setRating(found.rating || 0);
      setAtmosphereRating(found.atmosphere_rating || 0);
      setNotes(found.notes || '');
      setSection(found.section || '');
      setTicketPrice(found.ticket_price?.toString() || '');
      setSupportedTeam(found.supported_team || null);
      setWentWith(found.went_with || []);
      // Event details
      setHomeScore(found.event?.home_score || '');
      setAwayScore(found.event?.away_score || '');
      setVenueName(found.event?.venue?.name || found.event?.venue_name || '');
      // Date/Time
      if (found.event?.event_date) {
        const eventDate = new Date(found.event.event_date);
        setSelectedDay(eventDate.getDate().toString());
        setSelectedMonth((eventDate.getMonth() + 1).toString());
        setSelectedYear(eventDate.getFullYear().toString());
      }
      if (found.event?.event_time) {
        // Parse 24-hour time to 12-hour
        const [hours, minutes] = found.event.event_time.split(':');
        const hour = parseInt(hours, 10);
        if (hour >= 12) {
          setTimeAmPm('PM');
          setEventTime(hour === 12 ? `12:${minutes}` : `${hour - 12}:${minutes}`);
        } else {
          setTimeAmPm('AM');
          setEventTime(hour === 0 ? `12:${minutes}` : `${hour}:${minutes}`);
        }
      }
    }
  }, [id, attendedEvents]);

  // Compute venue suggestions
  const venueSuggestions = useMemo(() => {
    const uniqueVenues = new Set<string>();

    // Add venues from user's history
    attendedEvents.forEach((attended) => {
      const eventVenue = attended.event?.venue?.name || attended.event?.venue_name;
      if (eventVenue) {
        uniqueVenues.add(eventVenue);
      }
    });

    // Add venues from master list
    venues.forEach((v) => {
      if (v.name) {
        uniqueVenues.add(v.name);
      }
    });

    const allVenues = Array.from(uniqueVenues).sort();
    if (!venueName.trim()) {
      return allVenues.slice(0, 10);
    }
    const query = venueName.toLowerCase();
    return allVenues.filter((v) => v.toLowerCase().includes(query)).slice(0, 10);
  }, [attendedEvents, venues, venueName]);

  const addPerson = () => {
    if (newPerson.trim() && !wentWith.includes(newPerson.trim())) {
      setWentWith([...wentWith, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (person: string) => {
    setWentWith(wentWith.filter((p) => p !== person));
  };

  const handleSave = async () => {
    if (!attendance || !attendance.event) return;

    setIsSaving(true);
    try {
      // Update event details if changed
      const eventUpdates: Record<string, any> = {};
      if (homeScore !== (attendance.event.home_score || '')) {
        eventUpdates.home_score = homeScore || null;
      }
      if (awayScore !== (attendance.event.away_score || '')) {
        eventUpdates.away_score = awayScore || null;
      }
      const currentVenue = attendance.event.venue?.name || attendance.event.venue_name || '';
      if (venueName !== currentVenue) {
        eventUpdates.venue_name = venueName || null;
      }
      // Update date if changed
      if (selectedDay && selectedMonth && selectedYear) {
        const newDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
        if (newDate !== attendance.event.event_date) {
          eventUpdates.event_date = newDate;
        }
      }
      // Update time if changed
      if (eventTime) {
        const newTime = convertTo24Hour(eventTime, timeAmPm);
        if (newTime !== attendance.event.event_time) {
          eventUpdates.event_time = newTime;
        }
      }

      // If scores changed, update the event
      if (Object.keys(eventUpdates).length > 0) {
        const eventResult = await updateEvent(attendance.event_id, eventUpdates);
        if (!eventResult.success) {
          console.error('Event update failed:', eventResult.error);
          if (Platform.OS === 'web') {
            window.alert(`Failed to update scores: ${eventResult.error || 'Unknown error'}`);
          }
          setIsSaving(false);
          return;
        }
      }

      const updates: Record<string, any> = {
        rating: rating || null,
        atmosphere_rating: atmosphereRating || null,
        notes: notes || null,
        section: section || null,
        ticket_price: ticketPrice ? parseFloat(ticketPrice) : null,
        supported_team: supportedTeam,
        went_with: wentWith.length > 0 ? wentWith : null,
      };

      // Calculate result based on supported team
      if (supportedTeam && supportedTeam !== 'neutral' && attendance.event) {
        const event = attendance.event;
        if (event.is_draw) {
          updates.result = 'draw';
        } else if (event.winner_team_id) {
          const supportedTeamId = supportedTeam === 'home'
            ? event.home_team_id
            : event.away_team_id;
          updates.result = event.winner_team_id === supportedTeamId ? 'win' : 'loss';
        }
      } else {
        updates.result = null;
      }

      const result = await updateAttendedEvent(attendance.id, updates);
      if (result.success) {
        handleBack();
      } else {
        console.error('Update failed:', result.error);
        if (Platform.OS === 'web') {
          window.alert(`Failed to save: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to save changes');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!attendance || !attendance.event) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFoundText}>Event not found</Text>
      </View>
    );
  }

  const event = attendance.event;

  const renderStarRating = (value: number, onChange: (val: number) => void, label: string) => (
    <View style={styles.ratingSection}>
      <Text style={styles.label}>{label}</Text>
      <StarRating rating={value} onChange={onChange} size={32} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Event' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        onScrollBeginDrag={closeAllDropdowns}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.matchTitle}>
            {event.home_team?.name || event.home_team_name || 'Home'} vs {event.away_team?.name || event.away_team_name || 'Away'}
          </Text>
          <Text style={styles.matchDate}>
            {new Date(event.event_date).toLocaleDateString()}
          </Text>
        </Card>

        {/* Scores */}
        <Card style={styles.scoresCard}>
          <Text style={styles.sectionTitle}>Final Score</Text>
          <View style={styles.scoresRow}>
            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreTeamLabel} numberOfLines={1}>
                {event.home_team?.short_name || event.home_team?.name || event.home_team_name || 'Home'}
              </Text>
              <TextInput
                style={styles.scoreInput}
                value={homeScore}
                onChangeText={setHomeScore}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <Text style={styles.scoreDivider}>-</Text>
            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreTeamLabel} numberOfLines={1}>
                {event.away_team?.short_name || event.away_team?.name || event.away_team_name || 'Away'}
              </Text>
              <TextInput
                style={styles.scoreInput}
                value={awayScore}
                onChangeText={setAwayScore}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          {event.sport?.name?.toLowerCase() === 'cricket' && (
            <Text style={styles.scoreHint}>
              For Test cricket, use format: 365/10+241/10
            </Text>
          )}
        </Card>

        {/* Venue */}
        <Card style={styles.venueCard}>
          <Text style={styles.sectionTitle}>Venue</Text>
          <View style={styles.venueAutocompleteContainer}>
            <TextInput
              style={styles.input}
              value={venueName}
              onChangeText={(text) => {
                setVenueName(text);
                setShowVenueSuggestions(true);
              }}
              onFocus={() => setShowVenueSuggestions(true)}
              onBlur={() => setTimeout(() => setShowVenueSuggestions(false), 200)}
              placeholder="Enter venue name"
              placeholderTextColor={colors.textMuted}
            />
            {showVenueSuggestions && venueSuggestions.length > 0 && (
              <View style={styles.venueSuggestionsDropdown}>
                <ScrollView style={styles.venueSuggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {venueSuggestions.map((venue, index) => (
                    <TouchableOpacity
                      key={`${venue}-${index}`}
                      style={styles.venueSuggestionItem}
                      onPress={() => {
                        setVenueName(venue);
                        setShowVenueSuggestions(false);
                      }}
                    >
                      <Ionicons name="location" size={16} color={colors.textSecondary} />
                      <Text style={styles.venueSuggestionText}>{venue}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Card>

        {/* Date & Time */}
        <Card style={styles.dateTimeCard}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <Text style={styles.dateLabel}>Date</Text>
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
                      onPress={() => {
                        setSelectedDay(day);
                        setShowDayPicker(false);
                      }}
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
                      onPress={() => {
                        setSelectedMonth(month.value);
                        setShowMonthPicker(false);
                      }}
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
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearPicker(false);
                      }}
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

          <Text style={[styles.dateLabel, { marginTop: spacing.md }]}>Time</Text>
          <View style={styles.timeInputRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={eventTime}
              onChangeText={setEventTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.amPmContainer}>
              <TouchableOpacity
                style={[styles.amPmButton, timeAmPm === 'AM' && styles.amPmButtonActive]}
                onPress={() => setTimeAmPm('AM')}
              >
                <Text style={[styles.amPmText, timeAmPm === 'AM' && styles.amPmTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.amPmButton, timeAmPm === 'PM' && styles.amPmButtonActive]}
                onPress={() => setTimeAmPm('PM')}
              >
                <Text style={[styles.amPmText, timeAmPm === 'PM' && styles.amPmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Supported Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who did you support?</Text>
          <View style={styles.teamButtons}>
            <TouchableOpacity
              style={[
                styles.teamButton,
                supportedTeam === 'home' && styles.teamButtonActive,
              ]}
              onPress={() => setSupportedTeam(supportedTeam === 'home' ? null : 'home')}
            >
              <Text style={[
                styles.teamButtonText,
                supportedTeam === 'home' && styles.teamButtonTextActive,
              ]}>
                {event.home_team?.name || 'Home'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.teamButton,
                supportedTeam === 'away' && styles.teamButtonActive,
              ]}
              onPress={() => setSupportedTeam(supportedTeam === 'away' ? null : 'away')}
            >
              <Text style={[
                styles.teamButtonText,
                supportedTeam === 'away' && styles.teamButtonTextActive,
              ]}>
                {event.away_team?.name || 'Away'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.teamButton,
                styles.neutralButton,
                supportedTeam === 'neutral' && styles.neutralButtonActive,
              ]}
              onPress={() => setSupportedTeam(supportedTeam === 'neutral' ? null : 'neutral')}
            >
              <Text style={[
                styles.teamButtonText,
                supportedTeam === 'neutral' && styles.teamButtonTextActive,
              ]}>
                Neutral
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ratings */}
        <Card style={styles.ratingsCard}>
          {renderStarRating(rating, setRating, 'Overall Rating')}
          <View style={styles.divider} />
          {renderStarRating(atmosphereRating, setAtmosphereRating, 'Atmosphere')}
        </Card>

        {/* Seating & Price */}
        <Card>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Section / Seat</Text>
            <TextInput
              style={styles.input}
              value={section}
              onChangeText={setSection}
              placeholder="e.g., Level 2, Row M"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ticket Price ($)</Text>
            <TextInput
              style={styles.input}
              value={ticketPrice}
              onChangeText={setTicketPrice}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </Card>

        {/* Went With */}
        <Card style={styles.wentWithCard}>
          <Text style={styles.label}>Who did you go with?</Text>

          {wentWith.length > 0 && (
            <View style={styles.peopleList}>
              {wentWith.map((person) => (
                <View key={person} style={styles.personChip}>
                  <Text style={styles.personName}>{person}</Text>
                  <TouchableOpacity onPress={() => removePerson(person)}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addPersonRow}>
            <TextInput
              style={[styles.input, styles.personInput]}
              value={newPerson}
              onChangeText={setNewPerson}
              placeholder="Add a person..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={addPerson}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={addPerson}>
              <Ionicons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Notes */}
        <Card style={styles.notesCard}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How was the game? Any memorable moments?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {/* Save Button */}
        <Button
          title={isSaving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
  summaryCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  matchDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scoresCard: {
    marginBottom: spacing.lg,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  scoreInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  scoreTeamLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  scoreInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
  },
  scoreDivider: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  scoreHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  teamButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  teamButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  neutralButton: {
    flex: 0.8,
  },
  neutralButtonActive: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
  teamButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  teamButtonTextActive: {
    color: colors.white,
  },
  ratingsCard: {
    marginBottom: spacing.lg,
  },
  ratingSection: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  notesCard: {
    marginBottom: spacing.lg,
  },
  notesInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
  },
  wentWithCard: {
    marginBottom: spacing.lg,
  },
  peopleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight || `${colors.primary}20`,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  personName: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  addPersonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  personInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: spacing.md,
  },
  // Venue styles
  venueCard: {
    marginBottom: spacing.lg,
  },
  venueAutocompleteContainer: {
    position: 'relative',
    zIndex: 20,
  },
  venueSuggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    zIndex: 100,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  venueSuggestionsList: {
    maxHeight: 200,
  },
  venueSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  venueSuggestionText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  // Date/Time styles
  dateTimeCard: {
    marginBottom: spacing.lg,
    zIndex: 30,
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
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
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
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
  },
  amPmContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  amPmButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  amPmButtonActive: {
    backgroundColor: colors.primary,
  },
  amPmText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  amPmTextActive: {
    color: colors.white,
  },
});
