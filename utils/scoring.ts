export type ScoreFormat = 'goals' | 'points' | 'cricket' | 'tennis' | 'sets';

export interface ParsedScore {
  home: string;
  away: string;
  isValid: boolean;
}

export function parseScore(scoreString: string, format: ScoreFormat): ParsedScore {
  if (!scoreString || scoreString.trim() === '') {
    return { home: '', away: '', isValid: false };
  }

  const trimmed = scoreString.trim();

  switch (format) {
    case 'cricket':
      // Cricket scores like "256/4" or "3/45" (overs)
      return { home: trimmed, away: '', isValid: true };

    case 'tennis':
      // Tennis scores like "6-4 6-3 7-6"
      return { home: trimmed, away: '', isValid: true };

    default:
      // Standard scores like "3-2", "45-32", etc.
      const parts = trimmed.split(/[-:]/).map((p) => p.trim());
      if (parts.length === 2) {
        return { home: parts[0], away: parts[1], isValid: true };
      }
      return { home: trimmed, away: '', isValid: false };
  }
}

export function formatScoreDisplay(
  homeScore: string | null,
  awayScore: string | null,
  format: ScoreFormat = 'goals'
): string {
  if (!homeScore && !awayScore) return 'TBD';

  switch (format) {
    case 'cricket':
      if (homeScore && awayScore) {
        return `${homeScore} v ${awayScore}`;
      }
      return homeScore || awayScore || 'TBD';

    case 'tennis':
      return homeScore || 'TBD';

    default:
      if (!homeScore || !awayScore) {
        return `${homeScore || '?'} - ${awayScore || '?'}`;
      }
      return `${homeScore} - ${awayScore}`;
  }
}

export function determineWinner(
  homeScore: string | null,
  awayScore: string | null,
  format: ScoreFormat = 'goals'
): 'home' | 'away' | 'draw' | null {
  if (!homeScore || !awayScore) return null;

  switch (format) {
    case 'cricket':
    case 'tennis':
      // These formats need explicit winner marking
      return null;

    default:
      const homeNum = parseInt(homeScore, 10);
      const awayNum = parseInt(awayScore, 10);

      if (isNaN(homeNum) || isNaN(awayNum)) return null;

      if (homeNum > awayNum) return 'home';
      if (awayNum > homeNum) return 'away';
      return 'draw';
  }
}

export function calculateWinPercentage(
  wins: number,
  losses: number,
  draws: number
): number {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  // Draws count as half a win for percentage calculation
  return Math.round(((wins + draws * 0.5) / total) * 100);
}

export function formatAFLScore(goals: number, behinds: number): string {
  const total = goals * 6 + behinds;
  return `${goals}.${behinds} (${total})`;
}

export function parseAFLScore(scoreString: string): { goals: number; behinds: number; total: number } | null {
  // Match patterns like "12.8 (80)" or "12.8"
  const match = scoreString.match(/(\d+)\.(\d+)(?:\s*\((\d+)\))?/);
  if (!match) return null;

  const goals = parseInt(match[1], 10);
  const behinds = parseInt(match[2], 10);
  const total = match[3] ? parseInt(match[3], 10) : goals * 6 + behinds;

  return { goals, behinds, total };
}

export function formatCricketScore(runs: number, wickets: number, overs?: string): string {
  let score = `${runs}/${wickets}`;
  if (overs) {
    score += ` (${overs})`;
  }
  return score;
}
