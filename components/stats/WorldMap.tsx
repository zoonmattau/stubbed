import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const MAP_WIDTH = screenWidth - 64;

// All countries with their approximate position on a grid-based world map
// Grid is roughly 20x10 cells representing the world
const ALL_COUNTRIES: { code: string; name: string; x: number; y: number }[] = [
  // North America
  { code: 'CA', name: 'Canada', x: 2, y: 1 },
  { code: 'US', name: 'USA', x: 2, y: 2 },
  { code: 'MX', name: 'Mexico', x: 2, y: 3 },

  // Central America & Caribbean
  { code: 'CU', name: 'Cuba', x: 3, y: 3 },

  // South America
  { code: 'BR', name: 'Brazil', x: 4, y: 5 },
  { code: 'AR', name: 'Argentina', x: 3, y: 7 },
  { code: 'CL', name: 'Chile', x: 3, y: 6 },
  { code: 'CO', name: 'Colombia', x: 3, y: 4 },

  // Europe
  { code: 'GB', name: 'UK', x: 8, y: 2 },
  { code: 'IE', name: 'Ireland', x: 7, y: 2 },
  { code: 'FR', name: 'France', x: 8, y: 3 },
  { code: 'ES', name: 'Spain', x: 8, y: 3 },
  { code: 'PT', name: 'Portugal', x: 7, y: 3 },
  { code: 'DE', name: 'Germany', x: 9, y: 2 },
  { code: 'IT', name: 'Italy', x: 9, y: 3 },
  { code: 'NL', name: 'Netherlands', x: 9, y: 2 },
  { code: 'BE', name: 'Belgium', x: 9, y: 2 },
  { code: 'SE', name: 'Sweden', x: 9, y: 1 },
  { code: 'NO', name: 'Norway', x: 9, y: 1 },
  { code: 'PL', name: 'Poland', x: 10, y: 2 },
  { code: 'RU', name: 'Russia', x: 13, y: 1 },

  // Africa
  { code: 'EG', name: 'Egypt', x: 10, y: 4 },
  { code: 'ZA', name: 'South Africa', x: 10, y: 7 },
  { code: 'NG', name: 'Nigeria', x: 9, y: 5 },
  { code: 'KE', name: 'Kenya', x: 11, y: 5 },
  { code: 'MA', name: 'Morocco', x: 8, y: 4 },

  // Middle East
  { code: 'AE', name: 'UAE', x: 12, y: 4 },
  { code: 'SA', name: 'Saudi Arabia', x: 11, y: 4 },
  { code: 'TR', name: 'Turkey', x: 10, y: 3 },

  // Asia
  { code: 'CN', name: 'China', x: 14, y: 3 },
  { code: 'JP', name: 'Japan', x: 16, y: 3 },
  { code: 'KR', name: 'South Korea', x: 15, y: 3 },
  { code: 'IN', name: 'India', x: 13, y: 4 },
  { code: 'TH', name: 'Thailand', x: 14, y: 5 },
  { code: 'SG', name: 'Singapore', x: 14, y: 5 },
  { code: 'MY', name: 'Malaysia', x: 14, y: 5 },
  { code: 'ID', name: 'Indonesia', x: 15, y: 6 },
  { code: 'PH', name: 'Philippines', x: 16, y: 5 },

  // Oceania
  { code: 'AU', name: 'Australia', x: 16, y: 7 },
  { code: 'NZ', name: 'New Zealand', x: 18, y: 8 },
  { code: 'FJ', name: 'Fiji', x: 18, y: 7 },
];

// Group countries by approximate region for the visual map
const REGIONS = [
  { name: 'North America', countries: ['CA', 'US', 'MX', 'CU'], color: '#E8F5E9' },
  { name: 'South America', countries: ['BR', 'AR', 'CL', 'CO'], color: '#FFF3E0' },
  { name: 'Europe', countries: ['GB', 'IE', 'FR', 'ES', 'PT', 'DE', 'IT', 'NL', 'BE', 'SE', 'NO', 'PL', 'RU'], color: '#E3F2FD' },
  { name: 'Africa', countries: ['EG', 'ZA', 'NG', 'KE', 'MA'], color: '#FFF8E1' },
  { name: 'Asia', countries: ['CN', 'JP', 'KR', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'AE', 'SA', 'TR'], color: '#FCE4EC' },
  { name: 'Oceania', countries: ['AU', 'NZ', 'FJ'], color: '#E0F7FA' },
];

interface WorldMapProps {
  visitedCountries: string[];
  onCountryPress?: (code: string) => void;
}

export function WorldMap({ visitedCountries, onCountryPress }: WorldMapProps) {
  const visitedSet = new Set(visitedCountries);
  const visitedByRegion = REGIONS.map(region => ({
    ...region,
    visitedCount: region.countries.filter(c => visitedSet.has(c)).length,
    totalCount: region.countries.length,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.mapGrid}>
        {visitedByRegion.map((region, index) => {
          const hasVisited = region.visitedCount > 0;
          return (
            <TouchableOpacity
              key={region.name}
              style={[
                styles.regionBlock,
                { backgroundColor: hasVisited ? colors.primary : region.color },
                hasVisited && styles.regionVisited,
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.regionName,
                hasVisited && styles.regionNameVisited,
              ]} numberOfLines={1}>
                {region.name}
              </Text>
              {hasVisited && (
                <Text style={styles.regionCount}>
                  {region.visitedCount}/{region.totalCount}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Visited</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={styles.legendText}>Not Visited</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  regionBlock: {
    width: (MAP_WIDTH - spacing.sm * 3) / 3,
    aspectRatio: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionVisited: {
    borderColor: colors.primaryDark || colors.primary,
  },
  regionName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  regionNameVisited: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  regionCount: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
