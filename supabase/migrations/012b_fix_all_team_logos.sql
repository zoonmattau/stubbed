-- Fix ALL team logo URLs with correct, working URLs
-- This migration corrects logo URLs for AFL, NRL, A-League, and BBL teams

-- ==========================================
-- AFL Teams - ESPN CDN (verified working)
-- Format: https://a.espncdn.com/i/teamlogos/afl/500/{abbrev}.png
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/adel.png' WHERE LOWER(name) = 'adelaide crows';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/bl.png' WHERE LOWER(name) = 'brisbane lions';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/carl.png' WHERE LOWER(name) = 'carlton';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/coll.png' WHERE LOWER(name) = 'collingwood';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/ess.png' WHERE LOWER(name) = 'essendon';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/frem.png' WHERE LOWER(name) = 'fremantle';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/geel.png' WHERE LOWER(name) = 'geelong cats';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/afl/500/gcfc.png' WHERE LOWER(name) = 'gold coast suns';
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

-- ==========================================
-- NRL Teams - NRL.com theme SVGs (verified working)
-- Format: https://www.nrl.com/.theme/{team}/badge-basic24-light.svg
-- ==========================================
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/broncos/badge-basic24-light.svg' WHERE LOWER(name) = 'brisbane broncos';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/raiders/badge-basic24-light.svg' WHERE LOWER(name) = 'canberra raiders';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/bulldogs/badge-basic24-light.svg' WHERE LOWER(name) = 'canterbury bulldogs';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/sharks/badge-basic24-light.svg' WHERE LOWER(name) = 'cronulla sharks';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/titans/badge-basic24-light.svg' WHERE LOWER(name) = 'gold coast titans';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/seaeagles/badge-basic24-light.svg' WHERE LOWER(name) = 'manly sea eagles';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/storm/badge-basic24-light.svg' WHERE LOWER(name) = 'melbourne storm';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/knights/badge-basic24-light.svg' WHERE LOWER(name) = 'newcastle knights';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/cowboys/badge-basic24-light.svg' WHERE LOWER(name) = 'north queensland cowboys';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/eels/badge-basic24-light.svg' WHERE LOWER(name) = 'parramatta eels';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/panthers/badge-basic24-light.svg' WHERE LOWER(name) = 'penrith panthers';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/rabbitohs/badge-basic24-light.svg' WHERE LOWER(name) = 'south sydney rabbitohs';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/dragons/badge-basic24-light.svg' WHERE LOWER(name) = 'st george illawarra dragons';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/roosters/badge-basic24-light.svg' WHERE LOWER(name) = 'sydney roosters';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/tigers/badge-basic24-light.svg' WHERE LOWER(name) = 'wests tigers';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/warriors/badge-basic24-light.svg' WHERE LOWER(name) = 'new zealand warriors';
UPDATE teams SET logo_url = 'https://www.nrl.com/.theme/dolphins/badge-basic24-light.svg' WHERE LOWER(name) = 'dolphins';

-- ==========================================
-- A-League Teams - ESPN CDN (verified working)
-- Format: https://a.espncdn.com/i/teamlogos/soccer/500/{team_id}.png
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5328.png' WHERE LOWER(name) = 'melbourne victory';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/11143.png' WHERE LOWER(name) = 'melbourne city';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5327.png' WHERE LOWER(name) = 'sydney fc';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/13696.png' WHERE LOWER(name) = 'western sydney wanderers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5326.png' WHERE LOWER(name) = 'brisbane roar';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5321.png' WHERE LOWER(name) = 'adelaide united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5322.png' WHERE LOWER(name) = 'perth glory';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5325.png' WHERE LOWER(name) = 'central coast mariners';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/8352.png' WHERE LOWER(name) = 'wellington phoenix';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/19340.png' WHERE LOWER(name) = 'macarthur fc';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/21803.png' WHERE LOWER(name) = 'western united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/5323.png' WHERE LOWER(name) = 'newcastle jets';

-- ==========================================
-- BBL Cricket Teams - ESPN CDN with correct IDs (verified working)
-- Format: https://a.espncdn.com/i/teamlogos/cricket/500/{team_id}.png
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509672.png' WHERE LOWER(name) = 'melbourne stars';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509671.png' WHERE LOWER(name) = 'melbourne renegades';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509673.png' WHERE LOWER(name) = 'sydney sixers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509674.png' WHERE LOWER(name) = 'sydney thunder';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509668.png' WHERE LOWER(name) = 'brisbane heat';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509667.png' WHERE LOWER(name) = 'adelaide strikers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509670.png' WHERE LOWER(name) = 'perth scorchers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/509669.png' WHERE LOWER(name) = 'hobart hurricanes';

