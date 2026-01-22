-- Add logo_url column if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ==========================================
-- First, update existing teams with logo URLs
-- ==========================================

-- AFL Teams
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/adel.png' WHERE LOWER(name) = 'adelaide crows';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/bl.png' WHERE LOWER(name) = 'brisbane lions';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/carl.png' WHERE LOWER(name) = 'carlton';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/coll.png' WHERE LOWER(name) = 'collingwood';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/ess.png' WHERE LOWER(name) = 'essendon';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/frem.png' WHERE LOWER(name) = 'fremantle';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/geel.png' WHERE LOWER(name) = 'geelong cats';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/gc.png' WHERE LOWER(name) = 'gold coast suns';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/gws.png' WHERE LOWER(name) = 'gws giants';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/haw.png' WHERE LOWER(name) = 'hawthorn';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/melb.png' WHERE LOWER(name) = 'melbourne';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/nmfc.png' WHERE LOWER(name) = 'north melbourne';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/port.png' WHERE LOWER(name) = 'port adelaide';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/rich.png' WHERE LOWER(name) = 'richmond';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/stk.png' WHERE LOWER(name) = 'st kilda';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/syd.png' WHERE LOWER(name) = 'sydney swans';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/wce.png' WHERE LOWER(name) = 'west coast eagles';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/wb.png' WHERE LOWER(name) = 'western bulldogs';

-- NRL Teams
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/bri.png' WHERE LOWER(name) = 'brisbane broncos';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/can.png' WHERE LOWER(name) = 'canberra raiders';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/can-b.png' WHERE LOWER(name) = 'canterbury bulldogs';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/cro.png' WHERE LOWER(name) = 'cronulla sharks';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/gld.png' WHERE LOWER(name) = 'gold coast titans';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/man.png' WHERE LOWER(name) = 'manly sea eagles';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/mel.png' WHERE LOWER(name) = 'melbourne storm';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/new.png' WHERE LOWER(name) = 'newcastle knights';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/nql.png' WHERE LOWER(name) = 'north queensland cowboys';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/par.png' WHERE LOWER(name) = 'parramatta eels';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/pen.png' WHERE LOWER(name) = 'penrith panthers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/sou.png' WHERE LOWER(name) = 'south sydney rabbitohs';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/sgi.png' WHERE LOWER(name) = 'st george illawarra dragons';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/syd.png' WHERE LOWER(name) = 'sydney roosters';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/wst.png' WHERE LOWER(name) = 'wests tigers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/war.png' WHERE LOWER(name) = 'new zealand warriors';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nrl/500/dol.png' WHERE LOWER(name) = 'dolphins';

-- A-League Teams
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5765.png' WHERE LOWER(name) = 'melbourne victory';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/6693.png' WHERE LOWER(name) = 'melbourne city';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5767.png' WHERE LOWER(name) = 'sydney fc';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/8676.png' WHERE LOWER(name) = 'western sydney wanderers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5753.png' WHERE LOWER(name) = 'brisbane roar';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5750.png' WHERE LOWER(name) = 'adelaide united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5766.png' WHERE LOWER(name) = 'perth glory';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5754.png' WHERE LOWER(name) = 'central coast mariners';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5768.png' WHERE LOWER(name) = 'wellington phoenix';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/23796.png' WHERE LOWER(name) = 'macarthur fc';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/22846.png' WHERE LOWER(name) = 'western united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5764.png' WHERE LOWER(name) = 'newcastle jets';

-- BBL Cricket Teams
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2441.png' WHERE LOWER(name) = 'melbourne stars';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2442.png' WHERE LOWER(name) = 'melbourne renegades';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2445.png' WHERE LOWER(name) = 'sydney sixers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2446.png' WHERE LOWER(name) = 'sydney thunder';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2439.png' WHERE LOWER(name) = 'brisbane heat';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2438.png' WHERE LOWER(name) = 'adelaide strikers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2444.png' WHERE LOWER(name) = 'perth scorchers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2440.png' WHERE LOWER(name) = 'hobart hurricanes';

-- ==========================================
-- Now insert new international teams
-- Using INSERT ... SELECT to get sport_id dynamically
-- ==========================================

