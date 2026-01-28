-- Populate all achievement definitions in the database
-- This allows the client to only insert into user_achievements (which they have permission for)
-- instead of trying to upsert achievements (which they don't have permission for)

INSERT INTO achievements (code, name, description, icon, category, requirement_type, requirement_value, points, rarity)
VALUES
  -- ATTENDANCE ACHIEVEMENTS
  ('first_game', 'First Timer', 'Attend your first sporting event', 'flag', 'attendance', 'count', '{"count": 1}', 10, 'common'),
  ('three_games', 'Getting Started', 'Attend 3 sporting events', 'footsteps', 'attendance', 'count', '{"count": 3}', 15, 'common'),
  ('five_games', 'Regular Goer', 'Attend 5 sporting events', 'ticket', 'attendance', 'count', '{"count": 5}', 20, 'common'),
  ('ten_games', 'Dedicated', 'Attend 10 sporting events', 'bookmark', 'attendance', 'count', '{"count": 10}', 30, 'common'),
  ('twenty_five_games', 'True Fan', 'Attend 25 sporting events', 'star', 'attendance', 'count', '{"count": 25}', 50, 'uncommon'),
  ('weekly_streak_2', 'Two Week Warrior', 'Attend at least one event per week for 2 weeks', 'calendar', 'attendance', 'streak', '{"weeks": 2}', 25, 'uncommon'),
  ('weekly_streak_4', 'Monthly Regular', 'Attend at least one event per week for 4 weeks', 'calendar', 'attendance', 'streak', '{"weeks": 4}', 50, 'uncommon'),
  ('fifty_games', 'Super Fan', 'Attend 50 sporting events', 'trophy', 'attendance', 'count', '{"count": 50}', 100, 'rare'),
  ('monthly_streak_3', 'Quarter Year Champ', 'Attend at least one event per month for 3 months', 'calendar-outline', 'attendance', 'streak', '{"months": 3}', 60, 'rare'),
  ('monthly_streak_6', 'Half Year Hero', 'Attend at least one event per month for 6 months', 'calendar-outline', 'attendance', 'streak', '{"months": 6}', 100, 'rare'),
  ('hundred_games', 'Living Legend', 'Attend 100 sporting events', 'medal', 'attendance', 'count', '{"count": 100}', 250, 'epic'),
  ('yearly_attendance', 'Year-Round Fan', 'Attend at least one event per month for a full year', 'sunny', 'attendance', 'streak', '{"months": 12}', 200, 'epic'),
  ('two_fifty_games', 'Hall of Famer', 'Attend 250 sporting events', 'ribbon', 'attendance', 'count', '{"count": 250}', 500, 'legendary'),
  ('five_hundred_games', 'Ultimate Fan', 'Attend 500 sporting events', 'diamond', 'attendance', 'count', '{"count": 500}', 1000, 'legendary'),

  -- DIVERSITY ACHIEVEMENTS
  ('two_sports', 'Trying New Things', 'Attend events in 2 different sports', 'shuffle', 'diversity', 'count', '{"sports": 2}', 15, 'common'),
  ('multi_sport', 'Sports Sampler', 'Attend events in 3 different sports', 'apps', 'diversity', 'count', '{"sports": 3}', 30, 'common'),
  ('two_venues', 'Venue Visitor', 'Attend events at 2 different venues', 'navigate', 'diversity', 'count', '{"venues": 2}', 15, 'common'),
  ('five_teams', 'Team Spotter', 'Watch 5 different teams play', 'eye', 'diversity', 'count', '{"teams": 5}', 25, 'common'),
  ('all_rounder', 'All-Rounder', 'Attend events in 5 different sports', 'grid', 'diversity', 'count', '{"sports": 5}', 75, 'uncommon'),
  ('venue_explorer', 'Venue Explorer', 'Attend events at 5 different venues', 'location', 'diversity', 'count', '{"venues": 5}', 40, 'uncommon'),
  ('team_variety', 'Team Watcher', 'Watch 10 different teams play', 'people', 'diversity', 'count', '{"teams": 10}', 50, 'uncommon'),
  ('stadium_hopper', 'Stadium Hopper', 'Attend events at 10 different venues', 'map', 'diversity', 'count', '{"venues": 10}', 100, 'rare'),
  ('sports_enthusiast', 'Sports Enthusiast', 'Attend events in 7 different sports', 'fitness', 'diversity', 'count', '{"sports": 7}', 100, 'rare'),
  ('team_collector', 'Team Collector', 'Watch 25 different teams play', 'albums', 'diversity', 'count', '{"teams": 25}', 100, 'rare'),
  ('venue_master', 'Venue Master', 'Attend events at 20 different venues', 'globe', 'diversity', 'count', '{"venues": 20}', 200, 'epic'),
  ('sports_connoisseur', 'Sports Connoisseur', 'Attend events in 10 different sports', 'planet', 'diversity', 'count', '{"sports": 10}', 200, 'epic'),
  ('world_traveler', 'World Traveler', 'Attend events at 50 different venues', 'airplane', 'diversity', 'count', '{"venues": 50}', 500, 'legendary'),

  -- LOYALTY ACHIEVEMENTS
  ('team_loyal_2', 'Team Follower', 'Attend 2 games for the same team', 'heart-outline', 'loyalty', 'count', '{"sameTeam": 2}', 15, 'common'),
  ('home_ground_2', 'Familiar Grounds', 'Attend 2 events at the same venue', 'home-outline', 'loyalty', 'count', '{"sameVenue": 2}', 15, 'common'),
  ('team_loyal_5', 'Loyal Supporter', 'Attend 5 games for the same team', 'heart', 'loyalty', 'count', '{"sameTeam": 5}', 35, 'common'),
  ('home_ground', 'Home Ground Advantage', 'Attend 5 events at the same venue', 'home', 'loyalty', 'count', '{"sameVenue": 5}', 30, 'common'),
  ('team_loyal_10', 'Die-Hard Fan', 'Attend 10 games for the same team', 'heart-circle', 'loyalty', 'count', '{"sameTeam": 10}', 75, 'uncommon'),
  ('home_ground_10', 'Regular at the Ground', 'Attend 10 events at the same venue', 'business', 'loyalty', 'count', '{"sameVenue": 10}', 60, 'uncommon'),
  ('team_loyal_25', 'Season Ticker', 'Attend 25 games for the same team', 'shield', 'loyalty', 'count', '{"sameTeam": 25}', 150, 'rare'),
  ('home_ground_25', 'Venue Regular', 'Attend 25 events at the same venue', 'storefront', 'loyalty', 'count', '{"sameVenue": 25}', 120, 'rare'),
  ('team_loyal_50', 'True Believer', 'Attend 50 games for the same team', 'shield-checkmark', 'loyalty', 'count', '{"sameTeam": 50}', 300, 'epic'),
  ('team_loyal_100', 'Lifelong Fan', 'Attend 100 games for the same team', 'shield-half', 'loyalty', 'count', '{"sameTeam": 100}', 500, 'legendary'),

  -- SPECIAL ACHIEVEMENTS
  ('derby_day', 'Derby Day', 'Attend a local derby match', 'flash-outline', 'special', 'specific', '{"matchType": "derby"}', 25, 'common'),
  ('night_game', 'Night Owl', 'Attend an evening event (after 6pm)', 'moon', 'special', 'specific', '{"timeOfDay": "evening"}', 15, 'common'),
  ('australian_open', 'Aussie Open Attendee', 'Attend an Australian Open match', 'tennisball', 'special', 'specific', '{"competition": "Australian Open"}', 50, 'uncommon'),
  ('finals_game', 'Finals Bound', 'Attend a finals game', 'trending-up', 'special', 'specific', '{"round": "Finals"}', 40, 'uncommon'),
  ('international_match', 'International Stage', 'Attend an international match', 'flag', 'special', 'specific', '{"matchType": "international"}', 50, 'uncommon'),
  ('finals_series', 'Finals Fever', 'Attend 3 finals games in a season', 'flame', 'special', 'count', '{"finalsGames": 3}', 75, 'rare'),
  ('boxing_day_test', 'Boxing Day Regular', 'Attend the Boxing Day Test at the MCG', 'gift', 'special', 'specific', '{"event": "boxing_day_test"}', 50, 'rare'),
  ('ashes_test', 'Ashes Witness', 'Attend an Ashes Test match', 'bonfire', 'special', 'specific', '{"competition": "Ashes"}', 75, 'rare'),
  ('state_of_origin', 'Origin Hero', 'Attend a State of Origin match', 'flash', 'special', 'specific', '{"competition": "State of Origin"}', 60, 'rare'),
  ('world_cup', 'World Cup Witness', 'Attend a World Cup match (any sport)', 'earth', 'special', 'specific', '{"competition": "World Cup"}', 75, 'rare'),
  ('grand_final', 'Grand Finalist', 'Attend a Grand Final', 'trophy', 'special', 'specific', '{"round": "Grand Final"}', 100, 'epic'),
  ('championship_game', 'Championship Day', 'Attend a championship/title decider', 'trophy-outline', 'special', 'specific', '{"round": "Championship"}', 100, 'epic'),
  ('multiple_grand_finals', 'Finals Regular', 'Attend 3 Grand Finals', 'podium', 'special', 'count', '{"grandFinals": 3}', 200, 'epic'),
  ('olympic_event', 'Olympic Spirit', 'Attend an Olympic event', 'medal-outline', 'special', 'specific', '{"competition": "Olympics"}', 250, 'legendary'),
  ('super_bowl', 'Super Bowl Sunday', 'Attend a Super Bowl', 'american-football', 'special', 'specific', '{"event": "super_bowl"}', 300, 'legendary')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  points = EXCLUDED.points,
  rarity = EXCLUDED.rarity;
