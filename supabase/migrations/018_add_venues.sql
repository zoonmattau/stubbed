-- Add comprehensive venue list
-- Migration 018
-- Uses ON CONFLICT to skip venues that already exist by name

INSERT INTO venues (name, city, state, country, capacity, latitude, longitude) VALUES
-- ============================================
-- AUSTRALIA - AFL
-- ============================================
('Engie Stadium', 'Sydney', 'NSW', 'AU', 24000, -33.8474, 151.0676),
('People First Stadium', 'Gold Coast', 'QLD', 'AU', 25000, -28.0027, 153.4300),
('Mars Stadium', 'Ballarat', 'VIC', 'AU', 11000, -37.5500, 143.8400),
('Norwood Oval', 'Adelaide', 'SA', 'AU', 20000, -34.9200, 138.6300),
('Manuka Oval', 'Canberra', 'ACT', 'AU', 13550, -35.3180, 149.1350),
('University of Tasmania Stadium', 'Launceston', 'TAS', 'AU', 20200, -41.4250, 147.1380),
('TIO Stadium', 'Darwin', 'NT', 'AU', 12500, -12.4290, 130.8610),
('Cazalys Stadium', 'Cairns', 'QLD', 'AU', 13500, -16.9350, 145.7530),
('Ikon Park', 'Melbourne', 'VIC', 'AU', 24500, -37.7840, 144.9540),
('Whitten Oval', 'Melbourne', 'VIC', 'AU', 25000, -37.7990, 144.8870),
('Windy Hill', 'Melbourne', 'VIC', 'AU', 18000, -37.7510, 144.9160),

-- ============================================
-- AUSTRALIA - NRL / Rugby League
-- ============================================
('Allianz Stadium', 'Sydney', 'NSW', 'AU', 45000, -33.8890, 151.2240),
('CommBank Stadium', 'Sydney', 'NSW', 'AU', 30000, -33.8070, 151.0630),
('4 Pines Park', 'Sydney', 'NSW', 'AU', 23000, -33.7960, 151.2530),
('McDonald Jones Stadium', 'Newcastle', 'NSW', 'AU', 33000, -32.9230, 151.7680),
('WIN Stadium', 'Wollongong', 'NSW', 'AU', 23000, -34.4350, 150.8940),
('BlueBet Stadium', 'Penrith', 'NSW', 'AU', 22000, -33.7510, 150.6850),
('Campbelltown Stadium', 'Sydney', 'NSW', 'AU', 21000, -34.0680, 150.8160),
('PointsBet Stadium', 'Sydney', 'NSW', 'AU', 22000, -34.0170, 151.1010),
('Leichhardt Oval', 'Sydney', 'NSW', 'AU', 20000, -33.8730, 151.1560),
('Queensland Country Bank Stadium', 'Townsville', 'QLD', 'AU', 25000, -19.2590, 146.7870),
('Cbus Super Stadium', 'Gold Coast', 'QLD', 'AU', 27400, -28.0670, 153.4180),
('Sunshine Coast Stadium', 'Sunshine Coast', 'QLD', 'AU', 12000, -26.6880, 153.0620),
('GIO Stadium', 'Canberra', 'ACT', 'AU', 25011, -35.2510, 149.1030),

-- ============================================
-- AUSTRALIA - Cricket
-- ============================================
('WACA Ground', 'Perth', 'WA', 'AU', 24500, -31.9600, 115.8790),
('Bellerive Oval', 'Hobart', 'TAS', 'AU', 20000, -42.8736, 147.3428),
('Junction Oval', 'Melbourne', 'VIC', 'AU', 6000, -37.8560, 144.9870),
('Drummoyne Oval', 'Sydney', 'NSW', 'AU', 5000, -33.8520, 151.1500),
('Allan Border Field', 'Brisbane', 'QLD', 'AU', 4000, -27.4300, 153.0000),
('Karen Rolton Oval', 'Adelaide', 'SA', 'AU', 5000, -34.9400, 138.5800),

-- ============================================
-- AUSTRALIA - Tennis
-- ============================================
('Margaret Court Arena', 'Melbourne', 'VIC', 'AU', 7500, -37.8220, 144.9790),
('John Cain Arena', 'Melbourne', 'VIC', 'AU', 10000, -37.8200, 144.9770),
('Ken Rosewall Arena', 'Sydney', 'NSW', 'AU', 10500, -33.8640, 151.0700),
('RAC Arena', 'Perth', 'WA', 'AU', 15500, -31.9440, 115.8530),
('Pat Rafter Arena', 'Brisbane', 'QLD', 'AU', 5500, -27.4510, 153.0370),
('Memorial Drive', 'Adelaide', 'SA', 'AU', 12000, -34.9200, 138.5900),

