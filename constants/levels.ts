// Unified level definitions for the app
// Thresholds are calibrated for the points system:
// - 10 pts per event attended
// - 15 pts per team win (when supporting)
// - 5 pts per new team discovered
// - 5 pts per new venue visited
// - 10 pts per new sport explored
// - Streak bonuses: 25/50/100 for 3/5/10 win streaks
// - Achievement points on top

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Rookie', minPoints: 0, icon: 'ticket-outline', color: '#6B7280' },
  { level: 2, name: 'Fan', minPoints: 50, icon: 'star-outline', color: '#10B981' },
  { level: 3, name: 'Supporter', minPoints: 150, icon: 'star-half', color: '#3B82F6' },
  { level: 4, name: 'Enthusiast', minPoints: 300, icon: 'star', color: '#8B5CF6' },
  { level: 5, name: 'Dedicated', minPoints: 500, icon: 'medal-outline', color: '#F59E0B' },
  { level: 6, name: 'Veteran', minPoints: 800, icon: 'ribbon', color: '#EF4444' },
  { level: 7, name: 'Expert', minPoints: 1200, icon: 'trophy-outline', color: '#EC4899' },
  { level: 8, name: 'Elite', minPoints: 1800, icon: 'trophy', color: '#14B8A6' },
  { level: 9, name: 'Champion', minPoints: 2500, icon: 'diamond-outline', color: '#6366F1' },
  { level: 10, name: 'Legend', minPoints: 3500, icon: 'diamond', color: '#F59E0B' },
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
