import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/dates';
import { getSportColor, SPORTS, isRacingSport } from '@/constants/sports';
import { parseTennisScore } from '@/utils/scores';
import { useTeamLogos } from '@/hooks/useTeamLogos';
import type { EventWithDetails, AttendedEventWithDetails } from '@/types';

function getSportDisplayName(sportCode: string | null | undefined): string {
  if (!sportCode) return 'Sport';
  const sport = SPORTS.find(s => s.id.toLowerCase() === sportCode.toLowerCase());
  if (sport) return sport.name;
  return sportCode.charAt(0).toUpperCase() + sportCode.slice(1);
}

// Community stats passed from EventList
export interface EventCardStats {
  attendeeCount: number;
  avgRating: number | null;
  avgAtmosphere: number | null;
}

interface EventCardProps {
  event: EventWithDetails;
  attendance?: AttendedEventWithDetails;
  onPress?: () => void;
  compact?: boolean;
  mini?: boolean;
  stats?: EventCardStats;
}

// Shared score parsing
function parseCricketScore(score: string | number | null | undefined): { runs: number; wickets: number } {
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
}

function parseScoreNum(score: string | number | null | undefined, isCricket: boolean): number {
  if (score === null || score === undefined) return 0;
  if (isCricket) return parseCricketScore(score).runs;
  return parseInt(String(score), 10) || 0;
}

function formatCricketScoreData(score: string | number | null | undefined, isCricket: boolean): { total: number; innings: string[] } {
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
  return { total: parseScoreNum(score, isCricket), innings: [scoreStr] };
}