-- PREMIER LEAGUE
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Arsenal', 'ARS', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png'),
  ('Aston Villa', 'AVL', 'Birmingham', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png'),
  ('Bournemouth', 'BOU', 'Bournemouth', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png'),
  ('Brentford', 'BRE', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png'),
  ('Brighton', 'BHA', 'Brighton', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png'),
  ('Chelsea', 'CHE', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png'),
  ('Crystal Palace', 'CRY', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png'),
  ('Everton', 'EVE', 'Liverpool', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png'),
  ('Fulham', 'FUL', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png'),
  ('Ipswich Town', 'IPS', 'Ipswich', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png'),
  ('Leicester City', 'LEI', 'Leicester', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png'),
  ('Liverpool', 'LIV', 'Liverpool', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png'),
  ('Manchester City', 'MCI', 'Manchester', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png'),
  ('Manchester United', 'MUN', 'Manchester', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png'),
  ('Newcastle United', 'NEW', 'Newcastle', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png'),
  ('Nottingham Forest', 'NFO', 'Nottingham', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png'),
  ('Southampton', 'SOU', 'Southampton', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png'),
  ('Tottenham Hotspur', 'TOT', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png'),
  ('West Ham United', 'WHU', 'London', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png'),
  ('Wolverhampton', 'WOL', 'Wolverhampton', 'ENG', 'GB', 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Soccer'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- LA LIGA
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Athletic Bilbao', 'ATH', 'Bilbao', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png'),
  ('Atletico Madrid', 'ATM', 'Madrid', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png'),
  ('Barcelona', 'BAR', 'Barcelona', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png'),
  ('Celta Vigo', 'CEL', 'Vigo', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png'),
  ('Espanyol', 'ESP', 'Barcelona', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/88.png'),
  ('Getafe', 'GET', 'Madrid', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/9812.png'),
  ('Girona', 'GIR', 'Girona', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/9736.png'),
  ('Las Palmas', 'LPA', 'Las Palmas', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/9811.png'),
  ('Leganes', 'LEG', 'Madrid', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/9805.png'),
  ('Mallorca', 'MAL', 'Mallorca', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/96.png'),
  ('Osasuna', 'OSA', 'Pamplona', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png'),
  ('Rayo Vallecano', 'RAY', 'Madrid', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/98.png'),
  ('Real Betis', 'BET', 'Seville', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png'),
  ('Real Madrid', 'RMA', 'Madrid', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png'),
  ('Real Sociedad', 'RSO', 'San Sebastian', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png'),
  ('Real Valladolid', 'VLL', 'Valladolid', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png'),
  ('Sevilla', 'SEV', 'Seville', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png'),
  ('Valencia', 'VAL', 'Valencia', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png'),
  ('Villarreal', 'VIL', 'Villarreal', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png'),
  ('Alaves', 'ALA', 'Vitoria-Gasteiz', 'ESP', 'ES', 'https://a.espncdn.com/i/teamlogos/soccer/500/92.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Soccer'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- BUNDESLIGA
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Bayern Munich', 'BAY', 'Munich', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png'),
  ('Borussia Dortmund', 'BVB', 'Dortmund', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png'),
  ('RB Leipzig', 'RBL', 'Leipzig', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png'),
  ('Bayer Leverkusen', 'LEV', 'Leverkusen', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png'),
  ('Eintracht Frankfurt', 'SGE', 'Frankfurt', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png'),
  ('Wolfsburg', 'WOB', 'Wolfsburg', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/138.png'),
  ('Borussia Monchengladbach', 'BMG', 'Monchengladbach', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png'),
  ('Freiburg', 'SCF', 'Freiburg', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/10794.png'),
  ('Stuttgart', 'VFB', 'Stuttgart', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png'),
  ('Hoffenheim', 'TSG', 'Sinsheim', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/9773.png'),
  ('Mainz 05', 'M05', 'Mainz', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/10762.png'),
  ('Augsburg', 'FCA', 'Augsburg', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/9772.png'),
  ('Werder Bremen', 'SVW', 'Bremen', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/137.png'),
  ('Union Berlin', 'FCU', 'Berlin', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/10998.png'),
  ('Bochum', 'BOC', 'Bochum', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/3999.png'),
  ('Heidenheim', 'HDH', 'Heidenheim', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/10792.png'),
  ('St. Pauli', 'STP', 'Hamburg', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/10796.png'),
  ('Holstein Kiel', 'KIE', 'Kiel', 'GER', 'DE', 'https://a.espncdn.com/i/teamlogos/soccer/500/11178.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Soccer'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- SERIE A
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Inter Milan', 'INT', 'Milan', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png'),
  ('AC Milan', 'MIL', 'Milan', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png'),
  ('Juventus', 'JUV', 'Turin', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png'),
  ('Napoli', 'NAP', 'Naples', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png'),
  ('Roma', 'ROM', 'Rome', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png'),
  ('Lazio', 'LAZ', 'Rome', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png'),
  ('Atalanta', 'ATA', 'Bergamo', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png'),
  ('Fiorentina', 'FIO', 'Florence', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png'),
  ('Bologna', 'BOL', 'Bologna', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png'),
  ('Torino', 'TOR', 'Turin', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/119.png'),
  ('Udinese', 'UDI', 'Udine', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/120.png'),
  ('Genoa', 'GEN', 'Genoa', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/9875.png'),
  ('Monza', 'MON', 'Monza', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/10270.png'),
  ('Verona', 'VER', 'Verona', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/10263.png'),
  ('Cagliari', 'CAG', 'Cagliari', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png'),
  ('Parma', 'PAR', 'Parma', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png'),
  ('Empoli', 'EMP', 'Empoli', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/9876.png'),
  ('Lecce', 'LEC', 'Lecce', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png'),
  ('Como', 'COM', 'Como', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/9877.png'),
  ('Venezia', 'VEN', 'Venice', 'ITA', 'IT', 'https://a.espncdn.com/i/teamlogos/soccer/500/10257.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Soccer'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- NBA
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Atlanta Hawks', 'ATL', 'Atlanta', 'GA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png'),
  ('Boston Celtics', 'BOS', 'Boston', 'MA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png'),
  ('Brooklyn Nets', 'BKN', 'Brooklyn', 'NY', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png'),
  ('Charlotte Hornets', 'CHA', 'Charlotte', 'NC', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png'),
  ('Chicago Bulls', 'CHI', 'Chicago', 'IL', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png'),
  ('Cleveland Cavaliers', 'CLE', 'Cleveland', 'OH', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png'),
  ('Dallas Mavericks', 'DAL', 'Dallas', 'TX', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png'),
  ('Denver Nuggets', 'DEN', 'Denver', 'CO', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/den.png'),
  ('Detroit Pistons', 'DET', 'Detroit', 'MI', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/det.png'),
  ('Golden State Warriors', 'GSW', 'San Francisco', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png'),
  ('Houston Rockets', 'HOU', 'Houston', 'TX', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png'),
  ('Indiana Pacers', 'IND', 'Indianapolis', 'IN', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png'),
  ('LA Clippers', 'LAC', 'Los Angeles', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png'),
  ('Los Angeles Lakers', 'LAL', 'Los Angeles', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png'),
  ('Memphis Grizzlies', 'MEM', 'Memphis', 'TN', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png'),
  ('Miami Heat', 'MIA', 'Miami', 'FL', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png'),
  ('Milwaukee Bucks', 'MIL', 'Milwaukee', 'WI', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png'),
  ('Minnesota Timberwolves', 'MIN', 'Minneapolis', 'MN', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/min.png'),
  ('New Orleans Pelicans', 'NOP', 'New Orleans', 'LA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/no.png'),
  ('New York Knicks', 'NYK', 'New York', 'NY', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png'),
  ('Oklahoma City Thunder', 'OKC', 'Oklahoma City', 'OK', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png'),
  ('Orlando Magic', 'ORL', 'Orlando', 'FL', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png'),
  ('Philadelphia 76ers', 'PHI', 'Philadelphia', 'PA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png'),
  ('Phoenix Suns', 'PHX', 'Phoenix', 'AZ', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png'),
  ('Portland Trail Blazers', 'POR', 'Portland', 'OR', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/por.png'),
  ('Sacramento Kings', 'SAC', 'Sacramento', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png'),
  ('San Antonio Spurs', 'SAS', 'San Antonio', 'TX', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png'),
  ('Toronto Raptors', 'TOR', 'Toronto', 'ON', 'CA', 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png'),
  ('Utah Jazz', 'UTA', 'Salt Lake City', 'UT', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/uta.png'),
  ('Washington Wizards', 'WAS', 'Washington', 'DC', 'US', 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Basketball'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- NFL
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Arizona Cardinals', 'ARI', 'Phoenix', 'AZ', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png'),
  ('Atlanta Falcons', 'ATL', 'Atlanta', 'GA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png'),
  ('Baltimore Ravens', 'BAL', 'Baltimore', 'MD', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png'),
  ('Buffalo Bills', 'BUF', 'Buffalo', 'NY', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'),
  ('Carolina Panthers', 'CAR', 'Charlotte', 'NC', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png'),
  ('Chicago Bears', 'CHI', 'Chicago', 'IL', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png'),
  ('Cincinnati Bengals', 'CIN', 'Cincinnati', 'OH', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png'),
  ('Cleveland Browns', 'CLE', 'Cleveland', 'OH', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png'),
  ('Dallas Cowboys', 'DAL', 'Dallas', 'TX', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png'),
  ('Denver Broncos', 'DEN', 'Denver', 'CO', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png'),
  ('Detroit Lions', 'DET', 'Detroit', 'MI', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png'),
  ('Green Bay Packers', 'GB', 'Green Bay', 'WI', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png'),
  ('Houston Texans', 'HOU', 'Houston', 'TX', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png'),
  ('Indianapolis Colts', 'IND', 'Indianapolis', 'IN', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png'),
  ('Jacksonville Jaguars', 'JAX', 'Jacksonville', 'FL', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png'),
  ('Kansas City Chiefs', 'KC', 'Kansas City', 'MO', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'),
  ('Las Vegas Raiders', 'LV', 'Las Vegas', 'NV', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png'),
  ('Los Angeles Chargers', 'LAC', 'Los Angeles', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png'),
  ('Los Angeles Rams', 'LAR', 'Los Angeles', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png'),
  ('Miami Dolphins', 'MIA', 'Miami', 'FL', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png'),
  ('Minnesota Vikings', 'MIN', 'Minneapolis', 'MN', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png'),
  ('New England Patriots', 'NE', 'Boston', 'MA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png'),
  ('New Orleans Saints', 'NO', 'New Orleans', 'LA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png'),
  ('New York Giants', 'NYG', 'New York', 'NY', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png'),
  ('New York Jets', 'NYJ', 'New York', 'NY', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png'),
  ('Philadelphia Eagles', 'PHI', 'Philadelphia', 'PA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'),
  ('Pittsburgh Steelers', 'PIT', 'Pittsburgh', 'PA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png'),
  ('San Francisco 49ers', 'SF', 'San Francisco', 'CA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png'),
  ('Seattle Seahawks', 'SEA', 'Seattle', 'WA', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png'),
  ('Tampa Bay Buccaneers', 'TB', 'Tampa', 'FL', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png'),
  ('Tennessee Titans', 'TEN', 'Nashville', 'TN', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png'),
  ('Washington Commanders', 'WAS', 'Washington', 'DC', 'US', 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Basketball'  -- NFL teams will use Basketball sport until we have American Football sport
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- INTERNATIONAL CRICKET TEAMS
INSERT INTO teams (id, sport_id, name, short_name, city, state, country, logo_url)
SELECT
  gen_random_uuid(),
  s.id,
  team_data.name,
  team_data.short_name,
  team_data.city,
  team_data.state,
  team_data.country,
  team_data.logo_url
FROM sports s
CROSS JOIN (VALUES
  ('Australia Cricket', 'AUS', 'National', NULL, 'AU', 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png'),
  ('England Cricket', 'ENG', 'National', NULL, 'GB', 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png'),
  ('India Cricket', 'IND', 'National', NULL, 'IN', 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png'),
  ('Pakistan Cricket', 'PAK', 'National', NULL, 'PK', 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png'),
  ('South Africa Cricket', 'RSA', 'National', NULL, 'ZA', 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png'),
  ('New Zealand Cricket', 'NZL', 'National', NULL, 'NZ', 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png'),
  ('West Indies Cricket', 'WI', 'National', NULL, 'WI', 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png'),
  ('Sri Lanka Cricket', 'SL', 'National', NULL, 'LK', 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png'),
  ('Bangladesh Cricket', 'BAN', 'National', NULL, 'BD', 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png'),
  ('Afghanistan Cricket', 'AFG', 'National', NULL, 'AF', 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png')
) AS team_data(name, short_name, city, state, country, logo_url)
WHERE s.name = 'Cricket'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE LOWER(t.name) = LOWER(team_data.name));

-- Update existing Australia cricket team if exists
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' WHERE LOWER(name) = 'australia' AND sport_id IN (SELECT id FROM sports WHERE name = 'Cricket');