-- ============================================
-- AUSTRALIA - Soccer / A-League
-- ============================================
('Netstrata Jubilee Stadium', 'Sydney', 'NSW', 'AU', 22000, -33.9540, 151.1300),
('Central Coast Stadium', 'Gosford', 'NSW', 'AU', 20059, -33.4380, 151.3450),
('Coopers Stadium', 'Adelaide', 'SA', 'AU', 16500, -34.8820, 138.5880),
('HBF Park', 'Perth', 'WA', 'AU', 20500, -31.9440, 115.8580),
('AAMI Park', 'Melbourne', 'VIC', 'AU', 30050, -37.8253, 144.9836),
('Dolphin Stadium', 'Gold Coast', 'QLD', 'AU', 27400, -28.0670, 153.4180),
('Redcliffe Dolphins Stadium', 'Brisbane', 'QLD', 'AU', 12000, -27.2290, 153.0830),
('Tasmania Stadium', 'Launceston', 'TAS', 'AU', 20200, -41.4250, 147.1380),
('Macedon Railway Stadium', 'Macarthur', 'NSW', 'AU', 21000, -34.0680, 150.8160),

-- ============================================
-- AUSTRALIA - Horse Racing
-- ============================================
('Flemington Racecourse', 'Melbourne', 'VIC', 'AU', 120000, -37.7880, 144.9120),
('Royal Randwick Racecourse', 'Sydney', 'NSW', 'AU', 60000, -33.9030, 151.2380),
('Moonee Valley Racecourse', 'Melbourne', 'VIC', 'AU', 40000, -37.7660, 144.9320),
('Caulfield Racecourse', 'Melbourne', 'VIC', 'AU', 30000, -37.8770, 145.0280),
('Rosehill Gardens Racecourse', 'Sydney', 'NSW', 'AU', 40000, -33.8300, 151.0230),
('Eagle Farm Racecourse', 'Brisbane', 'QLD', 'AU', 30000, -27.4390, 153.0640),
('Morphettville Racecourse', 'Adelaide', 'SA', 'AU', 25000, -34.9700, 138.5400),
('Ascot Racecourse', 'Perth', 'WA', 'AU', 15000, -31.9250, 115.9340),
('Sandown Racecourse', 'Melbourne', 'VIC', 'AU', 15000, -37.9080, 145.1690),
('The Valley', 'Melbourne', 'VIC', 'AU', 40000, -37.7660, 144.9320),

-- ============================================
-- AUSTRALIA - Motorsport
-- ============================================
('Albert Park Circuit', 'Melbourne', 'VIC', 'AU', 80000, -37.8497, 144.9680),
('Mount Panorama Circuit', 'Bathurst', 'NSW', 'AU', 36000, -33.4450, 149.5570),
('Phillip Island Grand Prix Circuit', 'Phillip Island', 'VIC', 'AU', 50000, -38.5010, 145.2300),
('Sydney Motorsport Park', 'Sydney', 'NSW', 'AU', 36000, -33.8060, 150.8610),
('Surfers Paradise Street Circuit', 'Gold Coast', 'QLD', 'AU', 30000, -28.0000, 153.4310),
('Hidden Valley Raceway', 'Darwin', 'NT', 'AU', 12000, -12.4450, 130.9200),
('Sandown Raceway', 'Melbourne', 'VIC', 'AU', 15000, -37.9000, 145.1600),
('Symmons Plains Raceway', 'Launceston', 'TAS', 'AU', 10000, -41.4850, 147.1500),
('Wanneroo Raceway', 'Perth', 'WA', 'AU', 10000, -31.6900, 115.8100),
('The Bend Motorsport Park', 'Tailem Bend', 'SA', 'AU', 15000, -35.2700, 139.4400),