-- Australia national cricket team
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' WHERE LOWER(name) = 'australia' AND sport_id IN (SELECT id FROM sports WHERE name = 'Cricket');

-- ==========================================
-- International Cricket Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' WHERE LOWER(name) = 'australia cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' WHERE LOWER(name) = 'england cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' WHERE LOWER(name) = 'india cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png' WHERE LOWER(name) = 'pakistan cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png' WHERE LOWER(name) = 'south africa cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png' WHERE LOWER(name) = 'new zealand cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' WHERE LOWER(name) = 'west indies cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png' WHERE LOWER(name) = 'sri lanka cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png' WHERE LOWER(name) = 'bangladesh cricket';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png' WHERE LOWER(name) = 'afghanistan cricket';

-- ==========================================
-- Premier League Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' WHERE LOWER(name) = 'arsenal';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png' WHERE LOWER(name) = 'aston villa';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png' WHERE LOWER(name) = 'bournemouth';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png' WHERE LOWER(name) = 'brentford';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png' WHERE LOWER(name) = 'brighton';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' WHERE LOWER(name) = 'chelsea';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png' WHERE LOWER(name) = 'crystal palace';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png' WHERE LOWER(name) = 'everton';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png' WHERE LOWER(name) = 'fulham';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png' WHERE LOWER(name) = 'ipswich town';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png' WHERE LOWER(name) = 'leicester city';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' WHERE LOWER(name) = 'liverpool';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' WHERE LOWER(name) = 'manchester city';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' WHERE LOWER(name) = 'manchester united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png' WHERE LOWER(name) = 'newcastle united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png' WHERE LOWER(name) = 'nottingham forest';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png' WHERE LOWER(name) = 'southampton';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png' WHERE LOWER(name) = 'tottenham hotspur';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png' WHERE LOWER(name) = 'west ham united';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png' WHERE LOWER(name) = 'wolverhampton';

-- ==========================================
-- La Liga Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png' WHERE LOWER(name) = 'athletic bilbao';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png' WHERE LOWER(name) = 'atletico madrid';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png' WHERE LOWER(name) = 'barcelona';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png' WHERE LOWER(name) = 'celta vigo';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/88.png' WHERE LOWER(name) = 'espanyol';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9812.png' WHERE LOWER(name) = 'getafe';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9736.png' WHERE LOWER(name) = 'girona';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9811.png' WHERE LOWER(name) = 'las palmas';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9805.png' WHERE LOWER(name) = 'leganes';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/96.png' WHERE LOWER(name) = 'mallorca';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png' WHERE LOWER(name) = 'osasuna';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/98.png' WHERE LOWER(name) = 'rayo vallecano';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png' WHERE LOWER(name) = 'real betis';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png' WHERE LOWER(name) = 'real madrid';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png' WHERE LOWER(name) = 'real sociedad';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png' WHERE LOWER(name) = 'real valladolid';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png' WHERE LOWER(name) = 'sevilla';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png' WHERE LOWER(name) = 'valencia';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png' WHERE LOWER(name) = 'villarreal';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/92.png' WHERE LOWER(name) = 'alaves';

-- ==========================================
-- Bundesliga Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png' WHERE LOWER(name) = 'bayern munich';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png' WHERE LOWER(name) = 'borussia dortmund';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png' WHERE LOWER(name) = 'rb leipzig';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png' WHERE LOWER(name) = 'bayer leverkusen';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png' WHERE LOWER(name) = 'eintracht frankfurt';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/138.png' WHERE LOWER(name) = 'wolfsburg';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png' WHERE LOWER(name) = 'borussia monchengladbach';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10794.png' WHERE LOWER(name) = 'freiburg';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png' WHERE LOWER(name) = 'stuttgart';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9773.png' WHERE LOWER(name) = 'hoffenheim';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10762.png' WHERE LOWER(name) = 'mainz 05';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9772.png' WHERE LOWER(name) = 'augsburg';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/137.png' WHERE LOWER(name) = 'werder bremen';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10998.png' WHERE LOWER(name) = 'union berlin';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/3999.png' WHERE LOWER(name) = 'bochum';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10792.png' WHERE LOWER(name) = 'heidenheim';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10796.png' WHERE LOWER(name) = 'st. pauli';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/11178.png' WHERE LOWER(name) = 'holstein kiel';

