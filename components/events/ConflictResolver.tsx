import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '@/components/ui';
import { useEventsStore } from '@/stores/eventsStore';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { EventConsensus } from '@/types';

interface ConflictResolverProps {
  eventId: string;
  attendanceId: string;
  onResolved?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  home_score: 'Home Score',
  away_score: 'Away Score',
  round: 'Round',
  event_time: 'Event Time',
  competition: 'Competition',
};

export function ConflictResolver({ eventId, attendanceId, onResolved }: ConflictResolverProps) {
  const { getEventConsensus, resolveEventConflict } = useEventsStore();
  const [consensus, setConsensus] = useState<EventConsensus[]>([]);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedField, setSelectedField] = useState<EventConsensus | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    loadConsensus();
  }, [eventId]);

  const loadConsensus = async () => {
    setIsLoading(true);
    const result = await getEventConsensus(eventId);
    setConsensus(result.consensus);
    setHasConflicts(result.hasConflicts);
    setIsLoading(false);

    // Auto-show modal if there are conflicts
    if (result.hasConflicts) {
      setShowModal(true);
    }
  };

  const handleResolve = async (field: string, value: string) => {
    setIsResolving(true);
    const result = await resolveEventConflict(eventId, attendanceId, field, value);
    if (result.success) {
      await loadConsensus();
      setSelectedField(null);
      onResolved?.();
    }
    setIsResolving(false);
  };

  const conflictingFields = consensus.filter((c) => c.has_conflict);

  if (isLoading) {
    return null;
  }

  if (!hasConflicts) {
    return null;
  }

  return (
    <>
      {/* Conflict Banner */}
      <TouchableOpacity style={styles.banner} onPress={() => setShowModal(true)}>
        <View style={styles.bannerIcon}>
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Data Conflict Detected</Text>
          <Text style={styles.bannerText}>
            {conflictingFields.length} field{conflictingFields.length !== 1 ? 's have' : ' has'} different values. Tap to resolve.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Conflict Resolution Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Data Conflicts</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Multiple users have entered different values for this event.
              Help us determine the correct information.
            </Text>

            <ScrollView style={styles.conflictList}>
              {conflictingFields.map((field) => (
                <Card key={field.field_name} style={styles.conflictCard}>
                  <View style={styles.conflictHeader}>
                    <Text style={styles.conflictFieldName}>
                      {FIELD_LABELS[field.field_name] || field.field_name}
                    </Text>
                    <View style={styles.conflictBadge}>
                      <Ionicons name="people" size={12} color={colors.white} />
                      <Text style={styles.conflictBadgeText}>
                        {field.total_votes} vote{field.total_votes !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.conflictQuestion}>
                    What is the correct {FIELD_LABELS[field.field_name]?.toLowerCase() || field.field_name}?
                  </Text>

                  {/* Show the conflicting options */}
                  <ConflictOptions
                    eventId={eventId}
                    fieldName={field.field_name}
                    currentConsensus={field.consensus_value}
                    onSelect={(value) => handleResolve(field.field_name, value)}
                    isResolving={isResolving}
                  />
                </Card>
              ))}
            </ScrollView>

            <Button
              title="Done"
              onPress={() => setShowModal(false)}
              style={styles.doneButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// Sub-component to show voting options for a field
interface ConflictOptionsProps {
  eventId: string;
  fieldName: string;
  currentConsensus: string | null;
  onSelect: (value: string) => void;
  isResolving: boolean;
}

function ConflictOptions({ eventId, fieldName, currentConsensus, onSelect, isResolving }: ConflictOptionsProps) {
  const [options, setOptions] = useState<{ value: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    loadOptions();
  }, [eventId, fieldName]);

  const loadOptions = async () => {
    // Fetch all distinct values for this field from attended_events
    const submittedField = `submitted_${fieldName}`;

    const { data, error } = await supabase
      .from('attended_events')
      .select(submittedField)
      .eq('event_id', eventId)
      .not(submittedField, 'is', null);

    if (!error && data) {
      // Count occurrences of each value
      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        const value = row[submittedField];
        if (value) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });

      // Convert to array and sort by count (descending)
      const optionsArray = Object.entries(counts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

      setOptions(optionsArray);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={styles.optionsContainer}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionButton,
            option.value === currentConsensus && styles.optionButtonSelected,
          ]}
          onPress={() => onSelect(option.value)}
          disabled={isResolving}
        >
          <View style={styles.optionContent}>
            <Text style={[
              styles.optionValue,
              option.value === currentConsensus && styles.optionValueSelected,
            ]}>
              {option.value}
            </Text>
            <Text style={styles.optionVotes}>
              {option.count} vote{option.count !== 1 ? 's' : ''}
            </Text>
          </View>
          {option.value === currentConsensus && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}

      {/* Option to enter different value */}
      {showCustom ? (
        <View style={styles.customInputContainer}>
          <View style={styles.customInputRow}>
            <TouchableOpacity
              style={styles.customCancelButton}
              onPress={() => setShowCustom(false)}
            >
              <Text style={styles.customCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.customSubmitButton, !customValue && styles.customSubmitButtonDisabled]}
              onPress={() => {
                if (customValue) {
                  onSelect(customValue);
                  setShowCustom(false);
                  setCustomValue('');
                }
              }}
              disabled={!customValue || isResolving}
            >
              <Text style={styles.customSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.differentValueButton}
          onPress={() => setShowCustom(true)}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.differentValueText}>Enter different value</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
  bannerText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  conflictList: {
    marginBottom: spacing.md,
  },
  conflictCard: {
    marginBottom: spacing.md,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  conflictFieldName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  conflictBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  conflictQuestion: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  optionContent: {
    flex: 1,
  },
  optionValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  optionValueSelected: {
    color: colors.primary,
  },
  optionVotes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  differentValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  differentValueText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  customInputContainer: {
    marginTop: spacing.sm,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customCancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  customCancelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  customSubmitButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  customSubmitButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  customSubmitText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  doneButton: {
    marginTop: spacing.md,
  },
});