-- ============================================
-- AUSTRALIA - Other
-- ============================================
('Sydney Olympic Park Aquatic Centre', 'Sydney', 'NSW', 'AU', 10000, -33.8500, 151.0700),
('Melbourne Arena', 'Melbourne', 'VIC', 'AU', 10000, -37.8200, 144.9770),
('Qudos Bank Arena', 'Sydney', 'NSW', 'AU', 21000, -33.8470, 151.0650),
('Brisbane Entertainment Centre', 'Brisbane', 'QLD', 'AU', 13500, -27.3390, 153.0730),
('Adelaide Entertainment Centre', 'Adelaide', 'SA', 'AU', 11300, -34.8840, 138.5680),
('Newcastle Entertainment Centre', 'Newcastle', 'NSW', 'AU', 7200, -32.9130, 151.7340),
('Bendigo Stadium', 'Bendigo', 'VIC', 'AU', 3000, -36.7540, 144.2800),

-- ============================================
-- UNITED KINGDOM - Premier League
-- ============================================
('Wembley Stadium', 'London', NULL, 'GB', 90000, 51.5560, -0.2795),
('Old Trafford', 'Manchester', NULL, 'GB', 74140, 53.4631, -2.2913),
('Anfield', 'Liverpool', NULL, 'GB', 61276, 53.4308, -2.9609),
('Emirates Stadium', 'London', NULL, 'GB', 60704, 51.5549, -0.1084),
('Stamford Bridge', 'London', NULL, 'GB', 40341, 51.4816, -0.1909),
('Tottenham Hotspur Stadium', 'London', NULL, 'GB', 62850, 51.6042, -0.0662),
('Etihad Stadium', 'Manchester', NULL, 'GB', 53400, 53.4831, -2.2004),
('St James'' Park', 'Newcastle', NULL, 'GB', 52305, 54.9756, -1.6217),
('London Stadium', 'London', NULL, 'GB', 62500, 51.5387, -0.0166),
('Villa Park', 'Birmingham', NULL, 'GB', 42785, 52.5091, -1.8848),
('Goodison Park', 'Liverpool', NULL, 'GB', 39414, 53.4388, -2.9664),
('Elland Road', 'Leeds', NULL, 'GB', 37890, 53.7778, -1.5722),
('Molineux Stadium', 'Wolverhampton', NULL, 'GB', 31750, 52.5903, -2.1306),
('Selhurst Park', 'London', NULL, 'GB', 25486, 51.3983, -0.0855),
('The Amex Stadium', 'Brighton', NULL, 'GB', 31876, 50.8616, -0.0837),
('Vitality Stadium', 'Bournemouth', NULL, 'GB', 11364, 50.7352, -1.8384),
('Bramall Lane', 'Sheffield', NULL, 'GB', 32050, 53.3703, -1.4709),
('City Ground', 'Nottingham', NULL, 'GB', 30445, 52.9399, -1.1325),
('Craven Cottage', 'London', NULL, 'GB', 25700, 51.4749, -0.2217),
('Portman Road', 'Ipswich', NULL, 'GB', 30311, 52.0545, 1.1447),
('Carrow Road', 'Norwich', NULL, 'GB', 27244, 52.6221, 1.3093),
('King Power Stadium', 'Leicester', NULL, 'GB', 32312, 52.6203, -1.1422),
('St Mary''s Stadium', 'Southampton', NULL, 'GB', 32384, 50.9058, -1.3910),
('Vicarage Road', 'Watford', NULL, 'GB', 22220, 51.6500, -0.4014),
('Turf Moor', 'Burnley', NULL, 'GB', 21944, 53.7890, -2.2303),
('Kenilworth Road', 'Luton', NULL, 'GB', 10356, 51.8842, -0.4317),

