export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'attendance' | 'diversity' | 'loyalty' | 'special';
  requirementType: 'count' | 'specific' | 'streak';
  requirementValue: Record<string, unknown>;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Attendance achievements
  {
    code: 'first_game',
    name: 'First Timer',
    description: 'Attend your first sporting event',
    icon: 'flag',
    category: 'attendance',
    requirementType: 'count',
    requirementValue: { count: 1 },
    points: 10,
    rarity: 'common',
  },
  {
    code: 'ten_games',
    name: 'Regular',
    description: 'Attend 10 sporting events',
    icon: 'ticket',
    category: 'attendance',
    requirementType: 'count',
    requirementValue: { count: 10 },
    points: 25,
    rarity: 'common',
  },
  {
    code: 'twenty_five_games',
    name: 'Dedicated Fan',
    description: 'Attend 25 sporting events',
    icon: 'star',
    category: 'attendance',
    requirementType: 'count',
    requirementValue: { count: 25 },
    points: 50,
    rarity: 'uncommon',
  },
  {
    code: 'fifty_games',
    name: 'Super Fan',
    description: 'Attend 50 sporting events',
    icon: 'trophy',
    category: 'attendance',
    requirementType: 'count',
    requirementValue: { count: 50 },
    points: 100,
    rarity: 'rare',
  },
  {
    code: 'hundred_games',
    name: 'Living Legend',
    description: 'Attend 100 sporting events',
    icon: 'medal',
    category: 'attendance',
    requirementType: 'count',
    requirementValue: { count: 100 },
    points: 250,
    rarity: 'epic',
  },
  {
    code: 'two_fifty_games',
    name: 'Hall of Famer',
    description: 'Attend 250 sporting events',
    icon: 'ribbon',
    category: 'attendance',
    requirementType: 'count',
    requirementValue: { count: 250 },
    points: 500,
    rarity: 'legendary',
  },

  // Diversity achievements
  {
    code: 'multi_sport',
    name: 'Sports Sampler',
    description: 'Attend events in 3 different sports',
    icon: 'apps',
    category: 'diversity',
    requirementType: 'count',
    requirementValue: { sports: 3 },
    points: 30,
    rarity: 'common',
  },
  {
    code: 'all_rounder',
    name: 'All-Rounder',
    description: 'Attend events in 5 different sports',
    icon: 'grid',
    category: 'diversity',
    requirementType: 'count',
    requirementValue: { sports: 5 },
    points: 75,
    rarity: 'uncommon',
  },
  {
    code: 'venue_explorer',
    name: 'Venue Explorer',
    description: 'Attend events at 5 different venues',
    icon: 'location',
    category: 'diversity',
    requirementType: 'count',
    requirementValue: { venues: 5 },
    points: 40,
    rarity: 'common',
  },
  {
    code: 'stadium_hopper',
    name: 'Stadium Hopper',
    description: 'Attend events at 10 different venues',
    icon: 'map',
    category: 'diversity',
    requirementType: 'count',
    requirementValue: { venues: 10 },
    points: 100,
    rarity: 'rare',
  },
  {
    code: 'team_variety',
    name: 'Team Watcher',
    description: 'Watch 10 different teams play',
    icon: 'people',
    category: 'diversity',
    requirementType: 'count',
    requirementValue: { teams: 10 },
    points: 50,
    rarity: 'uncommon',
  },

  // Loyalty achievements
  {
    code: 'team_loyal_5',
    name: 'Loyal Supporter',
    description: 'Attend 5 games for the same team',
    icon: 'heart',
    category: 'loyalty',
    requirementType: 'count',
    requirementValue: { sameTeam: 5 },
    points: 35,
    rarity: 'common',
  },
  {
    code: 'team_loyal_10',
    name: 'Die-Hard Fan',
    description: 'Attend 10 games for the same team',
    icon: 'heart-circle',
    category: 'loyalty',
    requirementType: 'count',
    requirementValue: { sameTeam: 10 },
    points: 75,
    rarity: 'uncommon',
  },
  {
    code: 'team_loyal_25',
    name: 'Season Ticker',
    description: 'Attend 25 games for the same team',
    icon: 'shield',
    category: 'loyalty',
    requirementType: 'count',
    requirementValue: { sameTeam: 25 },
    points: 150,
    rarity: 'rare',
  },
  {
    code: 'home_ground',
    name: 'Home Ground Advantage',
    description: 'Attend 5 games at the same venue',
    icon: 'home',
    category: 'loyalty',
    requirementType: 'count',
    requirementValue: { sameVenue: 5 },
    points: 30,
    rarity: 'common',
  },

  // Special achievements
  {
    code: 'grand_final',
    name: 'Grand Finalist',
    description: 'Attend a Grand Final',
    icon: 'trophy',
    category: 'special',
    requirementType: 'specific',
    requirementValue: { round: 'Grand Final' },
    points: 100,
    rarity: 'epic',
  },
  {
    code: 'finals_series',
    name: 'Finals Fever',
    description: 'Attend 3 finals games in a season',
    icon: 'flame',
    category: 'special',
    requirementType: 'count',
    requirementValue: { finalsGames: 3 },
    points: 75,
    rarity: 'rare',
  },
  {
    code: 'boxing_day_test',
    name: 'Boxing Day Regular',
    description: 'Attend the Boxing Day Test at the MCG',
    icon: 'gift',
    category: 'special',
    requirementType: 'specific',
    requirementValue: { event: 'boxing_day_test' },
    points: 50,
    rarity: 'rare',
  },
  {
    code: 'ashes_test',
    name: 'Ashes Witness',
    description: 'Attend an Ashes Test match',
    icon: 'bonfire',
    category: 'special',
    requirementType: 'specific',
    requirementValue: { competition: 'Ashes' },
    points: 75,
    rarity: 'rare',
  },
  {
    code: 'state_of_origin',
    name: 'Origin Hero',
    description: 'Attend a State of Origin match',
    icon: 'flash',
    category: 'special',
    requirementType: 'specific',
    requirementValue: { competition: 'State of Origin' },
    points: 60,
    rarity: 'rare',
  },
  {
    code: 'australian_open',
    name: 'Aussie Open Attendee',
    description: 'Attend an Australian Open match',
    icon: 'tennisball',
    category: 'special',
    requirementType: 'specific',
    requirementValue: { competition: 'Australian Open' },
    points: 50,
    rarity: 'uncommon',
  },

  // Streak achievements
  {
    code: 'weekly_streak_4',
    name: 'Monthly Regular',
    description: 'Attend at least one game per week for 4 weeks',
    icon: 'calendar',
    category: 'attendance',
    requirementType: 'streak',
    requirementValue: { weeks: 4 },
    points: 50,
    rarity: 'uncommon',
  },
  {
    code: 'monthly_streak_6',
    name: 'Half Year Hero',
    description: 'Attend at least one game per month for 6 months',
    icon: 'calendar-outline',
    category: 'attendance',
    requirementType: 'streak',
    requirementValue: { months: 6 },
    points: 100,
    rarity: 'rare',
  },
  {
    code: 'yearly_attendance',
    name: 'Year-Round Fan',
    description: 'Attend at least one game per month for a full year',
    icon: 'sunny',
    category: 'attendance',
    requirementType: 'streak',
    requirementValue: { months: 12 },
    points: 200,
    rarity: 'epic',
  },
];

export const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
} as const;

export const CATEGORY_ICONS = {
  attendance: 'ticket',
  diversity: 'apps',
  loyalty: 'heart',
  special: 'star',
} as const;

export function getAchievementByCode(code: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.code === code);
}

export function getAchievementsByCategory(
  category: AchievementDefinition['category']
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getRarityColor(rarity: AchievementDefinition['rarity']): string {
  return RARITY_COLORS[rarity];
}