function computeMatchResult(event: EventWithDetails) {
  const sportName = getSportDisplayName(event.sport?.name || event.sport_name);
  const isCricket = sportName.toLowerCase() === 'cricket';
  const isTennis = sportName.toLowerCase() === 'tennis';
  const sportId = event.sport?.name?.toLowerCase() || event.sport_name?.toLowerCase() || '';
  const isRacing = isRacingSport(sportId) || isRacingSport(event.sport?.id || '');

  const tennisResult = isTennis ? parseTennisScore(event.home_score) : null;
  const homeScoreNum = parseScoreNum(event.home_score, isCricket);
  const awayScoreNum = parseScoreNum(event.away_score, isCricket);

  let hasScore = false;
  let homeWon = false;
  let awayWon = false;
  let isDraw = false;
  let margin = 0;

  if (isTennis && tennisResult) {
    hasScore = tennisResult.sets.length > 0;
    homeWon = tennisResult.winner === 'home';
    awayWon = tennisResult.winner === 'away';
    isDraw = tennisResult.winner === 'draw';
    margin = Math.abs(tennisResult.player1Sets - tennisResult.player2Sets);
  } else if (isRacing) {
    hasScore = event.home_score !== null;
  } else {
    hasScore = event.home_score !== null && event.away_score !== null;
    homeWon = hasScore && homeScoreNum > awayScoreNum;
    awayWon = hasScore && awayScoreNum > homeScoreNum;
    isDraw = hasScore && homeScoreNum === awayScoreNum;
    margin = Math.abs(homeScoreNum - awayScoreNum);
  }

  const homeScoreData = isCricket ? formatCricketScoreData(event.home_score, isCricket) : null;
  const awayScoreData = isCricket ? formatCricketScoreData(event.away_score, isCricket) : null;
  const isTestMatch = isCricket && homeScoreData && homeScoreData.innings.length > 1;

  const getCricketResultText = (): string => {
    if (homeWon) return `${Math.abs(homeScoreNum - awayScoreNum)} runs`;
    if (awayWon) {
      const awayParsed = parseCricketScore(event.away_score);
      const wicketsRemaining = 10 - awayParsed.wickets;
      return `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    }
    return '';
  };

  return {
    sportName, isCricket, isTennis, isRacing, tennisResult,
    homeScoreNum, awayScoreNum, hasScore, homeWon, awayWon, isDraw, margin,
    homeScoreData, awayScoreData, isTestMatch, getCricketResultText,
  };
}

export function EventCard({ event, attendance, onPress, compact = false, mini = false, stats }: EventCardProps) {
  const { getTeamLogo } = useTeamLogos();

  const homeTeamName = event.home_team?.name || event.home_team_name || 'Home Team';
  const awayTeamName = event.away_team?.name || event.away_team_name || 'Away Team';
  const homeTeamShort = event.home_team?.short_name || event.home_team_name || 'Home';
  const awayTeamShort = event.away_team?.short_name || event.away_team_name || 'Away';
  const venueName = event.venue?.name || event.venue_name;
  const sportName = getSportDisplayName(event.sport?.name || event.sport_name);
  const sportColor = getSportColor(sportName.toLowerCase());

  const homeTeamLogo = event.home_team?.logo_url || getTeamLogo(homeTeamName);
  const awayTeamLogo = event.away_team?.logo_url || getTeamLogo(awayTeamName);

  const result = computeMatchResult(event);
  const winnerName = result.homeWon ? homeTeamShort : awayTeamShort;

  // =============================================
  // MINI VIEW
  // =============================================
  if (mini) {
    if (result.isRacing) {
      return (
        <Card onPress={onPress} style={styles.miniContainer}>
          <View style={styles.miniContent}>
            <View style={styles.miniHeader}>
              <View style={styles.miniHeaderLeft}>
                <Badge label={sportName} size="sm" color={sportColor} />
                {event.competition && (
                  <Text style={styles.miniCompetition} numberOfLines={1}>{event.competition}</Text>
                )}
              </View>
              <Text style={styles.miniDate}>{formatDate(event.event_date)}</Text>
            </View>
            <View style={styles.racingContent}>
              <View style={[styles.racingIcon, { backgroundColor: `${sportColor}20` }]}>
                <Ionicons name="flag" size={24} color={sportColor} />
              </View>
              <View style={styles.racingDetails}>
                <Text style={styles.racingName} numberOfLines={1}>{homeTeamName}</Text>
                {awayTeamName !== 'Away Team' && (
                  <Text style={styles.racingSub} numberOfLines={1}>Selection: {awayTeamName}</Text>
                )}
                {event.home_score && (
                  <Text style={[styles.racingScore, { color: sportColor }]}>Result: {event.home_score}</Text>
                )}
              </View>
            </View>
            <View style={styles.miniFooter}>
              <View style={styles.miniFooterLeft}>
                {attendance?.rating ? (
                  <View style={styles.miniRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name={star <= Math.floor(attendance.rating!) ? 'star' : 'star-outline'} size={14} color={colors.gold} />
                    ))}
                  </View>
                ) : null}
              </View>
              {venueName ? (
                <View style={styles.miniVenue}>
                  <Ionicons name="location" size={12} color={colors.textSecondary} />
                  <Text style={styles.miniVenueText} numberOfLines={1}>{venueName}</Text>
                </View>
              ) : <View />}
            </View>
          </View>
        </Card>
      );
    }

    return (
      <Card onPress={onPress} style={styles.miniContainer}>
        <View style={styles.miniContent}>
          <View style={styles.miniHeader}>
            <View style={styles.miniHeaderLeft}>
              <Badge label={sportName} size="sm" color={sportColor} />
              {event.competition && (
                <Text style={styles.miniCompetition} numberOfLines={1}>{event.competition}</Text>
              )}
            </View>
            <Text style={styles.miniDate}>{formatDate(event.event_date)}</Text>
          </View>
          <View style={styles.miniMatchup}>
            <View style={styles.miniTeam}>
              {homeTeamLogo ? (
                <Image source={{ uri: homeTeamLogo }} style={styles.miniTeamLogo} />
              ) : (
                <View style={[styles.miniTeamLogoPlaceholder, { backgroundColor: sportColor }]}>
                  <Text style={styles.miniTeamLogoText}>{homeTeamShort[0]}</Text>
                </View>
              )}
              <Text style={[styles.miniTeamName, result.homeWon && styles.miniTeamNameWinner]} numberOfLines={1}>
                {homeTeamShort}
              </Text>
              {result.homeWon && <View style={[styles.miniWinDot, { backgroundColor: sportColor }]} />}
            </View>
            <View style={styles.miniScoreContainer}>
              {result.hasScore ? (
                <>
                  {result.isTennis && result.tennisResult ? (
                    <View style={styles.miniScoreBox}>
                      <Text style={[styles.miniScoreText, result.homeWon && styles.miniScoreWinner]}>{result.tennisResult.player1Sets}</Text>
                      <Text style={styles.miniScoreDivider}>-</Text>
                      <Text style={[styles.miniScoreText, result.awayWon && styles.miniScoreWinner]}>{result.tennisResult.player2Sets}</Text>
                    </View>
                  ) : result.isCricket && result.homeScoreData && result.awayScoreData && result.homeScoreData.innings.length > 1 ? (
                    <View style={styles.miniCricketScores}>
                      <View style={styles.miniCricketCol}>
                        {result.homeScoreData.innings.map((inn, i) => (
                          <Text key={i} style={[styles.miniCricketInning, result.homeWon && styles.miniCricketWon]}>{inn}</Text>
                        ))}
                      </View>
                      <Text style={styles.miniCricketDiv}>v</Text>
                      <View style={styles.miniCricketCol}>
                        {result.awayScoreData.innings.map((inn, i) => (
                          <Text key={i} style={[styles.miniCricketInning, result.awayWon && styles.miniCricketWon]}>{inn}</Text>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.miniScoreBox}>
                      <Text style={[styles.miniScoreText, result.homeWon && styles.miniScoreWinner]}>{event.home_score}</Text>
                      <Text style={styles.miniScoreDivider}>-</Text>
                      <Text style={[styles.miniScoreText, result.awayWon && styles.miniScoreWinner]}>{event.away_score}</Text>
                    </View>
                  )}
                  {result.isDraw ? (
                    <Text style={styles.miniResultLabel}>DRAW</Text>
                  ) : (
                    <Text style={styles.miniResultLabel}>
                      {winnerName} won{result.isTennis && result.tennisResult
                        ? ` ${result.tennisResult.winner === 'home' ? result.tennisResult.player1Sets : result.tennisResult.player2Sets}-${result.tennisResult.winner === 'home' ? result.tennisResult.player2Sets : result.tennisResult.player1Sets}`
                        : result.isCricket ? ` by ${result.getCricketResultText()}` : ` by ${result.margin}`}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.miniVs}>VS</Text>
              )}
            </View>
            <View style={styles.miniTeam}>
              {awayTeamLogo ? (
                <Image source={{ uri: awayTeamLogo }} style={styles.miniTeamLogo} />
              ) : (
                <View style={[styles.miniTeamLogoPlaceholder, { backgroundColor: sportColor }]}>
                  <Text style={styles.miniTeamLogoText}>{awayTeamShort[0]}</Text>
                </View>
              )}
              <Text style={[styles.miniTeamName, result.awayWon && styles.miniTeamNameWinner]} numberOfLines={1}>
                {awayTeamShort}
              </Text>
              {result.awayWon && <View style={[styles.miniWinDot, { backgroundColor: sportColor }]} />}
            </View>
          </View>
          <View style={styles.miniFooter}>
            <View style={styles.miniFooterLeft}>
              {attendance?.rating ? (
                <View style={styles.miniRating}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const full = star <= Math.floor(attendance.rating!);
                    const half = !full && star === Math.ceil(attendance.rating!) && attendance.rating! % 1 !== 0;
                    return <Ionicons key={star} name={full ? 'star' : half ? 'star-half' : 'star-outline'} size={14} color={colors.gold} />;
                  })}
                </View>
              ) : null}
              {attendance?.went_with_user_ids && attendance.went_with_user_ids.length > 0 && (
                <View style={styles.miniWentWith}>
                  <Ionicons name="people" size={12} color={colors.primary} />
                  <Text style={styles.miniWentWithText}>+{attendance.went_with_user_ids.length}</Text>
                </View>
              )}
            </View>
            {venueName ? (
              <View style={styles.miniVenue}>
                <Ionicons name="location" size={12} color={colors.textSecondary} />
                <Text style={styles.miniVenueText} numberOfLines={1}>{venueName}</Text>
              </View>
            ) : <View />}
          </View>
        </View>
      </Card>
    );
  }

  // =============================================
  // REGULAR VIEW — Clean accent design
  // =============================================

  const resultTintColor = attendance?.result === 'win'
    ? `${colors.success}08`
    : attendance?.result === 'loss'
    ? `${colors.error}08`
    : null;
  const resultTintStyle = resultTintColor ? { backgroundColor: resultTintColor } : undefined;
  const wentWithCount = (attendance?.went_with_user_ids?.length || 0) + (attendance?.went_with?.length || 0);

  // Has meaningful community stats (more than just the current user)
  const hasStats = stats && stats.attendeeCount > 1;

  // Racing regular card
  if (result.isRacing) {
    return (
      <Card onPress={onPress} style={[styles.card, resultTintStyle]}>
        {/* Sport accent top border */}
        <View style={[styles.cardAccent, { backgroundColor: sportColor }]} />

        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Badge label={sportName} size="sm" color={sportColor} />
            {event.competition && (
              <Text style={styles.cardCompetition} numberOfLines={1}>{event.competition}</Text>
            )}
            <Text style={styles.cardDate}>{formatDate(event.event_date)}</Text>
          </View>

          <View style={styles.racingContent}>
            <View style={[styles.racingIcon, { backgroundColor: `${sportColor}12` }]}>
              <Ionicons name="flag" size={26} color={sportColor} />
            </View>
            <View style={styles.racingDetails}>
              <Text style={styles.racingNameLg} numberOfLines={2}>{homeTeamName}</Text>
              {awayTeamName !== 'Away Team' && (
                <Text style={styles.racingSub} numberOfLines={1}>Selection: {awayTeamName}</Text>
              )}
              {event.home_score && (
                <View style={[styles.inlineResultPill, { backgroundColor: `${sportColor}12` }]}>
                  <Text style={[styles.inlineResultText, { color: sportColor }]}>{event.home_score}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Community Stats */}
          {hasStats && !compact && (
            <View style={styles.communityStats}>
              <View style={styles.commStatPill}>
                <Ionicons name="people" size={12} color={colors.primary} />
                <Text style={styles.commStatText}>{stats.attendeeCount} attended</Text>
              </View>
              {stats.avgRating && (
                <View style={styles.commStatPill}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={styles.commStatText}>{stats.avgRating.toFixed(1)}</Text>
                </View>
              )}
              {stats.avgAtmosphere && (
                <View style={styles.commStatPill}>
                  <Ionicons name="flame" size={12} color={colors.secondary} />
                  <Text style={styles.commStatText}>{stats.avgAtmosphere.toFixed(1)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Footer */}
          {!compact && (
            <View style={styles.cardFooter}>
              {attendance?.rating ? (
                <View style={styles.footerRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name={star <= attendance.rating! ? 'star' : 'star-outline'} size={14} color={colors.gold} />
                  ))}
                </View>
              ) : <View />}
              <View style={styles.footerRight}>
                {venueName && (
                  <View style={styles.footerChip}>
                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                    <Text style={styles.footerChipText} numberOfLines={1}>{venueName}</Text>
                  </View>
                )}
                {attendance?.is_favorite && <Ionicons name="heart" size={16} color={colors.error} />}
              </View>
            </View>
          )}
        </View>
      </Card>
    );
  }

  // Standard sport card
  return (
    <Card onPress={onPress} style={[styles.card, resultTintStyle]}>
      {/* Sport accent top border */}
      <View style={[styles.cardAccent, { backgroundColor: sportColor }]} />

      <View style={styles.cardBody}>
        {/* Header: sport badge + competition + date */}
        <View style={styles.cardHeader}>
          <Badge label={sportName} size="sm" color={sportColor} />
          {event.competition && (
            <Text style={styles.cardCompetition} numberOfLines={1}>{event.competition}</Text>
          )}
          <Text style={styles.cardDate}>{formatDate(event.event_date)}</Text>
        </View>

        {/* Teams & Score */}
        <View style={styles.matchupRow}>
          {/* Home Team */}
          <View style={styles.teamCol}>
            {homeTeamLogo ? (
              <Image source={{ uri: homeTeamLogo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                <Text style={styles.teamLogoText}>{homeTeamShort[0]}</Text>
              </View>
            )}
            <Text style={[styles.teamName, result.homeWon && { fontWeight: fontWeight.bold }]} numberOfLines={2}>
              {homeTeamName}
            </Text>
          </View>

          {/* Score in tinted box */}
          <View style={styles.scoreCol}>
            <View style={[styles.scoreBox, { backgroundColor: `${sportColor}0A` }]}>
              {result.hasScore ? (
                <>
                  {result.isTennis && result.tennisResult ? (
                    <View style={styles.scoreRow}>
                      <Text style={[styles.scoreNum, result.homeWon && { color: sportColor }, result.awayWon && styles.scoreDim]}>
                        {result.tennisResult.player1Sets}
                      </Text>
                      <Text style={styles.scoreSep}>-</Text>
                      <Text style={[styles.scoreNum, result.awayWon && { color: sportColor }, result.homeWon && styles.scoreDim]}>
                        {result.tennisResult.player2Sets}
                      </Text>
                    </View>
                  ) : result.isTestMatch && result.homeScoreData && result.awayScoreData ? (
                    <View style={styles.cricketScores}>
                      <View style={styles.cricketCol}>
                        {result.homeScoreData.innings.map((inn, i) => (
                          <Text key={i} style={[styles.cricketInning, result.homeWon && { color: sportColor, fontWeight: fontWeight.bold }]}>{inn}</Text>
                        ))}
                      </View>
                      <Text style={styles.cricketDiv}>v</Text>
                      <View style={styles.cricketCol}>
                        {result.awayScoreData.innings.map((inn, i) => (
                          <Text key={i} style={[styles.cricketInning, result.awayWon && { color: sportColor, fontWeight: fontWeight.bold }]}>{inn}</Text>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.scoreRow}>
                      <Text style={[styles.scoreNum, result.homeWon && { color: sportColor }, result.awayWon && styles.scoreDim]}>
                        {event.home_score}
                      </Text>
                      <Text style={styles.scoreSep}>-</Text>
                      <Text style={[styles.scoreNum, result.awayWon && { color: sportColor }, result.homeWon && styles.scoreDim]}>
                        {event.away_score}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.vsText}>VS</Text>
              )}
            </View>
            {/* Result text */}
            {result.hasScore && (
              result.isDraw ? (
                <Text style={styles.resultLabel}>Draw</Text>
              ) : (
                <Text style={styles.resultLabel}>
                  {winnerName} won{result.isTennis && result.tennisResult
                    ? ` ${result.tennisResult.winner === 'home' ? result.tennisResult.player1Sets : result.tennisResult.player2Sets}-${result.tennisResult.winner === 'home' ? result.tennisResult.player2Sets : result.tennisResult.player1Sets}`
                    : result.isCricket ? ` by ${result.getCricketResultText()}` : ` by ${result.margin}`}
                </Text>
              )
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamCol}>
            {awayTeamLogo ? (
              <Image source={{ uri: awayTeamLogo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: sportColor }]}>
                <Text style={styles.teamLogoText}>{awayTeamShort[0]}</Text>
              </View>
            )}
            <Text style={[styles.teamName, result.awayWon && { fontWeight: fontWeight.bold }]} numberOfLines={2}>
              {awayTeamName}
            </Text>
          </View>
        </View>

        {/* Community Stats Row */}
        {hasStats && !compact && (
          <View style={styles.communityStats}>
            <View style={styles.commStatPill}>
              <Ionicons name="people" size={12} color={colors.primary} />
              <Text style={styles.commStatText}>{stats.attendeeCount} attended</Text>
            </View>
            {stats.avgRating && (
              <View style={styles.commStatPill}>
                <Ionicons name="star" size={12} color={colors.gold} />
                <Text style={styles.commStatText}>{stats.avgRating.toFixed(1)} avg</Text>
              </View>
            )}
            {stats.avgAtmosphere && (
              <View style={styles.commStatPill}>
                <Ionicons name="flame" size={12} color={colors.secondary} />
                <Text style={styles.commStatText}>{stats.avgAtmosphere.toFixed(1)} atmos</Text>
              </View>
            )}
          </View>
        )}

        {/* Rich Footer */}
        {!compact && (
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              {attendance?.rating ? (
                <View style={styles.footerRating}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const full = star <= Math.floor(attendance.rating!);
                    const half = !full && star === Math.ceil(attendance.rating!) && attendance.rating! % 1 !== 0;
                    return <Ionicons key={star} name={full ? 'star' : half ? 'star-half' : 'star-outline'} size={14} color={colors.gold} />;
                  })}
                </View>
              ) : null}
              {wentWithCount > 0 && (
                <View style={styles.footerChip}>
                  <Ionicons name="people" size={12} color={colors.primary} />
                  <Text style={[styles.footerChipText, { color: colors.primary }]}>+{wentWithCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.footerRight}>
              {venueName && (
                <View style={styles.footerChip}>
                  <Ionicons name="location" size={12} color={colors.textSecondary} />
                  <Text style={styles.footerChipText} numberOfLines={1}>{venueName}</Text>
                </View>
              )}
              {attendance?.result && attendance.result !== 'no_result' && (
                <View style={[
                  styles.resultBadge,
                  attendance.result === 'win' && { backgroundColor: `${colors.success}15` },
                  attendance.result === 'loss' && { backgroundColor: `${colors.error}15` },
                  attendance.result === 'draw' && { backgroundColor: `${colors.textSecondary}15` },
                ]}>
                  {attendance.result === 'win' && <Ionicons name="trophy" size={11} color={colors.success} />}
                  {attendance.result === 'loss' && <Ionicons name="sad-outline" size={11} color={colors.error} />}
                  <Text style={[
                    styles.resultBadgeText,
                    attendance.result === 'win' && { color: colors.success },
                    attendance.result === 'loss' && { color: colors.error },
                    attendance.result === 'draw' && { color: colors.textSecondary },
                  ]}>
                    {attendance.result.toUpperCase()}
                  </Text>
                </View>
              )}
              {attendance?.is_favorite && <Ionicons name="heart" size={16} color={colors.error} />}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // ============ REGULAR CARD ============
  card: {
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  cardAccent: {
    height: 4,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardCompetition: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },

  // Matchup
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamLogo: {
    width: 52,
    height: 52,
  },
  teamLogoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xl,
  },
  teamName: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    maxWidth: 90,
  },

  // Score
  scoreCol: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  scoreBox: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  scoreDim: {
    color: colors.textMuted,
  },
  scoreSep: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  vsText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  resultLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // Cricket
  cricketScores: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cricketCol: {
    alignItems: 'center',
  },
  cricketInning: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  cricketDiv: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Community Stats
  communityStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLighter,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  commStatText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  footerRating: {
    flexDirection: 'row',
    gap: 1,
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerChipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    maxWidth: 100,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  resultBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  inlineResultPill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  inlineResultText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  // ============ RACING ============
  racingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  racingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  racingDetails: {
    flex: 1,
    gap: 2,
  },
  racingName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  racingNameLg: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  racingSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  racingScore: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },

  // ============ MINI STYLES ============
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
  },
  miniWinDot: {
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
  },
  miniResultLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  miniCricketScores: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  miniCricketCol: {
    alignItems: 'center',
  },
  miniCricketInning: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  miniCricketWon: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  miniCricketDiv: {
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
  miniFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniWentWith: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniWentWithText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  miniVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniVenueText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  miniRating: {
    flexDirection: 'row',
    gap: 2,
  },
});
