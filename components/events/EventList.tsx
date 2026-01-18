import React from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { EventCard } from './EventCard';
import { colors, spacing, fontSize } from '@/constants/theme';
import type { AttendedEventWithDetails } from '@/types';

interface EventListProps {
  events: AttendedEventWithDetails[];
  onEventPress?: (eventId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
  compact?: boolean;
}

export function EventList({
  events,
  onEventPress,
  onRefresh,
  refreshing = false,
  emptyMessage = 'No events found',
  compact = false,
}: EventListProps) {
  const renderItem = ({ item }: { item: AttendedEventWithDetails }) => (
    <EventCard
      event={item.event!}
      attendance={item}
      onPress={() => onEventPress?.(item.event_id)}
      compact={compact}
    />
  );

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
