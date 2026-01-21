import { colors } from './theme';

export interface SportDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  competitions: string[];
  scoreFormat: 'goals' | 'points' | 'cricket' | 'tennis' | 'sets' | 'racing' | 'position';
  isIndividualSport?: boolean;
}

export const SPORTS: SportDefinition[] = [
  {
    id: 'afl',
    name: 'AFL',
    icon: 'american-football',
    color: colors.sportAFL,
    competitions: ['AFL Premiership', 'AFLW'],
    scoreFormat: 'points',
  },
  {
    id: 'nrl',
    name: 'NRL',
    icon: 'american-football-outline',
    color: colors.sportNRL,
    competitions: ['NRL Premiership', 'State of Origin', 'NRLW'],
    scoreFormat: 'points',
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: 'baseball',
    color: colors.sportCricket,
    competitions: [
      'Test Matches',
      'ODI',
      'T20I',
      'BBL',
      'WBBL',
      'Sheffield Shield',
    ],
    scoreFormat: 'cricket',
  },
  {
    id: 'rugby',
    name: 'Super Rugby',
    icon: 'american-football',
    color: colors.sportRugby,
    competitions: ['Super Rugby Pacific', 'Bledisloe Cup', 'Rugby Championship'],
    scoreFormat: 'points',
  },
  {
    id: 'soccer',
    name: 'Soccer',
    icon: 'football',
    color: colors.sportSoccer,
    competitions: [
      // Australian
      'A-League Men',
      'A-League Women',
      'Australia Cup',
      'Socceroos',
      'Matildas',
      // European Club
      'Premier League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'Champions League',
      'Europa League',
      'Conference League',
      // International
      'World Cup',
      'Euros',
      'Asian Cup',
      'Copa America',
      // Other
      'MLS',
      'J-League',
      'Other',
    ],
    scoreFormat: 'goals',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: 'tennisball',
    color: colors.sportTennis,
    competitions: ['Australian Open', 'ATP', 'WTA'],
    scoreFormat: 'tennis',
    isIndividualSport: true,
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: 'basketball',
    color: colors.sportBasketball,
    competitions: ['NBL', 'WNBL'],
    scoreFormat: 'points',
  },
  {
    id: 'horse_racing',
    name: 'Horse Racing',
    icon: 'ribbon',
    color: colors.sportHorseRacing,
    competitions: [
      'Melbourne Cup',
      'The Everest',
      'Cox Plate',
      'Caulfield Cup',
      'Golden Slipper',
      'Queen Elizabeth Stakes',
      'Doncaster Mile',
      'Sydney Cup',
      'Country Racing',
      'Group 1',
      'Group 2',
      'Group 3',
      'Listed Race',
    ],
    scoreFormat: 'racing',
  },
  {
    id: 'harness_racing',
    name: 'Harness Racing',
    icon: 'ribbon-outline',
    color: colors.sportHarnessRacing,
    competitions: [
      'Inter Dominion',
      'Miracle Mile',
      'Hunter Cup',
      'Victoria Cup',
      'NSW Cup',
      'Group 1',
      'Group 2',
      'Group 3',
    ],
    scoreFormat: 'racing',
  },
  {
    id: 'greyhound_racing',
    name: 'Greyhound Racing',
    icon: 'paw',
    color: colors.sportGreyhoundRacing,
    competitions: [
      'Melbourne Cup',
      'Golden Easter Egg',
      'Topgun',
      'Australian Cup',
      'Group 1',
      'Group 2',
      'Group 3',
    ],
    scoreFormat: 'racing',
  },
  {
    id: 'motorsport',
    name: 'Motorsport',
    icon: 'car-sport',
    color: colors.sportMotorsport,
    competitions: [
      'Formula 1',
      'Supercars',
      'MotoGP',
      'IndyCar',
      'NASCAR',
      'WRC',
      'Bathurst 1000',
      'Australian Grand Prix',
    ],
    scoreFormat: 'position',
  },
  {
    id: 'golf',
    name: 'Golf',
    icon: 'golf',
    color: colors.sportGolf,
    competitions: [
      'Australian Open',
      'PGA Tour',
      'DP World Tour',
      'LPGA Tour',
      'The Masters',
      'US Open',
      'The Open',
      'PGA Championship',
    ],
    scoreFormat: 'points',
    isIndividualSport: true,
  },
  {
    id: 'mma',
    name: 'MMA / UFC',
    icon: 'fitness',
    color: colors.sportMMA,
    competitions: ['UFC', 'Bellator', 'ONE Championship', 'PFL'],
    scoreFormat: 'points',
    isIndividualSport: true,
  },
  {
    id: 'netball',
    name: 'Netball',
    icon: 'people',
    color: colors.sportNetball,
    competitions: ['Super Netball', 'Diamonds', 'ANZ Premiership'],
    scoreFormat: 'points',
  },
];

export const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
] as const;

export const ROUND_TYPES = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Round 5',
  'Round 6',
  'Round 7',
  'Round 8',
  'Round 9',
  'Round 10',
  'Round 11',
  'Round 12',
  'Round 13',
  'Round 14',
  'Round 15',
  'Round 16',
  'Round 17',
  'Round 18',
  'Round 19',
  'Round 20',
  'Round 21',
  'Round 22',
  'Round 23',
  'Round 24',
  'Finals Week 1',
  'Semi Final',
  'Preliminary Final',
  'Grand Final',
  'Test Match',
  'Day 1',
  'Day 2',
  'Day 3',
  'Day 4',
  'Day 5',
  'Quarter Final',
  'First Round',
  'Second Round',
  'Third Round',
  'Fourth Round',
];

export function getSportById(id: string): SportDefinition | undefined {
  return SPORTS.find((sport) => sport.id === id);
}

export function getSportColor(sportId: string): string {
  const sport = getSportById(sportId);
  return sport?.color || colors.sportDefault;
}

export function isIndividualSport(sportId: string): boolean {
  const sport = getSportById(sportId);
  return sport?.isIndividualSport ?? false;
}

export function isRacingSport(sportId: string): boolean {
  const sport = getSportById(sportId);
  return sport?.scoreFormat === 'racing' || sport?.scoreFormat === 'position';
}

export function formatScore(
  homeScore: string | null,
  awayScore: string | null,
  format: SportDefinition['scoreFormat']
): string {
  if (!homeScore && !awayScore) return 'TBD';
  if (!homeScore || !awayScore) return `${homeScore || '?'} - ${awayScore || '?'}`;

  switch (format) {
    case 'cricket':
      return `${homeScore} v ${awayScore}`;
    case 'tennis':
      return `${homeScore} - ${awayScore}`;
    default:
      return `${homeScore} - ${awayScore}`;
  }
}
