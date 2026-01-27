import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Card, Button, StarRating, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useEventsStore } from '@/stores/eventsStore';
import { useReviews } from '@/hooks/useReviews';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSportColor, SPORTS } from '@/constants/sports';
import type { AttendedEventWithDetails } from '@/types';

// Helper to get display name from sport code
function getSportDisplayName(sportCode: string | null | undefined): string {
  if (!sportCode) return 'Sport';
  // Try to find in SPORTS constant
  const sport = SPORTS.find(s => s.id.toLowerCase() === sportCode.toLowerCase() || s.name.toLowerCase() === sportCode.toLowerCase());
  if (sport) return sport.name;
  // Fallback: capitalize first letter of each word
  return sportCode
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function WriteReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { attendedEvents } = useEventsStore();
  const { createReview, updateReview, getReview } = useReviews();

  const [attendance, setAttendance] = useState<AttendedEventWithDetails | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [atmosphereRating, setAtmosphereRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isWatched, setIsWatched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  // Load attendance data
  useEffect(() => {
    const found = attendedEvents.find((e) => e.id === id);
    if (found) {
      setAttendance(found);
      // Pre-fill with existing ratings
      if (found.rating) setRating(found.rating);
      if (found.atmosphere_rating) setAtmosphereRating(found.atmosphere_rating);
    }
  }, [id, attendedEvents]);

  // Check for existing review
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!id) return;
      // This would need a function to get review by attended_event_id
      // For now, we'll just create new reviews
    };
    checkExistingReview();
  }, [id]);

  const handlePickImage = async () => {
    if (photos.length >= 4) {
      if (Platform.OS === 'web') {
        window.alert('Maximum 4 photos allowed');
      } else {
        Alert.alert('Limit reached', 'Maximum 4 photos allowed');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!attendance || !user?.id) return;

    if (rating === 0) {
      if (Platform.OS === 'web') {
        window.alert('Please add an overall rating');
      } else {
        Alert.alert('Rating required', 'Please add an overall rating');
      }
      return;
    }

    setIsSaving(true);
    try {
      const reviewData = {
        user_id: user.id,
        attended_event_id: attendance.id,
        event_id: attendance.event_id,
        rating,
        atmosphere_rating: atmosphereRating || null,
        review_text: reviewText.trim() || null,
        photo_urls: photos.length > 0 ? photos : null,
        is_watched: isWatched,
      };

      const result = existingReviewId
        ? await updateReview(existingReviewId, reviewData)
        : await createReview(reviewData);

      if (result) {
        if (Platform.OS === 'web') {
          window.alert('Review published!');
        } else {
          Alert.alert('Success', 'Your review has been published!');
        }
        router.back();
      } else {
        throw new Error('Failed to save review');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to publish review');
      } else {
        Alert.alert('Error', 'Failed to publish review. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!attendance || !attendance.event) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Write Review' }} />
        <View style={styles.notFound}>
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
          <Text style={styles.notFoundText}>Event not found</Text>
        </View>
      </View>
    );
  }

  const event = attendance.event;
  const sportName = getSportDisplayName(event.sport?.name || event.sport_name);
  const sportColor = getSportColor(sportName.toLowerCase());

  return (
    <>
      <Stack.Screen options={{ title: 'Write Review' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Event Summary */}
        <Card style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Badge
              label={sportName}
              size="sm"
              color={sportColor}
            />
            {event.competition && (
              <Text style={styles.competition}>{event.competition}</Text>
            )}
          </View>
          <Text style={styles.matchTitle}>
            {event.home_team?.name || event.home_team_name || 'Home'} vs{' '}
            {event.away_team?.name || event.away_team_name || 'Away'}
          </Text>
          <Text style={styles.matchDetails}>
            {new Date(event.event_date).toLocaleDateString('en-AU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {event.venue?.name || event.venue_name ? ` • ${event.venue?.name || event.venue_name}` : ''}
          </Text>
        </Card>

        {/* Watched Toggle */}
        <TouchableOpacity
          style={styles.watchedToggle}
          onPress={() => setIsWatched(!isWatched)}
        >
          <View style={styles.watchedInfo}>
            <Ionicons
              name={isWatched ? 'tv' : 'tv-outline'}
              size={24}
              color={isWatched ? colors.primary : colors.textMuted}
            />
            <View>
              <Text style={styles.watchedLabel}>I watched this event</Text>
              <Text style={styles.watchedHint}>Didn't attend in person</Text>
            </View>
          </View>
          <View style={[styles.checkbox, isWatched && styles.checkboxActive]}>
            {isWatched && <Ionicons name="checkmark" size={16} color={colors.white} />}
          </View>
        </TouchableOpacity>

        {/* Ratings */}
        <Card style={styles.ratingsCard}>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Overall Rating *</Text>
            <StarRating rating={rating} onChange={setRating} size={36} />
          </View>
          <View style={styles.divider} />
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Atmosphere</Text>
            <StarRating rating={atmosphereRating} onChange={setAtmosphereRating} size={36} />
          </View>
        </Card>

        {/* Review Text */}
        <Card style={styles.textCard}>
          <Text style={styles.label}>Your Review</Text>
          <TextInput
            style={styles.textInput}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience... What made this event memorable?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </Card>

        {/* Photos */}
        <Card style={styles.photosCard}>
          <Text style={styles.label}>Photos (optional)</Text>
          <View style={styles.photosGrid}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickImage}>
                <Ionicons name="camera" size={24} color={colors.textMuted} />
                <Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="globe-outline" size={20} color={colors.textMuted} />
          <Text style={styles.privacyText}>
            This review will be visible to everyone on the Explore feed
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          title={isSaving ? 'Publishing...' : 'Publish Review'}
          onPress={handleSubmit}
          disabled={isSaving || rating === 0}
          style={styles.submitButton}
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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  eventCard: {
    marginBottom: spacing.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  competition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  matchTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  matchDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  watchedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  watchedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  watchedLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  watchedHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingsCard: {
    marginBottom: spacing.lg,
  },
  ratingSection: {
    paddingVertical: spacing.sm,
  },
  ratingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  textCard: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 120,
  },
  photosCard: {
    marginBottom: spacing.lg,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  privacyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