-- ============================================
-- UNITED KINGDOM - Rugby / Cricket / Other
-- ============================================
('Twickenham Stadium', 'London', NULL, 'GB', 82000, 51.4559, -0.3415),
('Murrayfield', 'Edinburgh', NULL, 'GB', 67144, 55.9422, -3.2410),
('Principality Stadium', 'Cardiff', NULL, 'GB', 74500, 51.4782, -3.1828),
('The O2 Arena', 'London', NULL, 'GB', 20000, 51.5030, 0.0032),
('Lord''s Cricket Ground', 'London', NULL, 'GB', 30000, 51.5294, -0.1728),
('The Oval', 'London', NULL, 'GB', 25500, 51.4837, -0.1147),
('Edgbaston Cricket Ground', 'Birmingham', NULL, 'GB', 25000, 52.4557, -1.9026),
('Headingley', 'Leeds', NULL, 'GB', 18350, 53.8178, -1.5822),
('Old Trafford Cricket Ground', 'Manchester', NULL, 'GB', 26000, 53.4569, -2.2871),
('Sophia Gardens', 'Cardiff', NULL, 'GB', 15643, 51.4869, -3.1819),
('Trent Bridge', 'Nottingham', NULL, 'GB', 17500, 52.9370, -1.1322),
('The Rose Bowl', 'Southampton', NULL, 'GB', 25000, 50.9243, -1.3228),
('Wimbledon Centre Court', 'London', NULL, 'GB', 14979, 51.4341, -0.2143),
('Celtic Park', 'Glasgow', NULL, 'GB', 60411, 55.8497, -4.2055),
('Ibrox Stadium', 'Glasgow', NULL, 'GB', 50817, 55.8532, -4.3092),
('Hampden Park', 'Glasgow', NULL, 'GB', 51866, 55.8258, -4.2519),
('Aviva Stadium', 'Dublin', NULL, 'IE', 51700, 53.3352, -6.2286),
('Croke Park', 'Dublin', NULL, 'IE', 82300, 53.3608, -6.2514),
('Thomond Park', 'Limerick', NULL, 'IE', 25600, 52.6688, -8.6262),

-- ============================================
-- SPAIN
-- ============================================
('Camp Nou', 'Barcelona', NULL, 'ES', 99354, 41.3809, 2.1228),
('Santiago Bernabeu', 'Madrid', NULL, 'ES', 81044, 40.4531, -3.6883),
('Wanda Metropolitano', 'Madrid', NULL, 'ES', 68456, 40.4362, -3.5995),
('Ramon Sanchez-Pizjuan', 'Seville', NULL, 'ES', 43883, 37.3840, -5.9705),
('Estadio Benito Villamarin', 'Seville', NULL, 'ES', 60720, 37.3564, -5.9816),
('San Mames', 'Bilbao', NULL, 'ES', 53289, 43.2641, -2.9495),
('Mestalla', 'Valencia', NULL, 'ES', 49500, 39.4747, -0.3584),
('RCDE Stadium', 'Barcelona', NULL, 'ES', 40000, 41.3480, 2.0756),
('Estadio de la Ceramica', 'Villarreal', NULL, 'ES', 23500, 39.9443, -0.1036),
('Balaidos', 'Vigo', NULL, 'ES', 29000, 42.2117, -8.7393),
('Anoeta Stadium', 'San Sebastian', NULL, 'ES', 39500, 43.3013, -1.9736),
('Circuit de Barcelona-Catalunya', 'Barcelona', NULL, 'ES', 140700, 41.5700, 2.2611),

-- ============================================
-- GERMANY
-- ============================================
('Allianz Arena', 'Munich', NULL, 'DE', 75000, 48.2188, 11.6247),
('Signal Iduna Park', 'Dortmund', NULL, 'DE', 81365, 51.4926, 7.4518),
('Olympiastadion', 'Berlin', NULL, 'DE', 74475, 52.5147, 13.2395),
('Volksparkstadion', 'Hamburg', NULL, 'DE', 57000, 53.5873, 9.8985),
('Mercedes-Benz Arena', 'Stuttgart', NULL, 'DE', 60449, 48.7924, 9.2320),
('RheinEnergieStadion', 'Cologne', NULL, 'DE', 49827, 50.9335, 6.8753),
('Veltins-Arena', 'Gelsenkirchen', NULL, 'DE', 62271, 51.5539, 7.0678),
('Commerzbank-Arena', 'Frankfurt', NULL, 'DE', 51500, 50.0685, 8.6455),
('Red Bull Arena', 'Leipzig', NULL, 'DE', 47069, 51.3459, 12.3486),
('Borussia-Park', 'Monchengladbach', NULL, 'DE', 54057, 51.1747, 6.3855),
('BayArena', 'Leverkusen', NULL, 'DE', 30210, 51.0383, 6.9883),
('Nurburgring', 'Nurburg', NULL, 'DE', 150000, 50.3356, 6.9475),
('Hockenheimring', 'Hockenheim', NULL, 'DE', 120000, 49.3278, 8.5656),

