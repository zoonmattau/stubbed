import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import {
  fetchESPNEvents,
  type ESPNSportKey,
  type ESPNSearchResult,
} from '@/lib/espn';
import {
  fetchNextEvents,
  fetchPastEvents,
  searchPlayers,
  searchTeams,
  fetchTeamNextEvents,
  type SportsDBLeagueKey,
  type SportsDBSearchResult,
  type SportsDBPlayerResult,
  type SportsDBTeamResult,
} from '@/lib/thesportsdb';
import {
  usePreferencesStore,
  ALL_SPORT_CATEGORIES,
  type SportCategory,
} from '@/stores/preferencesStore';
import { useFavoritesStore } from '@/stores/favoritesStore';

// Unified event type
type UnifiedEvent = ESPNSearchResult | SportsDBSearchResult;

// Combined sport/league definition
interface LeagueOption {
  key: string;
  name: string;
  source: 'espn' | 'sportsdb';
  category: SportCategory;
}

// All leagues organized by sport type
const ALL_LEAGUES: LeagueOption[] = [
  // American Football
  { key: 'nfl', name: 'NFL', source: 'espn', category: 'American Football' },
  { key: 'college_football', name: 'College Football', source: 'espn', category: 'American Football' },
  // Basketball
  { key: 'nba', name: 'NBA', source: 'espn', category: 'Basketball' },
  { key: 'wnba', name: 'WNBA', source: 'espn', category: 'Basketball' },
  { key: 'college_basketball', name: 'College Basketball', source: 'espn', category: 'Basketball' },
  { key: 'euroleague', name: 'EuroLeague', source: 'sportsdb', category: 'Basketball' },
  // Baseball
  { key: 'mlb', name: 'MLB', source: 'espn', category: 'Baseball' },
  // Ice Hockey
  { key: 'nhl', name: 'NHL', source: 'espn', category: 'Ice Hockey' },
  // Soccer
  { key: 'epl', name: 'Premier League', source: 'espn', category: 'Soccer' },
  { key: 'laliga', name: 'La Liga', source: 'espn', category: 'Soccer' },
  { key: 'bundesliga', name: 'Bundesliga', source: 'espn', category: 'Soccer' },
  { key: 'serie_a', name: 'Serie A', source: 'espn', category: 'Soccer' },
  { key: 'ligue_1', name: 'Ligue 1', source: 'espn', category: 'Soccer' },
  { key: 'champions_league', name: 'Champions League', source: 'espn', category: 'Soccer' },
  { key: 'mls', name: 'MLS', source: 'espn', category: 'Soccer' },
  { key: 'aleague', name: 'A-League', source: 'espn', category: 'Soccer' },
  { key: 'eredivisie', name: 'Eredivisie', source: 'sportsdb', category: 'Soccer' },
  { key: 'brasileirao', name: 'Brasileirão', source: 'sportsdb', category: 'Soccer' },
  // Cricket
  { key: 'bbl', name: 'Big Bash League', source: 'sportsdb', category: 'Cricket' },
  { key: 'ipl', name: 'Indian Premier League', source: 'sportsdb', category: 'Cricket' },
  { key: 'the_hundred', name: 'The Hundred', source: 'sportsdb', category: 'Cricket' },
  { key: 'psl', name: 'Pakistan Super League', source: 'sportsdb', category: 'Cricket' },
  { key: 't20_blast', name: 'T20 Blast', source: 'sportsdb', category: 'Cricket' },
  // Australian Football
  { key: 'afl', name: 'AFL', source: 'espn', category: 'Australian Football' },
  // Rugby League
  { key: 'nrl', name: 'NRL', source: 'espn', category: 'Rugby League' },
  // Rugby Union
  { key: 'super_rugby', name: 'Super Rugby', source: 'espn', category: 'Rugby Union' },
  { key: 'six_nations', name: 'Six Nations', source: 'sportsdb', category: 'Rugby Union' },
  { key: 'rugby_championship', name: 'Rugby Championship', source: 'sportsdb', category: 'Rugby Union' },
  // Tennis
  { key: 'atp_tour', name: 'ATP Tour', source: 'sportsdb', category: 'Tennis' },
  { key: 'wta_tour', name: 'WTA Tour', source: 'sportsdb', category: 'Tennis' },
  // Golf
  { key: 'pga_tour', name: 'PGA Tour', source: 'sportsdb', category: 'Golf' },
  { key: 'lpga_tour', name: 'LPGA Tour', source: 'sportsdb', category: 'Golf' },
  { key: 'european_tour', name: 'DP World Tour', source: 'sportsdb', category: 'Golf' },
  // Motorsport
  { key: 'formula_1', name: 'Formula 1', source: 'sportsdb', category: 'Motorsport' },
  { key: 'motogp', name: 'MotoGP', source: 'sportsdb', category: 'Motorsport' },
  { key: 'v8_supercars', name: 'Supercars', source: 'sportsdb', category: 'Motorsport' },
  { key: 'nascar', name: 'NASCAR', source: 'sportsdb', category: 'Motorsport' },
  { key: 'indycar', name: 'IndyCar', source: 'sportsdb', category: 'Motorsport' },
  { key: 'wrc', name: 'WRC', source: 'sportsdb', category: 'Motorsport' },
  // Combat Sports
  { key: 'ufc', name: 'UFC', source: 'sportsdb', category: 'Combat Sports' },
  { key: 'boxing', name: 'Boxing', source: 'sportsdb', category: 'Combat Sports' },
  // Netball
  { key: 'super_netball', name: 'Super Netball', source: 'sportsdb', category: 'Netball' },
];

