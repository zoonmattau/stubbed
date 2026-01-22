import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSportColor, getSportIcon } from '@/constants/sports';
import type { Sport } from '@/types';

interface SportFilterProps {
  sports: Sport[];
  selectedSportId: string | null;
  onSelect: (sportId: string | null) => void;
}

export function SportFilter({ sports, selectedSportId, onSelect }: SportFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* All sports option */}
      <TouchableOpacity
        style={[
          styles.pill,
          selectedSportId === null && styles.pillActive,
        ]}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="apps"
          size={16}
          color={selectedSportId === null ? colors.white : colors.textSecondary}
        />
        <Text
          style={[
            styles.pillText,
            selectedSportId === null && styles.pillTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {/* Sport pills */}
      {sports.map((sport) => {
        const isSelected = selectedSportId === sport.id;
        const sportColor = getSportColor(sport.name?.toLowerCase() || '');
        const sportIcon = getSportIcon(sport.name?.toLowerCase() || '');

        return (
          <TouchableOpacity
            key={sport.id}
            style={[
              styles.pill,
              isSelected && { backgroundColor: sportColor },
            ]}
            onPress={() => onSelect(sport.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={sportIcon as any}
              size={16}
              color={isSelected ? colors.white : sportColor}
            />
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextActive,
                !isSelected && { color: sportColor },
              ]}
            >
              {sport.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
  },
});