-- ==========================================
-- Serie A Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png' WHERE LOWER(name) = 'inter milan';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png' WHERE LOWER(name) = 'ac milan';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png' WHERE LOWER(name) = 'juventus';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png' WHERE LOWER(name) = 'napoli';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png' WHERE LOWER(name) = 'roma';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png' WHERE LOWER(name) = 'lazio';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png' WHERE LOWER(name) = 'atalanta';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png' WHERE LOWER(name) = 'fiorentina';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png' WHERE LOWER(name) = 'bologna';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/119.png' WHERE LOWER(name) = 'torino';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/120.png' WHERE LOWER(name) = 'udinese';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9875.png' WHERE LOWER(name) = 'genoa';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10270.png' WHERE LOWER(name) = 'monza';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10263.png' WHERE LOWER(name) = 'verona';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png' WHERE LOWER(name) = 'cagliari';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png' WHERE LOWER(name) = 'parma';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9876.png' WHERE LOWER(name) = 'empoli';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png' WHERE LOWER(name) = 'lecce';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/9877.png' WHERE LOWER(name) = 'como';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/soccer/500/10257.png' WHERE LOWER(name) = 'venezia';

-- ==========================================
-- NBA Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png' WHERE LOWER(name) = 'atlanta hawks';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' WHERE LOWER(name) = 'boston celtics';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png' WHERE LOWER(name) = 'brooklyn nets';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png' WHERE LOWER(name) = 'charlotte hornets';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' WHERE LOWER(name) = 'chicago bulls';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' WHERE LOWER(name) = 'cleveland cavaliers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' WHERE LOWER(name) = 'dallas mavericks';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/den.png' WHERE LOWER(name) = 'denver nuggets';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/det.png' WHERE LOWER(name) = 'detroit pistons';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png' WHERE LOWER(name) = 'golden state warriors';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png' WHERE LOWER(name) = 'houston rockets';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png' WHERE LOWER(name) = 'indiana pacers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png' WHERE LOWER(name) = 'la clippers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' WHERE LOWER(name) = 'los angeles lakers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png' WHERE LOWER(name) = 'memphis grizzlies';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' WHERE LOWER(name) = 'miami heat';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' WHERE LOWER(name) = 'milwaukee bucks';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' WHERE LOWER(name) = 'minnesota timberwolves';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/no.png' WHERE LOWER(name) = 'new orleans pelicans';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png' WHERE LOWER(name) = 'new york knicks';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' WHERE LOWER(name) = 'oklahoma city thunder';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png' WHERE LOWER(name) = 'orlando magic';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' WHERE LOWER(name) = 'philadelphia 76ers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' WHERE LOWER(name) = 'phoenix suns';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' WHERE LOWER(name) = 'portland trail blazers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png' WHERE LOWER(name) = 'sacramento kings';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png' WHERE LOWER(name) = 'san antonio spurs';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png' WHERE LOWER(name) = 'toronto raptors';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/uta.png' WHERE LOWER(name) = 'utah jazz';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png' WHERE LOWER(name) = 'washington wizards';

-- ==========================================
-- NFL Teams - ESPN CDN
-- ==========================================
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' WHERE LOWER(name) = 'arizona cardinals';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' WHERE LOWER(name) = 'atlanta falcons';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' WHERE LOWER(name) = 'baltimore ravens';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' WHERE LOWER(name) = 'buffalo bills';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' WHERE LOWER(name) = 'carolina panthers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' WHERE LOWER(name) = 'chicago bears';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' WHERE LOWER(name) = 'cincinnati bengals';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' WHERE LOWER(name) = 'cleveland browns';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' WHERE LOWER(name) = 'dallas cowboys';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' WHERE LOWER(name) = 'denver broncos';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' WHERE LOWER(name) = 'detroit lions';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' WHERE LOWER(name) = 'green bay packers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' WHERE LOWER(name) = 'houston texans';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' WHERE LOWER(name) = 'indianapolis colts';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' WHERE LOWER(name) = 'jacksonville jaguars';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' WHERE LOWER(name) = 'kansas city chiefs';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' WHERE LOWER(name) = 'las vegas raiders';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' WHERE LOWER(name) = 'los angeles chargers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' WHERE LOWER(name) = 'los angeles rams';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' WHERE LOWER(name) = 'miami dolphins';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' WHERE LOWER(name) = 'minnesota vikings';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' WHERE LOWER(name) = 'new england patriots';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' WHERE LOWER(name) = 'new orleans saints';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' WHERE LOWER(name) = 'new york giants';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' WHERE LOWER(name) = 'new york jets';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' WHERE LOWER(name) = 'philadelphia eagles';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' WHERE LOWER(name) = 'pittsburgh steelers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' WHERE LOWER(name) = 'san francisco 49ers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' WHERE LOWER(name) = 'seattle seahawks';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' WHERE LOWER(name) = 'tampa bay buccaneers';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' WHERE LOWER(name) = 'tennessee titans';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' WHERE LOWER(name) = 'washington commanders';
