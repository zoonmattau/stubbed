import { supabase } from './supabase';

// Seed dummy event data for the current user
export async function seedDummyData(userId: string) {
  console.log('Seeding dummy data for user:', userId);

  // Sport IDs from seed data
  const SPORTS = {
    AFL: 'a1b2c3d4-1111-1111-1111-111111111111',
    NRL: 'a1b2c3d4-2222-2222-2222-222222222222',
    Cricket: 'a1b2c3d4-3333-3333-3333-333333333333',
    ALeague: 'a1b2c3d4-5555-5555-5555-555555555555',
    NBL: 'a1b2c3d4-7777-7777-7777-777777777777',
  };

  // Venue IDs from seed data
  const VENUES = {
    MCG: 'b1b2c3d4-1111-1111-1111-111111111111',
    SCG: 'b1b2c3d4-2222-2222-2222-222222222222',
    AdelaideOval: 'b1b2c3d4-3333-3333-3333-333333333333',
    OptusStadium: 'b1b2c3d4-4444-4444-4444-444444444444',
    Gabba: 'b1b2c3d4-5555-5555-5555-555555555555',
    MarvelStadium: 'b1b2c3d4-6666-6666-6666-666666666666',
    AAMIPark: 'b1b2c3d4-7777-7777-7777-777777777777',
    SuncorpStadium: 'b1b2c3d4-9999-9999-9999-999999999999',
  };

  // Team IDs from seed data
  const TEAMS = {
    // AFL
    Collingwood: 'c1b2c3d4-0004-1111-1111-111111111111',
    Richmond: 'c1b2c3d4-0014-1111-1111-111111111111',
    Carlton: 'c1b2c3d4-0003-1111-1111-111111111111',
    Essendon: 'c1b2c3d4-0005-1111-1111-111111111111',
    Geelong: 'c1b2c3d4-0007-1111-1111-111111111111',
    Melbourne: 'c1b2c3d4-0011-1111-1111-111111111111',
    Brisbane: 'c1b2c3d4-0002-1111-1111-111111111111',
    Sydney: 'c1b2c3d4-0016-1111-1111-111111111111',
    // NRL
    MelbourneStorm: 'c1b2c3d4-0107-2222-2222-222222222222',
    Broncos: 'c1b2c3d4-0101-2222-2222-222222222222',
    Panthers: 'c1b2c3d4-0111-2222-2222-222222222222',
    Roosters: 'c1b2c3d4-0114-2222-2222-222222222222',
    // Cricket
    Australia: 'c1b2c3d4-0201-3333-3333-333333333333',
    MelbourneStars: 'c1b2c3d4-0202-3333-3333-333333333333',
    SydneySixers: 'c1b2c3d4-0204-3333-3333-333333333333',
    // A-League
    MelbourneVictory: 'c1b2c3d4-0301-5555-5555-555555555555',
    MelbourneCity: 'c1b2c3d4-0302-5555-5555-555555555555',
    SydneyFC: 'c1b2c3d4-0303-5555-5555-555555555555',
  };

  // Create dummy events spanning the last 12 months
  const dummyEvents = [
    // Recent events (last month)
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Collingwood,
      away_team_id: TEAMS.Richmond,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(0, 5),
      competition: 'AFL Premiership',
      round: 'Round 23',
      home_score: '98',
      away_score: '87',
      winner_team_id: TEAMS.Collingwood,
    },
    {
      sport_id: SPORTS.NRL,
      home_team_id: TEAMS.MelbourneStorm,
      away_team_id: TEAMS.Broncos,
      venue_id: VENUES.AAMIPark,
      event_date: getDateMonthsAgo(0, 12),
      competition: 'NRL Premiership',
      round: 'Round 20',
      home_score: '32',
      away_score: '18',
      winner_team_id: TEAMS.MelbourneStorm,
    },
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Carlton,
      away_team_id: TEAMS.Essendon,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(0, 20),
      competition: 'AFL Premiership',
      round: 'Round 22',
      home_score: '76',
      away_score: '76',
      is_draw: true,
    },
    // 1 month ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Geelong,
      away_team_id: TEAMS.Collingwood,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(1, 3),
      competition: 'AFL Premiership',
      round: 'Qualifying Final',
      home_score: '102',
      away_score: '95',
      winner_team_id: TEAMS.Geelong,
    },
    {
      sport_id: SPORTS.ALeague,
      home_team_id: TEAMS.MelbourneVictory,
      away_team_id: TEAMS.MelbourneCity,
      venue_id: VENUES.AAMIPark,
      event_date: getDateMonthsAgo(1, 15),
      competition: 'A-League',
      round: 'Round 5',
      home_score: '2',
      away_score: '1',
      winner_team_id: TEAMS.MelbourneVictory,
    },
    // 2 months ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Melbourne,
      away_team_id: TEAMS.Brisbane,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(2, 7),
      competition: 'AFL Premiership',
      round: 'Round 18',
      home_score: '89',
      away_score: '112',
      winner_team_id: TEAMS.Brisbane,
    },
    {
      sport_id: SPORTS.NRL,
      home_team_id: TEAMS.Panthers,
      away_team_id: TEAMS.Roosters,
      venue_id: VENUES.SuncorpStadium,
      event_date: getDateMonthsAgo(2, 20),
      competition: 'State of Origin',
      round: 'Game 3',
      home_score: '24',
      away_score: '22',
      winner_team_id: TEAMS.Panthers,
    },
    // 3 months ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Collingwood,
      away_team_id: TEAMS.Carlton,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(3, 10),
      competition: 'AFL Premiership',
      round: 'Round 14',
      home_score: '105',
      away_score: '88',
      winner_team_id: TEAMS.Collingwood,
    },
    {
      sport_id: SPORTS.ALeague,
      home_team_id: TEAMS.SydneyFC,
      away_team_id: TEAMS.MelbourneVictory,
      venue_id: VENUES.SCG,
      event_date: getDateMonthsAgo(3, 22),
      competition: 'A-League',
      round: 'Round 2',
      home_score: '0',
      away_score: '0',
      is_draw: true,
    },
    // 4 months ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Richmond,
      away_team_id: TEAMS.Essendon,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(4, 5),
      competition: 'AFL Premiership',
      round: 'Round 10',
      home_score: '92',
      away_score: '78',
      winner_team_id: TEAMS.Richmond,
    },
    {
      sport_id: SPORTS.NRL,
      home_team_id: TEAMS.MelbourneStorm,
      away_team_id: TEAMS.Panthers,
      venue_id: VENUES.AAMIPark,
      event_date: getDateMonthsAgo(4, 18),
      competition: 'NRL Premiership',
      round: 'Round 12',
      home_score: '28',
      away_score: '30',
      winner_team_id: TEAMS.Panthers,
    },
    // 5 months ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Collingwood,
      away_team_id: TEAMS.Geelong,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(5, 8),
      competition: 'AFL Premiership',
      round: 'Round 7',
      home_score: '88',
      away_score: '75',
      winner_team_id: TEAMS.Collingwood,
    },
    // 6 months ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Sydney,
      away_team_id: TEAMS.Collingwood,
      venue_id: VENUES.SCG,
      event_date: getDateMonthsAgo(6, 12),
      competition: 'AFL Premiership',
      round: 'Round 3',
      home_score: '95',
      away_score: '101',
      winner_team_id: TEAMS.Collingwood,
    },
    {
      sport_id: SPORTS.Cricket,
      home_team_id: TEAMS.MelbourneStars,
      away_team_id: TEAMS.SydneySixers,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(6, 25),
      competition: 'Big Bash League',
      round: 'Match 15',
      home_score: '185/6',
      away_score: '172/8',
      winner_team_id: TEAMS.MelbourneStars,
    },
    // 8 months ago - Boxing Day Test (Australia vs England)
    {
      sport_id: SPORTS.Cricket,
      home_team_id: TEAMS.Australia,
      away_team_id: null, // International opponent - stored as text
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(8, 26),
      competition: 'The Ashes',
      round: 'Boxing Day Test - Day 1',
      home_score: '263/4',
      away_score: null,
      home_team_name: 'Australia',
      away_team_name: 'England',
    },
    // 10 months ago
    {
      sport_id: SPORTS.AFL,
      home_team_id: TEAMS.Collingwood,
      away_team_id: TEAMS.Brisbane,
      venue_id: VENUES.MCG,
      event_date: getDateMonthsAgo(10, 15),
      competition: 'AFL Premiership',
      round: 'Grand Final',
      home_score: '102',
      away_score: '98',
      winner_team_id: TEAMS.Collingwood,
    },
  ];

  try {
    // Insert events
    for (const eventData of dummyEvents) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: userId,
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        continue;
      }

      // Create attendance record
      const ratings = [3, 4, 4, 5, 5, 5];
      const atmosphereRatings = [3, 4, 4, 5, 5, 5];

      const { error: attendanceError } = await supabase
        .from('attended_events')
        .insert({
          user_id: userId,
          event_id: event.id,
          rating: ratings[Math.floor(Math.random() * ratings.length)],
          atmosphere_rating: atmosphereRatings[Math.floor(Math.random() * atmosphereRatings.length)],
          notes: getRandomNote(),
          section: getRandomSection(),
        });

      if (attendanceError) {
        console.error('Error creating attendance:', attendanceError);
      }
    }

    // Update user stats
    await updateUserStats(userId);

    console.log('Successfully seeded dummy data!');
    return { success: true, eventsCreated: dummyEvents.length };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
}