type SearchType = 'leagues' | 'players' | 'teams';
type ViewMode = 'browse' | 'events' | 'playerResults' | 'teamResults' | 'teamEvents';

export default function SearchEventsScreen() {
  const navigation = useNavigation();
  const [searchType, setSearchType] = useState<SearchType>('leagues');
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedLeague, setSelectedLeague] = useState<LeagueOption | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<SportsDBTeamResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilterQuery, setEventFilterQuery] = useState('');
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [players, setPlayers] = useState<SportsDBPlayerResult[]>([]);
  const [teams, setTeams] = useState<SportsDBTeamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { enabledSports, toggleSport, enableAllSports, disableAllSports } = usePreferencesStore();
  const { addPlayer, removePlayer, isPlayerFavorite, addTeam, removeTeam, isTeamFavorite } = useFavoritesStore();

  // Filter leagues based on enabled sports and search query
  const filteredLeagues = useMemo(() => {
    return ALL_LEAGUES.filter((league) => {
      if (!enabledSports[league.category]) return false;
      if (searchQuery && searchType === 'leagues') {
        const query = searchQuery.toLowerCase();
        return (
          league.name.toLowerCase().includes(query) ||
          league.category.toLowerCase().includes(query) ||
          league.key.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [enabledSports, searchQuery, searchType]);

  // Group filtered leagues by category
  const groupedLeagues = useMemo(() => {
    const groups: Record<string, LeagueOption[]> = {};
    filteredLeagues.forEach((league) => {
      if (!groups[league.category]) {
        groups[league.category] = [];
      }
      groups[league.category].push(league);
    });
    return groups;
  }, [filteredLeagues]);

  const enabledCount = useMemo(() => {
    return Object.values(enabledSports).filter(Boolean).length;
  }, [enabledSports]);

  // Search players or teams when search query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchType === 'players') {
        handleSearchPlayers();
      } else if (searchType === 'teams') {
        handleSearchTeams();
      }
    } else {
      setPlayers([]);
      setTeams([]);
    }
  }, [searchQuery, searchType]);

  const handleSearchPlayers = async () => {
    if (searchQuery.length < 2) return;
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchPlayers(searchQuery);
      setPlayers(results);
      setViewMode('playerResults');
    } catch (err) {
      setError('Failed to search players');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTeams = async () => {
    if (searchQuery.length < 2) return;
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchTeams(searchQuery);
      setTeams(results);
      setViewMode('teamResults');
    } catch (err) {
      setError('Failed to search teams');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events when a league is selected
  useEffect(() => {
    if (selectedLeague) {
      loadEventsForLeague(selectedLeague, showPast);
    }
  }, [selectedLeague, showPast]);

  const loadEventsForLeague = async (league: LeagueOption, past: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      let results: UnifiedEvent[] = [];
      if (league.source === 'espn') {
        results = await fetchESPNEvents(league.key as ESPNSportKey);
      } else {
        if (past) {
          results = await fetchPastEvents(league.key as SportsDBLeagueKey);
        } else {
          results = await fetchNextEvents(league.key as SportsDBLeagueKey);
        }
      }
      setEvents(results);
      setViewMode('events');
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventsForTeam = async (team: SportsDBTeamResult) => {
    setIsLoading(true);
    setError(null);
    setSelectedTeam(team);
    try {
      const results = await fetchTeamNextEvents(team.id);
      setEvents(results);
      setViewMode('teamEvents');
    } catch (err) {
      setError('Failed to load team events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLeague = (league: LeagueOption) => {
    setSelectedLeague(league);
    setEventFilterQuery('');
    setShowPast(false);
  };

  const handleBackToBrowse = () => {
    setViewMode('browse');
    setSelectedLeague(null);
    setSelectedTeam(null);
    setEventFilterQuery('');
    setEvents([]);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/add');
    }
  };

  const handleSelectEvent = (event: UnifiedEvent) => {
    router.push({
      pathname: '/event/manual',
      params: { espnEvent: JSON.stringify(event) },
    });
  };

  const handleTogglePlayerFavorite = (player: SportsDBPlayerResult) => {
    if (isPlayerFavorite(player.id)) {
      removePlayer(player.id);
    } else {
      addPlayer(player);
    }
  };

  const handleToggleTeamFavorite = (team: SportsDBTeamResult) => {
    if (isTeamFavorite(team.id)) {
      removeTeam(team.id);
    } else {
      addTeam(team);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  };

  const getStatusColor = (status: UnifiedEvent['status']) => {
    switch (status) {
      case 'in_progress': return colors.success;
      case 'completed': return colors.textMuted;
      default: return colors.primary;
    }
  };

  const getStatusText = (status: UnifiedEvent['status']) => {
    switch (status) {
      case 'in_progress': return 'LIVE';
      case 'completed': return 'FINAL';
      default: return 'UPCOMING';
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      !eventFilterQuery ||
      event.homeTeam.name.toLowerCase().includes(eventFilterQuery.toLowerCase()) ||
      event.awayTeam.name.toLowerCase().includes(eventFilterQuery.toLowerCase()) ||
      event.venue?.name?.toLowerCase().includes(eventFilterQuery.toLowerCase())
  );

  // Render search type tabs
  const renderSearchTypeTabs = () => (
    <View style={styles.tabsContainer}>
      {(['leagues', 'players', 'teams'] as SearchType[]).map((type) => (
        <TouchableOpacity
          key={type}
          style={[styles.tab, searchType === type && styles.tabActive]}
          onPress={() => {
            setSearchType(type);
            setSearchQuery('');
            setPlayers([]);
            setTeams([]);
            setViewMode('browse');
          }}
        >
          <Text style={[styles.tabText, searchType === type && styles.tabTextActive]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLeagueItem = (league: LeagueOption) => (
    <TouchableOpacity
      key={league.key}
      style={styles.leagueItem}
      onPress={() => handleSelectLeague(league)}
    >
      <Text style={styles.leagueName}>{league.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderPlayerItem = ({ item }: { item: SportsDBPlayerResult }) => {
    const isFavorite = isPlayerFavorite(item.id);
    return (
      <Card style={styles.resultCard}>
        <View style={styles.resultRow}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.playerImage} />
          ) : (
            <View style={[styles.playerImage, styles.placeholderImage]}>
              <Ionicons name="person" size={24} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultSubtext}>{item.team}</Text>
            <Text style={styles.resultMeta}>
              {item.position} · {item.sport}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleTogglePlayerFavorite(item)}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? colors.secondary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderTeamItem = ({ item }: { item: SportsDBTeamResult }) => {
    const isFavorite = isTeamFavorite(item.id);
    return (
      <Card style={styles.resultCard}>
        <TouchableOpacity style={styles.resultRow} onPress={() => loadEventsForTeam(item)}>
          {item.badge ? (
            <Image source={{ uri: item.badge }} style={styles.teamBadge} />
          ) : (
            <View style={[styles.teamBadge, styles.placeholderImage]}>
              <Ionicons name="shield" size={24} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultSubtext}>{item.league}</Text>
            <Text style={styles.resultMeta}>{item.sport}</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleTeamFavorite(item)}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? colors.secondary : colors.textMuted}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEventItem = ({ item }: { item: UnifiedEvent }) => (
    <TouchableOpacity onPress={() => handleSelectEvent(item)}>
      <Card style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventDateContainer}>
            <Text style={styles.eventDate}>{formatEventDate(item.date)}</Text>
            <Text style={styles.eventTime}>{formatEventTime(item.date)}</Text>
          </View>
          <Badge label={getStatusText(item.status)} size="sm" color={getStatusColor(item.status)} />
        </View>
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            {item.awayTeam.logo && <Image source={{ uri: item.awayTeam.logo }} style={styles.teamLogo} />}
            <Text style={styles.teamName} numberOfLines={1}>{item.awayTeam.name}</Text>
            {item.status !== 'scheduled' && <Text style={styles.score}>{item.awayScore || '0'}</Text>}
          </View>
          <View style={styles.teamRow}>
            {item.homeTeam.logo && <Image source={{ uri: item.homeTeam.logo }} style={styles.teamLogo} />}
            <Text style={styles.teamName} numberOfLines={1}>{item.homeTeam.name}</Text>
            {item.status !== 'scheduled' && <Text style={styles.score}>{item.homeScore || '0'}</Text>}
          </View>
        </View>
        {item.venue && (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.venueName} numberOfLines={1}>
              {item.venue.name}{item.venue.city ? `, ${item.venue.city}` : ''}
            </Text>
          </View>
        )}
        <View style={styles.eventFooter}>
          <Text style={styles.leagueText}>{item.league}</Text>
          <View style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Filter Modal
  const renderFilterModal = () => (
    <Modal visible={showFilterModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilterModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Sports</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalActionButton} onPress={enableAllSports}>
            <Text style={styles.modalActionText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalActionButton} onPress={disableAllSports}>
            <Text style={styles.modalActionText}>Deselect All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {ALL_SPORT_CATEGORIES.map((sport) => (
            <View key={sport} style={styles.sportToggleRow}>
              <Text style={styles.sportToggleLabel}>{sport}</Text>
              <Switch
                value={enabledSports[sport]}
                onValueChange={() => toggleSport(sport)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={enabledSports[sport] ? colors.primary : colors.textMuted}
              />
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.modalDoneButton} onPress={() => setShowFilterModal(false)}>
          <Text style={styles.modalDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // Browse view (leagues, players, teams)
  if (viewMode === 'browse' || viewMode === 'playerResults' || viewMode === 'teamResults') {
    return (
      <View style={styles.container}>
        {renderFilterModal()}

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Find Events</Text>
              <Text style={styles.headerSubtitle}>Search leagues, players, or teams</Text>
            </View>
          </View>
        </View>

        {renderSearchTypeTabs()}

        {/* Search Bar */}
        <View style={styles.topSearchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                searchType === 'leagues' ? 'Search leagues...' :
                searchType === 'players' ? 'Search players...' :
                'Search teams...'
              }
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {searchType === 'leagues' && (
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
              <Ionicons name="options-outline" size={22} color={colors.primary} />
              {enabledCount < ALL_SPORT_CATEGORIES.length && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{enabledCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Content based on search type */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchType === 'leagues' ? (
          <ScrollView style={styles.scrollContent}>
            {Object.keys(groupedLeagues).length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsText}>
                  {searchQuery ? `No leagues match "${searchQuery}"` : 'Enable some sports in the filter'}
                </Text>
              </View>
            ) : (
              <>
                {Object.entries(groupedLeagues).map(([category, leagues]) => (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Card style={styles.leaguesCard}>
                      {leagues.map((league) => renderLeagueItem(league))}
                    </Card>
                  </View>
                ))}
                <View style={styles.manualSection}>
                  <Text style={styles.manualText}>Can't find your event?</Text>
                  <TouchableOpacity style={styles.manualButton} onPress={() => router.replace('/event/manual')}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                    <Text style={styles.manualButtonText}>Add Event Manually</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        ) : searchType === 'players' ? (
          searchQuery.length < 2 ? (
            <View style={styles.promptContainer}>
              <Ionicons name="person-outline" size={48} color={colors.textMuted} />
              <Text style={styles.promptTitle}>Search Players</Text>
              <Text style={styles.promptText}>Enter at least 2 characters to search for players</Text>
            </View>
          ) : players.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="person-outline" size={48} color={colors.textMuted} />
              <Text style={styles.noResultsTitle}>No players found</Text>
              <Text style={styles.noResultsText}>Try a different search term</Text>
            </View>
          ) : (
            <FlatList
              data={players}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )
        ) : searchQuery.length < 2 ? (
          <View style={styles.promptContainer}>
            <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
            <Text style={styles.promptTitle}>Search Teams</Text>
            <Text style={styles.promptText}>Enter at least 2 characters to search for teams</Text>
          </View>
        ) : teams.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
            <Text style={styles.noResultsTitle}>No teams found</Text>
            <Text style={styles.noResultsText}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={teams}
            renderItem={renderTeamItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    );
  }

  // Events list view (from league or team)
  return (
    <View style={styles.container}>
      <View style={styles.eventsHeader}>
        <TouchableOpacity onPress={handleBackToBrowse} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eventsHeaderTitle}>
            {selectedTeam?.name || selectedLeague?.name || 'Events'}
          </Text>
        </View>
      </View>

      {/* Toggle Past/Upcoming for league events */}
      {selectedLeague?.source === 'sportsdb' && !selectedTeam && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !showPast && styles.toggleButtonActive]}
            onPress={() => setShowPast(false)}
          >
            <Text style={[styles.toggleText, !showPast && styles.toggleTextActive]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showPast && styles.toggleButtonActive]}
            onPress={() => setShowPast(true)}
          >
            <Text style={[styles.toggleText, showPast && styles.toggleTextActive]}>Recent</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by team or venue..."
            placeholderTextColor={colors.textMuted}
            value={eventFilterQuery}
            onChangeText={setEventFilterQuery}
          />
          {eventFilterQuery.length > 0 && (
            <TouchableOpacity onPress={() => setEventFilterQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (selectedTeam) loadEventsForTeam(selectedTeam);
              else if (selectedLeague) loadEventsForLeague(selectedLeague, showPast);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredEvents.length > 0 ? (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptyText}>
            {showPast ? 'No recent events for this selection' : 'No upcoming events scheduled'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xs,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  topSearchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  categorySection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  categoryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaguesCard: {
    padding: 0,
    overflow: 'hidden',
  },
  leagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leagueName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  manualSection: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  manualText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.full,
  },
  manualButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  promptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  promptTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  promptText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  noResultsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  noResultsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  resultCard: {
    padding: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
  },
  teamBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  resultSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  // Events view styles
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  eventsHeaderTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  eventCard: {
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  eventDateContainer: {
    gap: 2,
  },
  eventDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  eventTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  teamsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  teamName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  score: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    minWidth: 30,
    textAlign: 'right',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  venueName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  leagueText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalActionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  sportToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sportToggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  modalDoneButton: {
    margin: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalDoneText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});
