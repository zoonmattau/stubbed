// Unified level definitions for the app
// Thresholds are calibrated for the points system:
// - 10 pts per event attended
// - 5 pts per team win (when supporting)
// - 5 pts per new team discovered
// - 5 pts per new venue visited
// - 5 pts per new sport explored
// - Streak bonuses: 15/30/75 for 3/5/10 win streaks
// - Achievement points on top
//
// Typical first event: 10 (attend) + 5 (win) + 10 (2 teams) + 5 (sport) + 5 (venue) = 35 pts max
// Level 2 requires ~3-4 events to reach

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Rookie', minPoints: 0, icon: 'ticket-outline', color: '#6B7280' },
  { level: 2, name: 'Fan', minPoints: 100, icon: 'star-outline', color: '#10B981' },
  { level: 3, name: 'Supporter', minPoints: 250, icon: 'star-half', color: '#3B82F6' },
  { level: 4, name: 'Enthusiast', minPoints: 500, icon: 'star', color: '#8B5CF6' },
  { level: 5, name: 'Dedicated', minPoints: 1000, icon: 'medal-outline', color: '#F59E0B' },
  { level: 6, name: 'Veteran', minPoints: 2000, icon: 'ribbon', color: '#EF4444' },
  { level: 7, name: 'Expert', minPoints: 3500, icon: 'trophy-outline', color: '#EC4899' },
  { level: 8, name: 'Elite', minPoints: 5500, icon: 'trophy', color: '#14B8A6' },
  { level: 9, name: 'Champion', minPoints: 8000, icon: 'diamond-outline', color: '#6366F1' },
  { level: 10, name: 'Legend', minPoints: 12000, icon: 'diamond', color: '#F59E0B' },
];

export function getCurrentLevel(points: number): Level {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) {
      level = l;
    }
  }
  return level;
}

export function getNextLevel(currentLevel: Level): Level | null {
  const idx = LEVELS.findIndex(l => l.level === currentLevel.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelProgress(points: number, currentLevel: Level, nextLevel: Level | null): number {
  if (!nextLevel) return 100;
  const pointsInLevel = points - currentLevel.minPoints;
  const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints;
  return (pointsInLevel / pointsNeeded) * 100;
}
