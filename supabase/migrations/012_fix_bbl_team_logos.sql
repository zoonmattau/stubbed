-- Fix BBL team logo URLs with correct ESPN team IDs
-- The previous migration used incorrect team IDs

-- BBL Cricket Teams - Correct ESPN IDs
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