-- ============================================
-- ITALY
-- ============================================
('San Siro', 'Milan', NULL, 'IT', 75923, 45.4781, 9.1240),
('Stadio Olimpico', 'Rome', NULL, 'IT', 70634, 41.9340, 12.4547),
('Allianz Stadium', 'Turin', NULL, 'IT', 41507, 45.1096, 7.6413),
('Stadio Diego Armando Maradona', 'Naples', NULL, 'IT', 54726, 40.8280, 14.1930),
('Stadio Artemio Franchi', 'Florence', NULL, 'IT', 43147, 43.7808, 11.2822),
('Gewiss Stadium', 'Bergamo', NULL, 'IT', 21300, 45.7089, 9.6808),
('Stadio Renato Dall''Ara', 'Bologna', NULL, 'IT', 38279, 44.4923, 11.3098),
('Stadio Luigi Ferraris', 'Genoa', NULL, 'IT', 36600, 44.4163, 8.9525),
('Stadio Friuli', 'Udine', NULL, 'IT', 25144, 46.0810, 13.2000),
('Autodromo di Monza', 'Monza', NULL, 'IT', 113000, 45.6156, 9.2811),
('Autodromo Enzo e Dino Ferrari', 'Imola', NULL, 'IT', 80000, 44.3440, 11.7133),
('Mugello Circuit', 'Mugello', NULL, 'IT', 60000, 43.9975, 11.3719),
('Misano World Circuit', 'Misano Adriatico', NULL, 'IT', 35000, 43.9631, 12.6831),

-- ============================================
-- FRANCE
-- ============================================
('Stade de France', 'Paris', NULL, 'FR', 81338, 48.9244, 2.3601),
('Parc des Princes', 'Paris', NULL, 'FR', 47929, 48.8414, 2.2530),
('Groupama Stadium', 'Lyon', NULL, 'FR', 59186, 45.7654, 4.9822),
('Stade Velodrome', 'Marseille', NULL, 'FR', 67394, 43.2699, 5.3959),
('Allianz Riviera', 'Nice', NULL, 'FR', 35624, 43.7051, 7.1926),
('Roazhon Park', 'Rennes', NULL, 'FR', 29778, 48.1075, -1.7128),
('Stade Pierre-Mauroy', 'Lille', NULL, 'FR', 50157, 50.6121, 3.1303),
('Matmut Atlantique', 'Bordeaux', NULL, 'FR', 42115, 44.8976, -0.5615),
('Stade de la Beaujoire', 'Nantes', NULL, 'FR', 37473, 47.2558, -1.5247),
('Stade Geoffroy-Guichard', 'Saint-Etienne', NULL, 'FR', 41965, 45.4608, 4.3900),
('Circuit Paul Ricard', 'Le Castellet', NULL, 'FR', 90000, 43.2506, 5.7917),
('Stade Roland Garros', 'Paris', NULL, 'FR', 15225, 48.8469, 2.2528),
('AccorHotels Arena', 'Paris', NULL, 'FR', 20300, 48.8388, 2.3786),

-- ============================================
-- NETHERLANDS
-- ============================================
('Johan Cruyff Arena', 'Amsterdam', NULL, 'NL', 55500, 52.3142, 4.9419),
('De Kuip', 'Rotterdam', NULL, 'NL', 51117, 51.8939, 4.5231),
('Philips Stadion', 'Eindhoven', NULL, 'NL', 35000, 51.4418, 5.4674),
('Galgenwaard', 'Utrecht', NULL, 'NL', 23750, 52.0787, 5.1463),
('Circuit Zandvoort', 'Zandvoort', NULL, 'NL', 105000, 52.3888, 4.5409),

-- ============================================
-- PORTUGAL
-- ============================================
('Estadio da Luz', 'Lisbon', NULL, 'PT', 64642, 38.7527, -9.1847),
('Estadio Jose Alvalade', 'Lisbon', NULL, 'PT', 50095, 38.7612, -9.1609),
('Estadio do Dragao', 'Porto', NULL, 'PT', 50033, 41.1618, -8.5836),
('Algarve International Circuit', 'Portimao', NULL, 'PT', 100000, 37.2327, -8.6267),

