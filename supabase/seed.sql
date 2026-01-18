-- Stubbed Seed Data
-- Australian sports, teams, venues, and achievements

-- Insert Sports
insert into sports (id, name, icon, color, country) values
  ('a1b2c3d4-1111-1111-1111-111111111111', 'AFL', 'football', '#e11d48', 'AU'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'NRL', 'football-outline', '#0891b2', 'AU'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'Cricket', 'baseball', '#16a34a', 'AU'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'Super Rugby', 'american-football', '#f59e0b', 'AU'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'A-League', 'football', '#8b5cf6', 'AU'),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'Tennis', 'tennisball', '#84cc16', 'AU'),
  ('a1b2c3d4-7777-7777-7777-777777777777', 'NBL', 'basketball', '#f97316', 'AU');

-- Insert Venues
insert into venues (id, name, city, state, country, capacity, latitude, longitude) values
  ('b1b2c3d4-1111-1111-1111-111111111111', 'Melbourne Cricket Ground', 'Melbourne', 'VIC', 'AU', 100024, -37.8200, 144.9834),
  ('b1b2c3d4-2222-2222-2222-222222222222', 'Sydney Cricket Ground', 'Sydney', 'NSW', 'AU', 48000, -33.8917, 151.2247),
  ('b1b2c3d4-3333-3333-3333-333333333333', 'Adelaide Oval', 'Adelaide', 'SA', 'AU', 53583, -34.9156, 138.5961),
  ('b1b2c3d4-4444-4444-4444-444444444444', 'Optus Stadium', 'Perth', 'WA', 'AU', 60000, -31.9512, 115.8891),
  ('b1b2c3d4-5555-5555-5555-555555555555', 'The Gabba', 'Brisbane', 'QLD', 'AU', 42000, -27.4858, 153.0381),
  ('b1b2c3d4-6666-6666-6666-666666666666', 'Marvel Stadium', 'Melbourne', 'VIC', 'AU', 53359, -37.8165, 144.9475),
  ('b1b2c3d4-7777-7777-7777-777777777777', 'AAMI Park', 'Melbourne', 'VIC', 'AU', 30050, -37.8253, 144.9836),
  ('b1b2c3d4-8888-8888-8888-888888888888', 'Accor Stadium', 'Sydney', 'NSW', 'AU', 83500, -33.8472, 151.0636),
  ('b1b2c3d4-9999-9999-9999-999999999999', 'Suncorp Stadium', 'Brisbane', 'QLD', 'AU', 52500, -27.4648, 153.0095),
  ('b1b2c3d4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rod Laver Arena', 'Melbourne', 'VIC', 'AU', 14820, -37.8215, 144.9785),
  ('b1b2c3d4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'GMHBA Stadium', 'Geelong', 'VIC', 'AU', 36000, -38.1582, 144.3543),
  ('b1b2c3d4-cccc-cccc-cccc-cccccccccccc', 'Blundstone Arena', 'Hobart', 'TAS', 'AU', 20000, -42.8736, 147.3428);

-- Insert AFL Teams
insert into teams (id, sport_id, name, short_name, city, state, country) values
  ('c1b2c3d4-0001-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Adelaide Crows', 'ADE', 'Adelaide', 'SA', 'AU'),
  ('c1b2c3d4-0002-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Brisbane Lions', 'BRL', 'Brisbane', 'QLD', 'AU'),
  ('c1b2c3d4-0003-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Carlton', 'CAR', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0004-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Collingwood', 'COL', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0005-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Essendon', 'ESS', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0006-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Fremantle', 'FRE', 'Perth', 'WA', 'AU'),
  ('c1b2c3d4-0007-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Geelong Cats', 'GEE', 'Geelong', 'VIC', 'AU'),
  ('c1b2c3d4-0008-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Gold Coast Suns', 'GCS', 'Gold Coast', 'QLD', 'AU'),
  ('c1b2c3d4-0009-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'GWS Giants', 'GWS', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0010-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Hawthorn', 'HAW', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0011-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Melbourne', 'MEL', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0012-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'North Melbourne', 'NTH', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0013-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Port Adelaide', 'PTA', 'Adelaide', 'SA', 'AU'),
  ('c1b2c3d4-0014-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Richmond', 'RIC', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0015-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'St Kilda', 'STK', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0016-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sydney Swans', 'SYD', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0017-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'West Coast Eagles', 'WCE', 'Perth', 'WA', 'AU'),
  ('c1b2c3d4-0018-1111-1111-111111111111', 'a1b2c3d4-1111-1111-1111-111111111111', 'Western Bulldogs', 'WBD', 'Melbourne', 'VIC', 'AU');

-- Insert NRL Teams
insert into teams (id, sport_id, name, short_name, city, state, country) values
  ('c1b2c3d4-0101-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Brisbane Broncos', 'BRI', 'Brisbane', 'QLD', 'AU'),
  ('c1b2c3d4-0102-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Canberra Raiders', 'CAN', 'Canberra', 'ACT', 'AU'),
  ('c1b2c3d4-0103-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Canterbury Bulldogs', 'CBY', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0104-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Cronulla Sharks', 'CRO', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0105-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Gold Coast Titans', 'GCT', 'Gold Coast', 'QLD', 'AU'),
  ('c1b2c3d4-0106-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Manly Sea Eagles', 'MAN', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0107-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Melbourne Storm', 'MEL', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0108-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Newcastle Knights', 'NEW', 'Newcastle', 'NSW', 'AU'),
  ('c1b2c3d4-0109-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'North Queensland Cowboys', 'NQC', 'Townsville', 'QLD', 'AU'),
  ('c1b2c3d4-0110-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Parramatta Eels', 'PAR', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0111-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Penrith Panthers', 'PEN', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0112-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'South Sydney Rabbitohs', 'SOU', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0113-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'St George Illawarra Dragons', 'SGI', 'Wollongong', 'NSW', 'AU'),
  ('c1b2c3d4-0114-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Sydney Roosters', 'SYD', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0115-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Wests Tigers', 'WST', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0116-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'New Zealand Warriors', 'NZW', 'Auckland', 'NZ', 'NZ'),
  ('c1b2c3d4-0117-2222-2222-222222222222', 'a1b2c3d4-2222-2222-2222-222222222222', 'Dolphins', 'DOL', 'Brisbane', 'QLD', 'AU');

-- Insert Cricket Teams
insert into teams (id, sport_id, name, short_name, city, state, country) values
  ('c1b2c3d4-0201-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Australia', 'AUS', 'National', 'AU', 'AU'),
  ('c1b2c3d4-0202-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Melbourne Stars', 'STA', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0203-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Melbourne Renegades', 'REN', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0204-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Sydney Sixers', 'SIX', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0205-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Sydney Thunder', 'THU', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0206-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Brisbane Heat', 'HEA', 'Brisbane', 'QLD', 'AU'),
  ('c1b2c3d4-0207-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Adelaide Strikers', 'STR', 'Adelaide', 'SA', 'AU'),
  ('c1b2c3d4-0208-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Perth Scorchers', 'SCO', 'Perth', 'WA', 'AU'),
  ('c1b2c3d4-0209-3333-3333-333333333333', 'a1b2c3d4-3333-3333-3333-333333333333', 'Hobart Hurricanes', 'HUR', 'Hobart', 'TAS', 'AU');

-- Insert A-League Teams
insert into teams (id, sport_id, name, short_name, city, state, country) values
  ('c1b2c3d4-0301-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Melbourne Victory', 'MVC', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0302-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Melbourne City', 'MCY', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0303-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Sydney FC', 'SYD', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0304-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Western Sydney Wanderers', 'WSW', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0305-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Brisbane Roar', 'BRI', 'Brisbane', 'QLD', 'AU'),
  ('c1b2c3d4-0306-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Adelaide United', 'ADL', 'Adelaide', 'SA', 'AU'),
  ('c1b2c3d4-0307-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Perth Glory', 'PER', 'Perth', 'WA', 'AU'),
  ('c1b2c3d4-0308-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Central Coast Mariners', 'CCM', 'Gosford', 'NSW', 'AU'),
  ('c1b2c3d4-0309-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Wellington Phoenix', 'WEL', 'Wellington', 'NZ', 'NZ'),
  ('c1b2c3d4-0310-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Macarthur FC', 'MAC', 'Sydney', 'NSW', 'AU'),
  ('c1b2c3d4-0311-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Western United', 'WUN', 'Melbourne', 'VIC', 'AU'),
  ('c1b2c3d4-0312-5555-5555-555555555555', 'a1b2c3d4-5555-5555-5555-555555555555', 'Newcastle Jets', 'NEW', 'Newcastle', 'NSW', 'AU');

-- Insert Achievements
insert into achievements (code, name, description, icon, category, requirement_type, requirement_value, points, rarity) values
  ('first_game', 'First Timer', 'Attend your first sporting event', 'flag', 'attendance', 'count', '{"count": 1}', 10, 'common'),
  ('ten_games', 'Regular', 'Attend 10 sporting events', 'ticket', 'attendance', 'count', '{"count": 10}', 25, 'common'),
  ('twenty_five_games', 'Dedicated Fan', 'Attend 25 sporting events', 'star', 'attendance', 'count', '{"count": 25}', 50, 'uncommon'),
  ('fifty_games', 'Super Fan', 'Attend 50 sporting events', 'trophy', 'attendance', 'count', '{"count": 50}', 100, 'rare'),
  ('hundred_games', 'Living Legend', 'Attend 100 sporting events', 'medal', 'attendance', 'count', '{"count": 100}', 250, 'epic'),
  ('two_fifty_games', 'Hall of Famer', 'Attend 250 sporting events', 'ribbon', 'attendance', 'count', '{"count": 250}', 500, 'legendary'),
  ('multi_sport', 'Sports Sampler', 'Attend events in 3 different sports', 'apps', 'diversity', 'count', '{"sports": 3}', 30, 'common'),
  ('all_rounder', 'All-Rounder', 'Attend events in 5 different sports', 'grid', 'diversity', 'count', '{"sports": 5}', 75, 'uncommon'),
  ('venue_explorer', 'Venue Explorer', 'Attend events at 5 different venues', 'location', 'diversity', 'count', '{"venues": 5}', 40, 'common'),
  ('stadium_hopper', 'Stadium Hopper', 'Attend events at 10 different venues', 'map', 'diversity', 'count', '{"venues": 10}', 100, 'rare'),
  ('team_variety', 'Team Watcher', 'Watch 10 different teams play', 'people', 'diversity', 'count', '{"teams": 10}', 50, 'uncommon'),
  ('team_loyal_5', 'Loyal Supporter', 'Attend 5 games for the same team', 'heart', 'loyalty', 'count', '{"sameTeam": 5}', 35, 'common'),
  ('team_loyal_10', 'Die-Hard Fan', 'Attend 10 games for the same team', 'heart-circle', 'loyalty', 'count', '{"sameTeam": 10}', 75, 'uncommon'),
  ('team_loyal_25', 'Season Ticker', 'Attend 25 games for the same team', 'shield', 'loyalty', 'count', '{"sameTeam": 25}', 150, 'rare'),
  ('home_ground', 'Home Ground Advantage', 'Attend 5 games at the same venue', 'home', 'loyalty', 'count', '{"sameVenue": 5}', 30, 'common'),
  ('grand_final', 'Grand Finalist', 'Attend a Grand Final', 'trophy', 'special', 'specific', '{"round": "Grand Final"}', 100, 'epic'),
  ('finals_series', 'Finals Fever', 'Attend 3 finals games in a season', 'flame', 'special', 'count', '{"finalsGames": 3}', 75, 'rare'),
  ('boxing_day_test', 'Boxing Day Regular', 'Attend the Boxing Day Test at the MCG', 'gift', 'special', 'specific', '{"event": "boxing_day_test"}', 50, 'rare'),
  ('ashes_test', 'Ashes Witness', 'Attend an Ashes Test match', 'bonfire', 'special', 'specific', '{"competition": "Ashes"}', 75, 'rare'),
  ('state_of_origin', 'Origin Hero', 'Attend a State of Origin match', 'flash', 'special', 'specific', '{"competition": "State of Origin"}', 60, 'rare'),
  ('australian_open', 'Aussie Open Attendee', 'Attend an Australian Open match', 'tennisball', 'special', 'specific', '{"competition": "Australian Open"}', 50, 'uncommon'),
  ('weekly_streak_4', 'Monthly Regular', 'Attend at least one game per week for 4 weeks', 'calendar', 'attendance', 'streak', '{"weeks": 4}', 50, 'uncommon'),
  ('monthly_streak_6', 'Half Year Hero', 'Attend at least one game per month for 6 months', 'calendar-outline', 'attendance', 'streak', '{"months": 6}', 100, 'rare'),
  ('yearly_attendance', 'Year-Round Fan', 'Attend at least one game per month for a full year', 'sunny', 'attendance', 'streak', '{"months": 12}', 200, 'epic');
