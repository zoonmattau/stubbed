import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { useEventsStore } from '@/stores/eventsStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface LocationStats {
  name: string;
  code: string;
  count: number;
  events: {
    id: string;
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    date: string;
    sport: string;
  }[];
  subLocations?: Record<string, LocationStats>;
}

// Map venue cities to country/state codes
// This is a simplified mapping - in production you'd use geocoding
const CITY_TO_LOCATION: Record<string, { country: string; region?: string }> = {
  // Australia - Victoria
  'melbourne': { country: 'AU', region: 'VIC' },
  'geelong': { country: 'AU', region: 'VIC' },
  'ballarat': { country: 'AU', region: 'VIC' },
  'bendigo': { country: 'AU', region: 'VIC' },
  // Australia - New South Wales
  'sydney': { country: 'AU', region: 'NSW' },
  'newcastle': { country: 'AU', region: 'NSW' },
  'wollongong': { country: 'AU', region: 'NSW' },
  'gosford': { country: 'AU', region: 'NSW' },
  'parramatta': { country: 'AU', region: 'NSW' },
  // Australia - Queensland
  'brisbane': { country: 'AU', region: 'QLD' },
  'gold coast': { country: 'AU', region: 'QLD' },
  'townsville': { country: 'AU', region: 'QLD' },
  'cairns': { country: 'AU', region: 'QLD' },
  'sunshine coast': { country: 'AU', region: 'QLD' },
  'robina': { country: 'AU', region: 'QLD' },
  // Australia - South Australia
  'adelaide': { country: 'AU', region: 'SA' },
  // Australia - Western Australia
  'perth': { country: 'AU', region: 'WA' },
  'fremantle': { country: 'AU', region: 'WA' },
  // Australia - Tasmania
  'hobart': { country: 'AU', region: 'TAS' },
  'launceston': { country: 'AU', region: 'TAS' },
  // Australia - ACT
  'canberra': { country: 'AU', region: 'ACT' },
  // Australia - Northern Territory
  'darwin': { country: 'AU', region: 'NT' },
  'alice springs': { country: 'AU', region: 'NT' },
  // Stadium name keywords (for when city isn't in name)
  'optus': { country: 'AU', region: 'WA' },
  'mcg': { country: 'AU', region: 'VIC' },
  'scg': { country: 'AU', region: 'NSW' },
  'gabba': { country: 'AU', region: 'QLD' },
  'marvel': { country: 'AU', region: 'VIC' },
  'aami': { country: 'AU', region: 'VIC' },
  'accor': { country: 'AU', region: 'NSW' },
  'suncorp': { country: 'AU', region: 'QLD' },
  'rod laver': { country: 'AU', region: 'VIC' },
  'blundstone': { country: 'AU', region: 'TAS' },
  'gmhba': { country: 'AU', region: 'VIC' },
  // UK
  'london': { country: 'GB', region: 'ENG' },
  'manchester': { country: 'GB', region: 'ENG' },
  'liverpool': { country: 'GB', region: 'ENG' },
  'birmingham': { country: 'GB', region: 'ENG' },
  'leeds': { country: 'GB', region: 'ENG' },
  'cardiff': { country: 'GB', region: 'WAL' },
  'edinburgh': { country: 'GB', region: 'SCO' },
  'glasgow': { country: 'GB', region: 'SCO' },
  // USA
  'new york': { country: 'US', region: 'NY' },
  'los angeles': { country: 'US', region: 'CA' },
  'chicago': { country: 'US', region: 'IL' },
  'miami': { country: 'US', region: 'FL' },
  'boston': { country: 'US', region: 'MA' },
  'dallas': { country: 'US', region: 'TX' },
  'houston': { country: 'US', region: 'TX' },
  'philadelphia': { country: 'US', region: 'PA' },
  'phoenix': { country: 'US', region: 'AZ' },
  'san francisco': { country: 'US', region: 'CA' },
  // NZ
  'auckland': { country: 'NZ', region: 'AKL' },
  'wellington': { country: 'NZ', region: 'WGN' },
  'christchurch': { country: 'NZ', region: 'CAN' },
  // Other
  'tokyo': { country: 'JP' },
  'paris': { country: 'FR' },
  'madrid': { country: 'ES' },
  'barcelona': { country: 'ES' },
  'munich': { country: 'DE' },
  'berlin': { country: 'DE' },
  'rome': { country: 'IT' },
  'milan': { country: 'IT' },
};

const COUNTRY_NAMES: Record<string, string> = {
  'AU': 'Australia',
  'GB': 'United Kingdom',
  'US': 'United States',
  'NZ': 'New Zealand',
  'JP': 'Japan',
  'FR': 'France',
  'ES': 'Spain',
  'DE': 'Germany',
  'IT': 'Italy',
};

