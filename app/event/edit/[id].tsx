import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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
  const { attendedEvents, updateAttendedEvent, updateEvent } = useEventsStore();

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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

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
    }
  }, [id, attendedEvents]);

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
      // Update event scores if changed
      const eventUpdates: Record<string, any> = {};
      if (homeScore !== (attendance.event.home_score || '')) {
        eventUpdates.home_score = homeScore || null;
      }
      if (awayScore !== (attendance.event.away_score || '')) {
        eventUpdates.away_score = awayScore || null;
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
});
