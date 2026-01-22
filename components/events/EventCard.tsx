import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/dates';
import { getSportColor, SPORTS } from '@/constants/sports';
import { parseTennisScore } from '@/utils/scores';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import type { EventWithDetails, AttendedEventWithDetails } from '@/types';

// Helper to get display name from sport code
function getSportDisplayName(sportCode: string | null | undefined): string {
  if (!sportCode) return 'Sport';
  // Try to find in SPORTS constant
  const sport = SPORTS.find(s => s.id.toLowerCase() === sportCode.toLowerCase());
  if (sport) return sport.name;
  // Fallback: capitalize first letter
  return sportCode.charAt(0).toUpperCase() + sportCode.slice(1);
}

interface EventCardProps {
  event: EventWithDetails;
  attendance?: AttendedEventWithDetails;
  onPress?: () => void;
  compact?: boolean;
  mini?: boolean;
}

export function EventCard({ event, attendance, onPress, compact = false, mini = false }: EventCardProps) {
  const { getTeamLogo } = useTeamLogos();

  // Use text fields as fallback for manually entered events
  const homeTeamName = event.home_team?.name || event.home_team_name || 'Home Team';
  const awayTeamName = event.away_team?.name || event.away_team_name || 'Away Team';
  const homeTeamShort = event.home_team?.short_name || event.home_team_name || 'Home';
  const awayTeamShort = event.away_team?.short_name || event.away_team_name || 'Away';
  const venueName = event.venue?.name || event.venue_name;
  const sportName = getSportDisplayName(event.sport?.name || event.sport_name);
  const sportColor = getSportColor(sportName.toLowerCase());

  // Get logos - try FK first, then lookup by name
  const homeTeamLogo = event.home_team?.logo_url || getTeamLogo(homeTeamName);
  const awayTeamLogo = event.away_team?.logo_url || getTeamLogo(awayTeamName);

  // Mini version - fun card style with team logos and gradient
  if (mini) {
    const isCricket = sportName.toLowerCase() === 'cricket';
    const isTennis = sportName.toLowerCase() === 'tennis';

    // For tennis, parse the score string to determine winner
    const tennisResult = isTennis ? parseTennisScore(event.home_score) : null;

    // Parse cricket score to get runs and wickets
    const parseCricketScore = (score: string | number | null | undefined): { runs: number; wickets: number } => {
      if (score === null || score === undefined) return { runs: 0, wickets: 10 };
      const scoreStr = String(score);
      if (scoreStr.includes('+')) {
        // Test match with multiple innings - sum runs, use last innings wickets
        const innings = scoreStr.split('+').map(s => s.trim());
        const totalRuns = innings.reduce((total, inning) => {
          const runs = inning.includes('/') ? parseInt(inning.split('/')[0], 10) : parseInt(inning, 10);
          return total + (runs || 0);
        }, 0);
        const lastInning = innings[innings.length - 1];
        const wickets = lastInning.includes('/') ? parseInt(lastInning.split('/')[1], 10) || 10 : 10;
        return { runs: totalRuns, wickets };
      }
      if (scoreStr.includes('/')) {
        const [runs, wickets] = scoreStr.split('/');
        return { runs: parseInt(runs, 10) || 0, wickets: parseInt(wickets, 10) || 10 };
      }
      return { runs: parseInt(scoreStr, 10) || 0, wickets: 10 };
    };

    // For cricket, extract runs from "450/10" format
    // Also supports combined innings like "450+280" or "450/10+280/10"
    const parseScore = (score: string | number | null | undefined): number => {
      if (score === null || score === undefined) return 0;
      if (isCricket) {
        return parseCricketScore(score).runs;
      }
      const scoreStr = String(score);
      return parseInt(scoreStr, 10) || 0;
    };

    const homeScoreNum = parseScore(event.home_score);
    const awayScoreNum = parseScore(event.away_score);

    // Determine winner - tennis uses parsed result, others use score comparison
    let hasScore = false;
    let homeWon = false;
    let awayWon = false;
    let isDraw = false;
    let margin = 0;
    let winnerName = '';

    if (isTennis && tennisResult) {
      hasScore = tennisResult.sets.length > 0;
      homeWon = tennisResult.winner === 'home';
      awayWon = tennisResult.winner === 'away';
      isDraw = tennisResult.winner === 'draw';
      margin = Math.abs(tennisResult.player1Sets - tennisResult.player2Sets);
      winnerName = homeWon ? homeTeamShort : awayTeamShort;
    } else {
      hasScore = event.home_score !== null && event.away_score !== null;
      homeWon = hasScore && homeScoreNum > awayScoreNum;
      awayWon = hasScore && awayScoreNum > homeScoreNum;
      isDraw = hasScore && homeScoreNum === awayScoreNum;
      margin = Math.abs(homeScoreNum - awayScoreNum);
      winnerName = homeWon ? homeTeamShort : awayTeamShort;
    }

    // Format cricket scores to show innings nicely
    const formatCricketScore = (score: string | number | null | undefined): { total: number; innings: string[] } => {
      if (score === null || score === undefined) return { total: 0, innings: [] };
      const scoreStr = String(score);
      if (scoreStr.includes('+')) {
        const parts = scoreStr.split('+').map(s => s.trim());
        const total = parts.reduce((sum, inning) => {
          const runs = inning.includes('/') ? parseInt(inning.split('/')[0], 10) : parseInt(inning, 10);
          return sum + (runs || 0);
        }, 0);
        return { total, innings: parts };
      }
      return { total: parseScore(score), innings: [scoreStr] };
    };

    const homeScoreData = isCricket ? formatCricketScore(event.home_score) : null;
    const awayScoreData = isCricket ? formatCricketScore(event.away_score) : null;

    // Calculate cricket result text - wickets if team batting second wins, runs otherwise
    const getCricketResultText = (): string => {
      if (homeWon) {
        // Home team batted first and won = won by runs
        return `${Math.abs(homeScoreNum - awayScoreNum)} runs`;
      } else if (awayWon) {
        // Away team batted second and won = won by wickets remaining
        const awayParsed = parseCricketScore(event.away_score);
        const wicketsRemaining = 10 - awayParsed.wickets;
        return `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
      }
      return '';
    };

    return (
      <Card onPress={onPress} style={styles.miniContainer}>
        <View style={styles.miniContent}>
          {/* Top row - Sport badge, competition, and date */}
          <View style={styles.miniHeader}>
            <View style={styles.miniHeaderLeft}>
              <Badge label={sportName} size="sm" color={sportColor} />
              {event.competition && (
                <Text style={styles.miniCompetition} numberOfLines={1}>{event.competition}</Text>
              )}
            </View>
            <Text style={styles.miniDate}>{formatDate(event.event_date)}</Text>
          </View>

          {/* Main content - Teams and score */}
          <View style={styles.miniMatchup}>
            {/* Home Team */}
            <View style={styles.miniTeam}>
              {homeTeamLogo ? (
                <Image source={{ uri: homeTeamLogo }} style={styles.miniTeamLogo} />
              ) : (
                <View style={[styles.miniTeamLogoPlaceholder, { backgroundColor: sportColor }]}>
                  <Text style={styles.miniTeamLogoText}>
                    {homeTeamShort[0]}
                  </Text>
                </View>
              )}
              <Text style={[styles.miniTeamName, homeWon && styles.miniTeamNameWinner]} numberOfLines={1}>
                {homeTeamShort}
              </Text>
              {homeWon && <View style={[styles.miniWinIndicator, { backgroundColor: sportColor }]} />}
            </View>

            {/* Score/VS */}
            <View style={styles.miniScoreContainer}>
              {hasScore ? (
                <>
                  {/* Tennis - show set scores */}
                  {isTennis && tennisResult ? (
                    <View style={styles.miniScoreBox}>
                      <Text style={[styles.miniScoreText, homeWon && styles.miniScoreWinner]}>
                        {tennisResult.player1Sets}
                      </Text>
                      <Text style={styles.miniScoreDivider}>-</Text>
                      <Text style={[styles.miniScoreText, awayWon && styles.miniScoreWinner]}>
                        {tennisResult.player2Sets}
                      </Text>
                    </View>
                  ) : isCricket && homeScoreData && awayScoreData && homeScoreData.innings.length > 1 ? (
                    /* Test cricket with multiple innings - stacked layout */
                    <View style={styles.miniCricketScores}>
                      <View style={styles.miniCricketScoreColumn}>
                        {homeScoreData.innings.map((inn, i) => (
                          <Text key={i} style={[styles.miniCricketInning, homeWon && styles.miniCricketInningWinner]}>
                            {inn}
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.miniCricketDivider}>v</Text>
                      <View style={styles.miniCricketScoreColumn}>
                        {awayScoreData.innings.map((inn, i) => (
                          <Text key={i} style={[styles.miniCricketInning, awayWon && styles.miniCricketInningWinner]}>
                            {inn}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ) : (
                    /* Standard layout for all other sports and single-innings cricket */
                    <View style={styles.miniScoreBox}>
                      <Text style={[styles.miniScoreText, homeWon && styles.miniScoreWinner]}>
                        {event.home_score}
                      </Text>
                      <Text style={styles.miniScoreDivider}>-</Text>
                      <Text style={[styles.miniScoreText, awayWon && styles.miniScoreWinner]}>
                        {event.away_score}
                      </Text>
                    </View>
                  )}
                  {isDraw ? (
                    <Text style={styles.miniDrawLabel}>DRAW</Text>
                  ) : (
                    <View style={styles.miniMarginContainer}>
                      <Text style={styles.miniMarginText}>
                        {winnerName} won{isTennis
                          ? ` ${margin} set${margin !== 1 ? 's' : ''} to ${(tennisResult?.winner === 'home' ? tennisResult?.player2Sets : tennisResult?.player1Sets) || 0}`
                          : isCricket
                          ? ` by ${getCricketResultText()}`
                          : ` by ${margin}`}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.miniVs}>VS</Text>
              )}
            </View>

            {/* Away Team */}
            <View style={styles.miniTeam}>
              {awayTeamLogo ? (
                <Image source={{ uri: awayTeamLogo }} style={styles.miniTeamLogo} />
              ) : (
                <View style={[styles.miniTeamLogoPlaceholder, { backgroundColor: sportColor }]}>
                  <Text style={styles.miniTeamLogoText}>
                    {awayTeamShort[0]}
                  </Text>
                </View>
              )}
              <Text style={[styles.miniTeamName, awayWon && styles.miniTeamNameWinner]} numberOfLines={1}>
                {awayTeamShort}
              </Text>
              {awayWon && <View style={[styles.miniWinIndicator, { backgroundColor: sportColor }]} />}
            </View>
          </View>

          {/* Bottom row - Rating on left, Venue on right */}
          <View style={styles.miniFooter}>
            {attendance?.rating ? (
              <View style={styles.miniRating}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const fullStar = star <= Math.floor(attendance.rating!);
                  const halfStar = !fullStar && star === Math.ceil(attendance.rating!) && attendance.rating! % 1 !== 0;
                  return (
                    <Ionicons
                      key={star}
                      name={fullStar ? 'star' : halfStar ? 'star-half' : 'star-outline'}
                      size={14}
                      color={colors.gold}
                    />
                  );
                })}
              </View>
            ) : (
              <View />
            )}
            {venueName ? (
              <View style={styles.miniVenue}>
                <Ionicons name="location" size={12} color={colors.textSecondary} />
                <Text style={styles.miniVenueText} numberOfLines={1}>{venueName}</Text>
              </View>
            ) : (
              <View />
            )}
          </View>
        </View>
      </Card>
    );
  }

  // Regular card - calculate winner info
  const isCricketRegular = sportName.toLowerCase() === 'cricket';
  const isTennisRegular = sportName.toLowerCase() === 'tennis';
  const tennisResultRegular = isTennisRegular ? parseTennisScore(event.home_score) : null;

  // Parse cricket score to get runs and wickets
  const parseCricketScoreRegular = (score: string | number | null | undefined): { runs: number; wickets: number } => {
    if (score === null || score === undefined) return { runs: 0, wickets: 10 };
    const scoreStr = String(score);
    if (scoreStr.includes('+')) {
      const innings = scoreStr.split('+').map(s => s.trim());
      const totalRuns = innings.reduce((total, inning) => {
        const runs = inning.includes('/') ? parseInt(inning.split('/')[0], 10) : parseInt(inning, 10);
        return total + (runs || 0);
      }, 0);
      const lastInning = innings[innings.length - 1];
      const wickets = lastInning.includes('/') ? parseInt(lastInning.split('/')[1], 10) || 10 : 10;
      return { runs: totalRuns, wickets };
    }
    if (scoreStr.includes('/')) {
      const [runs, wickets] = scoreStr.split('/');
      return { runs: parseInt(runs, 10) || 0, wickets: parseInt(wickets, 10) || 10 };
    }
    return { runs: parseInt(scoreStr, 10) || 0, wickets: 10 };
  };

  const parseScoreRegular = (score: string | number | null | undefined): number => {
    if (score === null || score === undefined) return 0;
    if (isCricketRegular) {
      return parseCricketScoreRegular(score).runs;
    }
    const scoreStr = String(score);
    return parseInt(scoreStr, 10) || 0;
  };

  const homeScoreNumRegular = parseScoreRegular(event.home_score);
  const awayScoreNumRegular = parseScoreRegular(event.away_score);

  // Determine winner - tennis uses parsed result, others use score comparison
  let hasScoreRegular = false;
  let homeWonRegular = false;
  let awayWonRegular = false;
  let isDrawRegular = false;
  let marginRegular = 0;
  let winnerNameRegular = '';

  if (isTennisRegular && tennisResultRegular) {
    hasScoreRegular = tennisResultRegular.sets.length > 0;
    homeWonRegular = tennisResultRegular.winner === 'home';
    awayWonRegular = tennisResultRegular.winner === 'away';
    isDrawRegular = tennisResultRegular.winner === 'draw';
    marginRegular = Math.abs(tennisResultRegular.player1Sets - tennisResultRegular.player2Sets);
    winnerNameRegular = homeWonRegular ? homeTeamShort : awayTeamShort;
  } else {
    hasScoreRegular = event.home_score !== null && event.away_score !== null;
    homeWonRegular = hasScoreRegular && homeScoreNumRegular > awayScoreNumRegular;
    awayWonRegular = hasScoreRegular && awayScoreNumRegular > homeScoreNumRegular;
    isDrawRegular = hasScoreRegular && homeScoreNumRegular === awayScoreNumRegular;
    marginRegular = Math.abs(homeScoreNumRegular - awayScoreNumRegular);
    winnerNameRegular = homeWonRegular ? homeTeamShort : awayTeamShort;
  }

  // Calculate cricket result text - wickets if team batting second wins, runs otherwise
  const getCricketResultTextRegular = (): string => {
    const awayParsed = parseCricketScoreRegular(event.away_score);
    if (homeWonRegular) {
      // Home team batted first and won = won by runs
      return `${Math.abs(homeScoreNumRegular - awayScoreNumRegular)} runs`;
    } else if (awayWonRegular) {
      // Away team batted second and won = won by wickets remaining
      const wicketsRemaining = 10 - awayParsed.wickets;
      return `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    }
    return '';
  };

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={[styles.sportIndicator, { backgroundColor: sportColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Badge
              label={sportName}
              size="sm"
              color={sportColor}
            />
            {event.competition && (
              <Text style={styles.competition}>{event.competition}</Text>
            )}
          </View>
          <Text style={styles.headerDate}>{formatDate(event.event_date)}</Text>
        </View>

        <View style={styles.teams}>
          <View style={styles.team}>
            {homeTeamLogo ? (
              <Image
                source={{ uri: homeTeamLogo }}
                style={styles.teamLogo}
              />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                <Text style={styles.teamLogoText}>
                  {homeTeamShort[0]}
                </Text>
              </View>
            )}
            <Text style={[styles.teamName, homeWonRegular && styles.teamNameWinner]} numberOfLines={1}>
              {homeTeamName}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            {hasScoreRegular ? (
              <>
                {isTennisRegular && tennisResultRegular ? (
                  <>
                    <Text style={[styles.score, homeWonRegular && styles.scoreWinner, awayWonRegular && styles.scoreLoser]}>
                      {tennisResultRegular.player1Sets}
                    </Text>
                    <Text style={styles.scoreDivider}>-</Text>
                    <Text style={[styles.score, awayWonRegular && styles.scoreWinner, homeWonRegular && styles.scoreLoser]}>
                      {tennisResultRegular.player2Sets}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.score, homeWonRegular && styles.scoreWinner, awayWonRegular && styles.scoreLoser]}>
                      {event.home_score}
                    </Text>
                    <Text style={styles.scoreDivider}>-</Text>
                    <Text style={[styles.score, awayWonRegular && styles.scoreWinner, homeWonRegular && styles.scoreLoser]}>
                      {event.away_score}
                    </Text>
                  </>
                )}
              </>
            ) : (
              <Text style={styles.vs}>vs</Text>
            )}
          </View>

          <View style={[styles.team, styles.teamRight]}>
            {awayTeamLogo ? (
              <Image
                source={{ uri: awayTeamLogo }}
                style={styles.teamLogo}
              />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                <Text style={styles.teamLogoText}>
                  {awayTeamShort[0]}
                </Text>
              </View>
            )}
            <Text style={[styles.teamName, awayWonRegular && styles.teamNameWinner]} numberOfLines={1}>
              {awayTeamName}
            </Text>
          </View>
        </View>

        {/* Result message */}
        {hasScoreRegular && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              {isDrawRegular
                ? 'Draw'
                : isTennisRegular && tennisResultRegular
                ? `${winnerNameRegular} won ${tennisResultRegular.winner === 'home' ? tennisResultRegular.player1Sets : tennisResultRegular.player2Sets}-${tennisResultRegular.winner === 'home' ? tennisResultRegular.player2Sets : tennisResultRegular.player1Sets}`
                : isCricketRegular
                ? `${winnerNameRegular} won by ${getCricketResultTextRegular()}`
                : `${winnerNameRegular} won by ${marginRegular}`}
            </Text>
          </View>
        )}

        {!compact && (event.event_time || venueName) && (
          <View style={styles.details}>
            {event.event_time && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{formatTime(event.event_time)}</Text>
              </View>
            )}
            {venueName && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {venueName}
                </Text>
              </View>
            )}
          </View>
        )}

        {attendance && (
          <View style={styles.attendanceInfo}>
            {attendance.rating && (
              <View style={styles.rating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= attendance.rating! ? 'star' : 'star-outline'}
                    size={14}
                    color={colors.gold}
                  />
                ))}
              </View>
            )}
            {attendance.is_favorite && (
              <Ionicons name="heart" size={16} color={colors.error} />
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Mini styles - Clean card design
  miniContainer: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  miniContent: {
    padding: spacing.md,
  },
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  miniHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  miniCompetition: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  miniDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  miniMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  miniTeam: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniTeamLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  miniTeamLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTeamLogoText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.lg,
  },
  miniTeamName: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    maxWidth: 80,
  },
  miniTeamNameWinner: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  miniWinIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  miniScoreContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  miniScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  miniScoreText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  miniScoreWinner: {
    color: colors.primary,
  },
  miniScoreDivider: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  miniVs: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  miniDrawLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  miniMarginContainer: {
    marginTop: spacing.xs,
  },
  miniMarginText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  // Cricket-specific score styles
  miniCricketScores: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  miniCricketScoreColumn: {
    alignItems: 'center',
  },
  miniCricketInning: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  miniCricketInningWinner: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  miniCricketTotal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  miniCricketTotalWinner: {
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  miniCricketDivider: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  miniFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  miniVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  miniVenueText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  miniRating: {
    flexDirection: 'row',
    gap: 2,
  },

  // Regular styles
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sportIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  competition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamRight: {
    alignItems: 'center',
  },
  teamLogo: {
    width: 40,
    height: 40,
  },
  teamLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.lg,
  },
  teamName: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  teamNameWinner: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  score: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scoreWinner: {
    color: colors.primary,
  },
  scoreLoser: {
    color: colors.textMuted,
  },
  scoreDivider: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  vs: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resultText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
});