function getDateMonthsAgo(months: number, dayOffset: number = 0): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(date.getDate() - dayOffset);
  return date.toISOString().split('T')[0];
}

function getRandomNote(): string {
  const notes = [
    'Great atmosphere!',
    'Amazing game, edge of my seat the whole time',
    'Went with the family, kids loved it',
    'Perfect weather for footy',
    'Close game, could have gone either way',
    'What a finish! Incredible last quarter',
    'First time at this venue, wont be the last',
    'Grabbed some great photos',
    null,
    null,
  ];
  return notes[Math.floor(Math.random() * notes.length)] || '';
}

function getRandomSection(): string {
  const sections = [
    'Level 1, Bay 23',
    'Level 2, Row M',
    'MCC Members',
    'General Admission',
    'Level 3, Aisle 45',
    'Premium Reserved',
    null,
  ];
  return sections[Math.floor(Math.random() * sections.length)] || '';
}

async function updateUserStats(userId: string) {
  // Get event counts
  const { data: attended } = await supabase
    .from('attended_events')
    .select('event:events(sport_id, home_team_id, away_team_id, venue_id)')
    .eq('user_id', userId);

  if (!attended) return;

  const sportIds = new Set<string>();
  const teamIds = new Set<string>();
  const venueIds = new Set<string>();

  attended.forEach((a: any) => {
    if (a.event?.sport_id) sportIds.add(a.event.sport_id);
    if (a.event?.home_team_id) teamIds.add(a.event.home_team_id);
    if (a.event?.away_team_id) teamIds.add(a.event.away_team_id);
    if (a.event?.venue_id) venueIds.add(a.event.venue_id);
  });

  await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      total_events: attended.length,
      total_sports: sportIds.size,
      total_teams: teamIds.size,
      total_venues: venueIds.size,
      current_streak: 3,
      longest_streak: 5,
      updated_at: new Date().toISOString(),
    });
}