-- ============================================
-- BELGIUM / AUSTRIA / SWITZERLAND
-- ============================================
('Jan Breydel Stadium', 'Bruges', NULL, 'BE', 29042, 51.1934, 3.1803),
('Constant Vanden Stock Stadium', 'Brussels', NULL, 'BE', 28063, 50.8343, 4.2980),
('Circuit de Spa-Francorchamps', 'Spa', NULL, 'BE', 70000, 50.4372, 5.9714),
('Red Bull Ring', 'Spielberg', NULL, 'AT', 71000, 47.2197, 14.7647),
('Ernst-Happel-Stadion', 'Vienna', NULL, 'AT', 50865, 48.2086, 16.4191),
('St. Jakob-Park', 'Basel', NULL, 'CH', 38512, 47.5413, 7.6205),

-- ============================================
-- TURKEY / EASTERN EUROPE / SCANDINAVIA
-- ============================================
('Ataturk Olympic Stadium', 'Istanbul', NULL, 'TR', 76092, 41.0750, 28.7653),
('Sukru Saracoglu Stadium', 'Istanbul', NULL, 'TR', 50530, 40.9878, 29.0369),
('Turk Telekom Stadium', 'Istanbul', NULL, 'TR', 52695, 41.1034, 28.9943),
('Vodafone Park', 'Istanbul', NULL, 'TR', 41903, 41.0426, 29.0070),
('PGE Narodowy', 'Warsaw', NULL, 'PL', 58580, 52.2396, 21.0453),
('Puskas Arena', 'Budapest', NULL, 'HU', 67215, 47.5031, 19.0999),
('Parken Stadium', 'Copenhagen', NULL, 'DK', 38065, 55.7027, 12.5724),
('Friends Arena', 'Stockholm', NULL, 'SE', 50000, 59.3728, 18.0006),
('Ullevaal Stadion', 'Oslo', NULL, 'NO', 28000, 59.9489, 10.7337),
('Helsinki Olympic Stadium', 'Helsinki', NULL, 'FI', 36200, 60.1870, 24.9271),

-- ============================================
-- UNITED STATES - NFL
-- ============================================
('Madison Square Garden', 'New York', 'NY', 'US', 20789, 40.7505, -73.9934),
('SoFi Stadium', 'Los Angeles', 'CA', 'US', 70240, 33.9535, -118.3390),
('AT&T Stadium', 'Dallas', 'TX', 'US', 80000, 32.7473, -97.0945),
('MetLife Stadium', 'New York', 'NJ', 'US', 82500, 40.8128, -74.0742),
('Lambeau Field', 'Green Bay', 'WI', 'US', 81441, 44.5013, -88.0622),
('Hard Rock Stadium', 'Miami', 'FL', 'US', 64767, 25.9580, -80.2389),
('Arrowhead Stadium', 'Kansas City', 'MO', 'US', 76416, 39.0489, -94.4839),
('Caesars Superdome', 'New Orleans', 'LA', 'US', 73208, 29.9511, -90.0812),
('Lumen Field', 'Seattle', 'WA', 'US', 68740, 47.5952, -122.3316),
('Lincoln Financial Field', 'Philadelphia', 'PA', 'US', 69176, 39.9008, -75.1674),
('Gillette Stadium', 'Foxborough', 'MA', 'US', 65878, 42.0909, -71.2643),
('Soldier Field', 'Chicago', 'IL', 'US', 61500, 41.8623, -87.6167),
('M&T Bank Stadium', 'Baltimore', 'MD', 'US', 71008, 39.2780, -76.6227),
('Empower Field at Mile High', 'Denver', 'CO', 'US', 76125, 39.7439, -105.0201),
('NRG Stadium', 'Houston', 'TX', 'US', 72220, 29.6847, -95.4107),
('Highmark Stadium', 'Buffalo', 'NY', 'US', 71608, 42.7738, -78.7870),
('Lucas Oil Stadium', 'Indianapolis', 'IN', 'US', 67000, 39.7601, -86.1639),
('U.S. Bank Stadium', 'Minneapolis', 'MN', 'US', 66655, 44.9736, -93.2575),
('Mercedes-Benz Stadium', 'Atlanta', 'GA', 'US', 71000, 33.7554, -84.4010),
('Allegiant Stadium', 'Las Vegas', 'NV', 'US', 65000, 36.0908, -115.1833),
('State Farm Stadium', 'Phoenix', 'AZ', 'US', 63400, 33.5276, -112.2626),