const REGION_NAMES: Record<string, Record<string, string>> = {
  'AU': {
    'VIC': 'Victoria',
    'NSW': 'New South Wales',
    'QLD': 'Queensland',
    'SA': 'South Australia',
    'WA': 'Western Australia',
    'TAS': 'Tasmania',
    'NT': 'Northern Territory',
    'ACT': 'Australian Capital Territory',
  },
  'GB': {
    'ENG': 'England',
    'SCO': 'Scotland',
    'WAL': 'Wales',
    'NIR': 'Northern Ireland',
  },
  'US': {
    'NY': 'New York',
    'CA': 'California',
    'IL': 'Illinois',
    'FL': 'Florida',
    'MA': 'Massachusetts',
    'TX': 'Texas',
    'PA': 'Pennsylvania',
    'AZ': 'Arizona',
  },
  'NZ': {
    'AKL': 'Auckland',
    'WGN': 'Wellington',
    'CAN': 'Canterbury',
  },
};

export default function MapStatsScreen() {
  const { attendedEvents } = useEventsStore();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Build location statistics from attended events
  const locationStats = useMemo(() => {
    const stats: Record<string, LocationStats> = {};

    attendedEvents.forEach((attended) => {
      const event = attended.event;
      if (!event) return;

      // Try to determine location from venue data
      const venueCity = (event.venue?.city || '').toLowerCase();
      const venueState = event.venue?.state || '';
      const venueCountry = event.venue?.country || 'AU';
      const venueName = (event.venue?.name || event.venue_name || '').toLowerCase();

      let location: { country: string; region?: string } | undefined;

      // First, use venue's state directly if available from database
      if (venueState && venueCountry) {
        location = { country: venueCountry, region: venueState };
      }

      // Fall back to city-to-location mapping
      if (!location) {
        location = CITY_TO_LOCATION[venueCity];
      }

      // If no direct match, try to find city in venue name
      if (!location) {
        for (const [city, loc] of Object.entries(CITY_TO_LOCATION)) {
          if (venueName.includes(city) || venueCity.includes(city)) {
            location = loc;
            break;
          }
        }
      }

      // Default to Australia with unknown region if no match
      if (!location) {
        location = { country: 'AU' };
      }

      const { country, region } = location;
      const countryName = COUNTRY_NAMES[country] || country;

      // Initialize country if not exists
      if (!stats[country]) {
        stats[country] = {
          name: countryName,
          code: country,
          count: 0,
          events: [],
          subLocations: {},
        };
      }

      // Add event to country
      stats[country].count++;
      stats[country].events.push({
        id: attended.id,
        eventId: attended.event_id,
        homeTeam: event.home_team?.name || event.home_team_name || 'Home',
        awayTeam: event.away_team?.name || event.away_team_name || 'Away',
        venue: event.venue?.name || event.venue_name || 'Unknown Venue',
        date: event.event_date,
        sport: event.sport?.name || 'Sport',
      });

      // Add to region if available
      if (region && stats[country].subLocations) {
        const regionName = REGION_NAMES[country]?.[region] || region;
        if (!stats[country].subLocations![region]) {
          stats[country].subLocations![region] = {
            name: regionName,
            code: region,
            count: 0,
            events: [],
          };
        }
        stats[country].subLocations![region].count++;
        stats[country].subLocations![region].events.push({
          id: attended.id,
          eventId: attended.event_id,
          homeTeam: event.home_team?.name || event.home_team_name || 'Home',
          awayTeam: event.away_team?.name || event.away_team_name || 'Away',
          venue: event.venue?.name || event.venue_name || 'Unknown Venue',
          date: event.event_date,
          sport: event.sport?.name || 'Sport',
        });
      }
    });

    return stats;
  }, [attendedEvents]);

  const countriesVisited = Object.keys(locationStats).length;
  const totalLocations = Object.values(locationStats).reduce(
    (sum, country) => sum + Object.keys(country.subLocations || {}).length,
    0
  );

  const getColorIntensity = (count: number, maxCount: number) => {
    if (count === 0) return colors.surfaceLight;
    const intensity = Math.min(count / maxCount, 1);
    // Interpolate between light and dark primary color
    const lightness = Math.round(90 - intensity * 50);
    return `hsl(211, 70%, ${lightness}%)`;
  };

  const maxCountryCount = Math.max(...Object.values(locationStats).map(c => c.count), 1);
  const selectedCountryData = selectedCountry ? locationStats[selectedCountry] : null;
  const maxRegionCount = selectedCountryData
    ? Math.max(...Object.values(selectedCountryData.subLocations || {}).map(r => r.count), 1)
    : 1;

  const renderCountryGrid = () => {
    const countries = Object.values(locationStats).sort((a, b) => b.count - a.count);

    return (
      <View style={styles.gridContainer}>
        {countries.map((country) => (
          <TouchableOpacity
            key={country.code}
            style={[
              styles.gridItem,
              { backgroundColor: getColorIntensity(country.count, maxCountryCount) },
            ]}
            onPress={() => setSelectedCountry(country.code)}
          >
            <Text style={styles.gridItemFlag}>{getCountryFlag(country.code)}</Text>
            <Text style={styles.gridItemName} numberOfLines={1}>{country.name}</Text>
            <Text style={styles.gridItemCount}>{country.count} events</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRegionGrid = () => {
    if (!selectedCountryData?.subLocations) return null;

    const regions = Object.values(selectedCountryData.subLocations).sort((a, b) => b.count - a.count);

    return (
      <View style={styles.gridContainer}>
        {regions.map((region) => (
          <TouchableOpacity
            key={region.code}
            style={[
              styles.gridItem,
              { backgroundColor: getColorIntensity(region.count, maxRegionCount) },
            ]}
            onPress={() => setSelectedRegion(region.code)}
          >
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.gridItemName} numberOfLines={1}>{region.name}</Text>
            <Text style={styles.gridItemCount}>{region.count} events</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEventsList = () => {
    let events: LocationStats['events'] = [];
    let title = 'Events';

    if (selectedRegion && selectedCountryData?.subLocations?.[selectedRegion]) {
      events = selectedCountryData.subLocations[selectedRegion].events;
      title = `Events in ${selectedCountryData.subLocations[selectedRegion].name}`;
    } else if (selectedCountryData) {
      events = selectedCountryData.events;
      title = `Events in ${selectedCountryData.name}`;
    }

    if (events.length === 0) return null;

    return (
      <View style={styles.eventsSection}>
        <Text style={styles.eventsSectionTitle}>{title}</Text>
        {events.slice(0, 10).map((event) => (
          <TouchableOpacity
            key={event.id}
            onPress={() => router.push(`/event/${event.eventId}`)}
          >
            <Card style={styles.eventCard}>
              <View style={styles.eventRow}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTeams} numberOfLines={1}>
                    {event.homeTeam} vs {event.awayTeam}
                  </Text>
                  <Text style={styles.eventVenue} numberOfLines={1}>
                    {event.venue}
                  </Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.date).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        {events.length > 10 && (
          <Text style={styles.moreEventsText}>
            +{events.length - 10} more events
          </Text>
        )}
      </View>
    );
  };

  const getCountryFlag = (code: string) => {
    const flags: Record<string, string> = {
      'AU': '🇦🇺',
      'GB': '🇬🇧',
      'US': '🇺🇸',
      'NZ': '🇳🇿',
      'JP': '🇯🇵',
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'DE': '🇩🇪',
      'IT': '🇮🇹',
    };
    return flags[code] || '🏳️';
  };

  const getBreadcrumb = () => {
    const parts = [{ label: 'World', onPress: () => { setSelectedCountry(null); setSelectedRegion(null); } }];

    if (selectedCountry && selectedCountryData) {
      parts.push({
        label: selectedCountryData.name,
        onPress: () => setSelectedRegion(null),
      });
    }

    if (selectedRegion && selectedCountryData?.subLocations?.[selectedRegion]) {
      parts.push({
        label: selectedCountryData.subLocations[selectedRegion].name,
        onPress: () => {},
      });
    }

    return parts;
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/stats');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Places You've Been</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{countriesVisited}</Text>
            <Text style={styles.summaryLabel}>Countries</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{totalLocations}</Text>
            <Text style={styles.summaryLabel}>Regions</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{attendedEvents.length}</Text>
            <Text style={styles.summaryLabel}>Total Events</Text>
          </View>
        </View>

        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumb}>
          {getBreadcrumb().map((part, index, arr) => (
            <View key={index} style={styles.breadcrumbItem}>
              <TouchableOpacity onPress={part.onPress}>
                <Text style={[
                  styles.breadcrumbText,
                  index === arr.length - 1 && styles.breadcrumbTextActive,
                ]}>
                  {part.label}
                </Text>
              </TouchableOpacity>
              {index < arr.length - 1 && (
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              )}
            </View>
          ))}
        </View>

        {/* Location Grid */}
        {!selectedCountry && (
          <>
            <Text style={styles.sectionTitle}>Countries Visited</Text>
            {countriesVisited === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="globe-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No locations yet</Text>
                <Text style={styles.emptyText}>
                  Add events to start tracking where you've been
                </Text>
              </View>
            ) : (
              renderCountryGrid()
            )}
          </>
        )}

        {selectedCountry && !selectedRegion && (
          <>
            <Text style={styles.sectionTitle}>
              Regions in {selectedCountryData?.name}
            </Text>
            {renderRegionGrid()}
          </>
        )}

        {/* Events List */}
        {(selectedCountry || selectedRegion) && renderEventsList()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  breadcrumbTextActive: {
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: (screenWidth - spacing.lg * 2 - spacing.md * 2) / 3,
    minHeight: 100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemFlag: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  gridItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  gridItemCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  eventsSection: {
    marginTop: spacing.xl,
  },
  eventsSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  eventCard: {
    marginBottom: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTeams: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  eventVenue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  eventDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  moreEventsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
