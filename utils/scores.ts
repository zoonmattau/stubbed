/**
 * Parse tennis score string and determine winner
 * Supports formats like:
 * - "6-4, 6-3" (straight sets)
 * - "6-4, 4-6, 7-5" (three sets)
 * - "6-4, 6-7, 7-6, 6-3" (four sets)
 * - "6-4, 3-6, 6-3, 4-6, 6-4" (five sets)
 */
export interface TennisScoreResult {
  player1Sets: number;
  player2Sets: number;
  winner: 'home' | 'away' | 'draw' | null;
  sets: Array<{ player1: number; player2: number; winner: 'home' | 'away' | 'draw' }>;
}

export function parseTennisScore(scoreString: string | null | undefined): TennisScoreResult | null {
  if (!scoreString || typeof scoreString !== 'string') {
    return null;
  }

  // Clean up the score string
  const cleanScore = scoreString.trim();
  if (!cleanScore) return null;

  // Split by comma or space to get individual sets
  const setStrings = cleanScore.split(/[,\s]+/).filter(s => s.includes('-'));

  if (setStrings.length === 0) return null;

  let player1Sets = 0;
  let player2Sets = 0;
  const sets: TennisScoreResult['sets'] = [];

  for (const setStr of setStrings) {
    // Parse set score like "6-4" or "7-6"
    const match = setStr.match(/(\d+)-(\d+)/);
    if (!match) continue;

    const player1Games = parseInt(match[1], 10);
    const player2Games = parseInt(match[2], 10);

    let setWinner: 'home' | 'away' | 'draw';
    if (player1Games > player2Games) {
      player1Sets++;
      setWinner = 'home';
    } else if (player2Games > player1Games) {
      player2Sets++;
      setWinner = 'away';
    } else {
      setWinner = 'draw'; // Shouldn't happen in tennis but handle it
    }

    sets.push({
      player1: player1Games,
      player2: player2Games,
      winner: setWinner,
    });
  }

  // Determine overall winner based on sets won
  let winner: 'home' | 'away' | 'draw' | null = null;
  if (player1Sets > player2Sets) {
    winner = 'home';
  } else if (player2Sets > player1Sets) {
    winner = 'away';
  } else if (player1Sets === player2Sets && player1Sets > 0) {
    winner = 'draw';
  }

  return {
    player1Sets,
    player2Sets,
    winner,
    sets,
  };
}

/**
 * Format tennis score for display
 * Shows sets won, e.g., "2-1" for a three-set match
 */
export function formatTennisSetsWon(result: TennisScoreResult): string {
  return `${result.player1Sets}-${result.player2Sets}`;
}

/**
 * Get winner margin for tennis (sets difference)
 */
export function getTennisMargin(result: TennisScoreResult): string {
  const diff = Math.abs(result.player1Sets - result.player2Sets);
  if (diff === 0) return 'tie';
  return `${diff} set${diff > 1 ? 's' : ''}`;
}