-- ============================================
-- UNITED STATES - NBA / NHL
-- ============================================
('Crypto.com Arena', 'Los Angeles', 'CA', 'US', 20000, 34.0430, -118.2673),
('Chase Center', 'San Francisco', 'CA', 'US', 18064, 37.7680, -122.3877),
('United Center', 'Chicago', 'IL', 'US', 20917, 41.8807, -87.6742),
('TD Garden', 'Boston', 'MA', 'US', 19580, 42.3662, -71.0621),
('Barclays Center', 'Brooklyn', 'NY', 'US', 17732, 40.6826, -73.9754),
('American Airlines Center', 'Dallas', 'TX', 'US', 19200, 32.7905, -96.8103),
('Ball Arena', 'Denver', 'CO', 'US', 19520, 39.7487, -105.0077),
('Little Caesars Arena', 'Detroit', 'MI', 'US', 20332, 42.3411, -83.0553),
('Toyota Center', 'Houston', 'TX', 'US', 18055, 29.7508, -95.3621),
('Kaseya Center', 'Miami', 'FL', 'US', 19600, 25.7814, -80.1870),
('Fiserv Forum', 'Milwaukee', 'WI', 'US', 17341, 43.0451, -87.9174),
('Scotiabank Arena', 'Toronto', NULL, 'CA', 19800, 43.6435, -79.3791),
('Bell Centre', 'Montreal', NULL, 'CA', 21302, 45.4961, -73.5693),
('Rogers Arena', 'Vancouver', NULL, 'CA', 18910, 49.2778, -123.1089),

-- ============================================
-- UNITED STATES - MLB
-- ============================================
('Fenway Park', 'Boston', 'MA', 'US', 37755, 42.3467, -71.0972),
('Yankee Stadium', 'New York', 'NY', 'US', 54251, 40.8296, -73.9262),
('Dodger Stadium', 'Los Angeles', 'CA', 'US', 56000, 34.0739, -118.2400),
('Wrigley Field', 'Chicago', 'IL', 'US', 41649, 41.9484, -87.6553),
('Oracle Park', 'San Francisco', 'CA', 'US', 41915, 37.7786, -122.3893),
('Citi Field', 'New York', 'NY', 'US', 41922, 40.7571, -73.8458),
('Truist Park', 'Atlanta', 'GA', 'US', 41084, 33.8908, -84.4678),
('T-Mobile Park', 'Seattle', 'WA', 'US', 47929, 47.5914, -122.3325),
('Minute Maid Park', 'Houston', 'TX', 'US', 41168, 29.7572, -95.3555),
('Petco Park', 'San Diego', 'CA', 'US', 42445, 32.7076, -117.1570),

-- ============================================
-- UNITED STATES - Tennis / Other
-- ============================================
('Arthur Ashe Stadium', 'New York', 'NY', 'US', 23771, 40.7500, -73.8456),
('Rose Bowl', 'Los Angeles', 'CA', 'US', 88565, 34.1613, -118.1676),
('Circuit of the Americas', 'Austin', 'TX', 'US', 120000, 30.1328, -97.6411),
('Indianapolis Motor Speedway', 'Indianapolis', 'IN', 'US', 257325, 39.7955, -86.2347),
('Daytona International Speedway', 'Daytona Beach', 'FL', 'US', 101500, 29.1856, -81.0698),
('Augusta National Golf Club', 'Augusta', 'GA', 'US', 40000, 33.5038, -82.0216),
('T-Mobile Arena', 'Las Vegas', 'NV', 'US', 20000, 36.1029, -115.1785),

-- ============================================
-- SOUTH AMERICA
-- ============================================
('Maracana', 'Rio de Janeiro', NULL, 'BR', 78838, -22.9121, -43.2302),
('Estadio Monumental', 'Buenos Aires', NULL, 'AR', 72054, -34.5453, -58.4498),
('La Bombonera', 'Buenos Aires', NULL, 'AR', 54000, -34.6357, -58.3649),
('Estadio Nacional', 'Santiago', NULL, 'CL', 48665, -33.4650, -70.6100),
('Estadio Centenario', 'Montevideo', NULL, 'UY', 60235, -34.8943, -56.1527),
('Autodromo Jose Carlos Pace', 'Sao Paulo', NULL, 'BR', 60000, -23.7014, -46.6975),
('Autodromo Hermanos Rodriguez', 'Mexico City', NULL, 'MX', 120000, 19.4042, -99.0907),
('Estadio Azteca', 'Mexico City', NULL, 'MX', 87523, 19.3029, -99.1505),

-- ============================================
-- ASIA / MIDDLE EAST
-- ============================================
('Tokyo Dome', 'Tokyo', NULL, 'JP', 55000, 35.7056, 139.7519),
('Suzuka International Racing Course', 'Suzuka', NULL, 'JP', 155000, 34.8431, 136.5339),
('Nissan Stadium', 'Yokohama', NULL, 'JP', 72327, 35.5103, 139.6064),
('National Stadium', 'Tokyo', NULL, 'JP', 68000, 35.6778, 139.7136),
('Saitama Super Arena', 'Saitama', NULL, 'JP', 37000, 35.8947, 139.6310),
('Singapore National Stadium', 'Singapore', NULL, 'SG', 55000, 1.3044, 103.8745),
('Marina Bay Street Circuit', 'Singapore', NULL, 'SG', 68000, 1.2914, 103.8640),
('Rajamangala Stadium', 'Bangkok', NULL, 'TH', 49722, 13.7545, 100.6211),
('Seoul World Cup Stadium', 'Seoul', NULL, 'KR', 66704, 37.5683, 126.8972),
('Korea International Circuit', 'Yeongam', NULL, 'KR', 130000, 34.7339, 126.4171),
('Shanghai International Circuit', 'Shanghai', NULL, 'CN', 200000, 31.3389, 121.2197),
('Bird''s Nest Stadium', 'Beijing', NULL, 'CN', 80000, 39.9929, 116.3966),
('Sepang International Circuit', 'Kuala Lumpur', NULL, 'MY', 130000, 2.7608, 101.7383),
('Bukit Jalil National Stadium', 'Kuala Lumpur', NULL, 'MY', 87411, 3.0545, 101.6911),
('Eden Gardens', 'Kolkata', NULL, 'IN', 66000, 22.5646, 88.3434),
('Wankhede Stadium', 'Mumbai', NULL, 'IN', 33108, 18.9389, 72.8258),
('M. Chinnaswamy Stadium', 'Bangalore', NULL, 'IN', 40000, 12.9788, 77.5996),
('Narendra Modi Stadium', 'Ahmedabad', NULL, 'IN', 132000, 23.0916, 72.5972),
('Buddh International Circuit', 'Greater Noida', NULL, 'IN', 120000, 28.3487, 77.5331),
('Yas Marina Circuit', 'Abu Dhabi', NULL, 'AE', 60000, 24.4672, 54.6031),
('Lusail International Circuit', 'Lusail', NULL, 'QA', 8000, 25.4900, 51.4542),
('Jeddah Corniche Circuit', 'Jeddah', NULL, 'SA', 30000, 21.6319, 39.1044),
('Bahrain International Circuit', 'Sakhir', NULL, 'BH', 70000, 26.0325, 50.5106),
('Khalifa International Stadium', 'Doha', NULL, 'QA', 45416, 25.2631, 51.4481),

-- ============================================
-- AFRICA / OCEANIA
-- ============================================
('FNB Stadium', 'Johannesburg', NULL, 'ZA', 94736, -26.2358, 27.9825),
('Cape Town Stadium', 'Cape Town', NULL, 'ZA', 55000, -33.9036, 18.4114),
('Newlands Cricket Ground', 'Cape Town', NULL, 'ZA', 25000, -33.9281, 18.4753),
('Eden Park', 'Auckland', NULL, 'NZ', 50000, -36.8747, 174.7444),
('Sky Stadium', 'Wellington', NULL, 'NZ', 34500, -41.2731, 174.7853),
('Forsyth Barr Stadium', 'Dunedin', NULL, 'NZ', 30748, -45.8836, 170.5094),

-- ============================================
-- MOTORSPORT - GLOBAL
-- ============================================
('Circuit de Monaco', 'Monte Carlo', NULL, 'MC', 37000, 43.7347, 7.4206),
('Silverstone Circuit', 'Silverstone', NULL, 'GB', 150000, 52.0786, -1.0169),
('Hungaroring', 'Budapest', NULL, 'HU', 70000, 47.5789, 19.2486),
('Baku City Circuit', 'Baku', NULL, 'AZ', 30000, 40.3725, 49.8533),
('Miami International Autodrome', 'Miami', 'FL', 'US', 80000, 25.9581, -80.2389),
('Melbourne Park', 'Melbourne', 'VIC', 'AU', 15000, -37.8210, 144.9790)
ON CONFLICT DO NOTHING;
