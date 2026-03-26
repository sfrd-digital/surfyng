-- Seed completo: 121 praias do Brasil
-- Gerado em: 2026-03-25T21:47:54.850Z
-- Fonte: guia.waves.com.br | Geocodificação: Nominatim/OpenStreetMap
-- Executar com: psql $DATABASE_URL -f seeds/beaches_seed.sql

-- Limpa praias existentes para evitar duplicatas (CASCADE remove conditions_cache, favorites, etc.)
TRUNCATE beaches CASCADE;

INSERT INTO beaches (
  name, city, state, country,
  lat, lng,
  swell_directions, wind_directions,
  min_size_feet, max_size_feet,
  difficulty, consistency, crowd,
  best_season,
  water_temp_summer_c, water_temp_winter_c
) VALUES
(
  'Cal', 'Torres', 'RS', 'BR',
  -29.3469468, -49.7317232,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 9,
  'medium', 'medium', 'intense',
  'Outono – Primavera',
  22, 17
),
(
  'Molhes', 'Torres', 'RS', 'BR',
  -29.3277237, -49.715481,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 9,
  'medium', 'medium', 'intense',
  'Outono – Primavera',
  22, 17
),
(
  'Guarita', 'Torres', 'RS', 'BR',
  -29.3577851, -49.7345103,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 9,
  'medium', 'medium', 'medium',
  'Outono – Primavera',
  22, 17
),
(
  'Prainha (Torres)', 'Torres', 'RS', 'BR',
  -29.3408835, -49.7237148,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 6,
  'low', 'medium', 'medium',
  'Outono – Primavera',
  22, 17
),
(
  'Mampituba', 'Torres', 'RS', 'BR',
  -29.2128226, -49.9344527,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 7,
  'low', 'low', 'low',
  'Outono – Primavera',
  22, 17
),
(
  'Plataforma', 'Cidreira', 'RS', 'BR',
  -30.1469576, -50.1945727,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 7,
  'low', 'high', 'intense',
  'Outono – Primavera',
  22, 17
),
(
  'Tramandaí', 'Tramandaí', 'RS', 'BR',
  -30.0023037, -50.1566561,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 6,
  'low', 'high', 'intense',
  'Outono – Primavera',
  22, 17
),
(
  'Capão da Canoa', 'Capão da Canoa', 'RS', 'BR',
  -29.7377041, -50.0201865,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 6,
  'low', 'high', 'intense',
  'Outono – Primavera',
  22, 17
),
(
  'Xangri-lá', 'Xangri-lá', 'RS', 'BR',
  -29.803077, -50.070482,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 6,
  'low', 'high', 'medium',
  'Outono – Primavera',
  22, 17
),
(
  'Enseada', 'São Francisco do Sul', 'SC', 'BR',
  -26.2270218, -48.5061023,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 5,
  'low', 'low', 'medium',
  'Ano todo',
  23, 17
),
(
  'Itapoá', 'Itapoá', 'SC', 'BR',
  -26.1116267, -48.6056373,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 5,
  'low', 'low', 'low',
  'Outono – Inverno',
  23, 17
),
(
  'Costão', 'Barra Velha', 'SC', 'BR',
  -26.6812683, -48.6872627,
  '{"Leste","NE"}', '{"Oeste"}',
  1, 5,
  'low', 'low', 'medium',
  'Outono – Inverno',
  23, 17
),
(
  'Península', 'Barra Velha', 'SC', 'BR',
  -26.6084335, -48.6756011,
  '{"Leste","NE"}', '{"Oeste"}',
  1, 4,
  'low', 'low', 'medium',
  'Outono – Inverno',
  23, 17
),
(
  'Praia do Sol', 'Barra Velha', 'SC', 'BR',
  -26.6771945, -48.6885223,
  '{"Leste","NE"}', '{"Oeste"}',
  1, 4,
  'low', 'low', 'low',
  'Outono – Inverno',
  23, 17
),
(
  'Penha', 'Penha', 'SC', 'BR',
  -27.8111209, -50.2748287,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 5,
  'low', 'low', 'medium',
  'Outono – Inverno',
  23, 17
),
(
  'Praia Brava (Itajaí)', 'Itajaí', 'SC', 'BR',
  -26.9488841, -48.6371749,
  '{"SE","NE"}', '{"Oeste","Sul"}',
  1, 5,
  'medium', 'medium', 'intense',
  'Outono – Inverno',
  22, 16
),
(
  'Prainha (BC)', 'Balneário Camboriú', 'SC', 'BR',
  -26.9924395, -48.6339782,
  '{"NE","Leste"}', '{"Oeste"}',
  1, 4,
  'low', 'high', 'intense',
  'Outono – Inverno',
  23, 17
),
(
  'Central (Itapema)', 'Itapema', 'SC', 'BR',
  -27.101538, -48.6134693,
  '{"NE"}', '{"Oeste"}',
  0, 2,
  'low', 'low', 'low',
  'Outono – Inverno',
  23, 17
),
(
  'Quatro Ilhas', 'Bombinhas', 'SC', 'BR',
  -27.1537099, -48.4836068,
  '{"NE"}', '{"Sul"}',
  1, 4,
  'medium', 'low', 'intense',
  'Outono – Inverno',
  22, 17
),
(
  'Centro (Navegantes)', 'Navegantes', 'SC', 'BR',
  -26.8927718, -48.6499302,
  '{"SE","NE","Sul"}', '{"Oeste","Sul"}',
  1, 4,
  'low', 'high', 'low',
  'Outono – Inverno',
  23, 17
),
(
  'Barra da Lagoa', 'Florianópolis', 'SC', 'BR',
  -27.574778, -48.4258352,
  '{"Leste","NE"}', '{"Sul"}',
  0, 4,
  'low', 'low', 'intense',
  'Outono – Inverno',
  22, 14
),
(
  'Praia Mole', 'Florianópolis', 'SC', 'BR',
  -27.6031328, -48.4333337,
  '{"SE","NE"}', '{"NE","Oeste"}',
  1, 11,
  'medium_low', 'high', 'intense',
  'Outono – Inverno',
  22, 14
),
(
  'Moçambique', 'Florianópolis', 'SC', 'BR',
  -27.4996098, -48.403993,
  '{"SE","NE"}', '{"NE","Oeste"}',
  1, 8,
  'medium_low', 'medium', 'low',
  'Outono – Inverno',
  22, 14
),
(
  'Ingleses', 'Florianópolis', 'SC', 'BR',
  -27.4399071, -48.401143,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 6,
  'low', 'high', 'intense',
  'Ano todo',
  24, 16
),
(
  'Santinho', 'Florianópolis', 'SC', 'BR',
  -27.4537409, -48.3791116,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 7,
  'low', 'medium', 'medium',
  'Outono – Inverno',
  22, 15
),
(
  'Praia Brava (Floripa)', 'Florianópolis', 'SC', 'BR',
  -27.3976128, -48.4158254,
  '{"NE"}', '{"NO","Oeste"}',
  1, 5,
  'medium_low', 'low', 'intense',
  'Ocasional',
  23, 16
),
(
  'Lagoa da Conceição', 'Florianópolis', 'SC', 'BR',
  -27.5697194, -48.4515809,
  '{"NE","Leste"}', '{"Sul"}',
  1, 5,
  'low', 'low', 'medium',
  'Outono – Inverno',
  22, 15
),
(
  'Campeche', 'Florianópolis', 'SC', 'BR',
  -27.7005477, -48.50014,
  '{"SE","Sul"}', '{"NE","Norte"}',
  1, 6,
  'low', 'medium', 'medium',
  'Outono – Inverno',
  22, 15
),
(
  'Camping da Barra', 'Florianópolis', 'SC', 'BR',
  -27.5594298, -48.4368111,
  '{"Leste","NE"}', '{"Sul"}',
  1, 5,
  'low', 'low', 'medium',
  'Outono – Inverno',
  22, 14
),
(
  'Guarda do Embaú', 'Palhoça', 'SC', 'BR',
  -27.9021238, -48.5923662,
  '{"SE","Sul","NE"}', '{"NE","Norte"}',
  1, 7,
  'low', 'medium', 'medium',
  'Outono – Inverno',
  22, 14
),
(
  'Centro (Garopaba)', 'Garopaba', 'SC', 'BR',
  -28.0267588, -48.6227907,
  '{"Leste","NE"}', '{"Sul"}',
  0, 4,
  'low', 'low', 'intense',
  'Outono – Inverno',
  21, 13
),
(
  'Rosa', 'Imbituba', 'SC', 'BR',
  -28.1724835, -48.6887271,
  '{"Sul","NE","Leste","SE"}', '{"Sul","NE"}',
  1, 5,
  'low', 'high', 'intense',
  'Inverno – Outono',
  21, 13
),
(
  'Vila (Zimba)', 'Imbituba', 'SC', 'BR',
  -28.241827, -48.6643444,
  '{"SE","NE","Sul"}', '{"Norte"}',
  1, 9,
  'medium', 'high', 'intense',
  'Outono – Primavera',
  21, 13
),
(
  'Ibiraquera', 'Imbituba', 'SC', 'BR',
  -28.1325451, -48.6627629,
  '{"SE","Sul","NE"}', '{"NE","Sul"}',
  1, 5,
  'low', 'high', 'medium',
  'Outono – Inverno',
  21, 13
),
(
  'Porto', 'Imbituba', 'SC', 'BR',
  -28.268339, -48.703751,
  '{"SE","Sul"}', '{"NE","Sul"}',
  1, 5,
  'low', 'medium', 'medium',
  'Outono – Inverno',
  21, 13
),
(
  'Luz', 'Imbituba', 'SC', 'BR',
  -28.1484529, -48.6467373,
  '{"SE","Sul"}', '{"NE","Sul"}',
  1, 5,
  'low', 'medium', 'medium',
  'Outono – Inverno',
  21, 13
),
(
  'Ribanceira', 'Imbituba', 'SC', 'BR',
  -28.2168701, -48.6849765,
  '{"SE","Sul"}', '{"NE","Sul"}',
  1, 5,
  'low', 'low', 'low',
  'Outono – Inverno',
  21, 13
),
(
  'Prainha (Farol)', 'Farol de Santa Marta', 'SC', 'BR',
  -28.6017303, -48.8170147,
  '{"SE","NE","Sul"}', '{"SW","Oeste","Sul"}',
  1, 5,
  'low', 'medium', 'medium',
  'Outono – Inverno',
  21, 13
),
(
  'Pico de Matinhos', 'Matinhos', 'PR', 'BR',
  -25.8182909, -48.5302538,
  '{"SE","NE","Sul","Leste"}', '{"Oeste"}',
  0, 9,
  'low', 'high', 'intense',
  'Outono – Primavera',
  24, 18
),
(
  'Brava (PR)', 'Matinhos', 'PR', 'BR',
  -25.8326933, -48.5394695,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 7,
  'medium', 'medium', 'medium',
  'Outono – Primavera',
  24, 18
),
(
  'Guaratuba', 'Guaratuba', 'PR', 'BR',
  -25.8809295, -48.6117546,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 6,
  'low', 'medium', 'medium',
  'Outono – Primavera',
  24, 18
),
(
  'Ilha do Mel', 'Ilha do Mel', 'PR', 'BR',
  -25.5345299, -48.3107471,
  '{"SE","Sul"}', '{"Oeste"}',
  1, 6,
  'medium_low', 'medium', 'medium',
  'Outono – Primavera',
  24, 18
),
(
  'Itamambuca', 'Ubatuba', 'SP', 'BR',
  -23.3990217, -45.0038536,
  '{"SE","NE","Sul"}', '{"NO","Oeste"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  25, 17
),
(
  'Vermelha do Norte', 'Ubatuba', 'SP', 'BR',
  -23.4176625, -45.0372232,
  '{"SE","NE"}', '{"NE","Oeste"}',
  1, 9,
  'medium_low', 'medium', 'intense',
  'Outono – Primavera',
  25, 17
),
(
  'Vermelha do Centro', 'Ubatuba', 'SP', 'BR',
  -23.4638676, -45.0495704,
  '{"SE"}', '{"Oeste"}',
  1, 7,
  'medium', 'low', 'low',
  'Outono – Primavera',
  25, 17
),
(
  'Sununga', 'Ubatuba', 'SP', 'BR',
  -23.5093576, -45.1323762,
  '{"SE","Sul"}', '{"NO","Oeste"}',
  1, 8,
  'medium', 'medium', 'medium',
  'Outono – Primavera',
  25, 17
),
(
  'Toninhas', 'Ubatuba', 'SP', 'BR',
  -23.4874929, -45.0761549,
  '{"SE","NE"}', '{"Oeste"}',
  1, 6,
  'low', 'medium', 'medium',
  'Outono – Primavera',
  25, 17
),
(
  'Maranduba', 'Ubatuba', 'SP', 'BR',
  -23.5411565, -45.2371881,
  '{"SE","Sul"}', '{"NO","Oeste"}',
  1, 7,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  25, 17
),
(
  'Dura', 'Ubatuba', 'SP', 'BR',
  -23.4968501, -45.1743049,
  '{"SE","Sul"}', '{"NO","Oeste"}',
  1, 8,
  'medium', 'medium', 'medium',
  'Outono – Primavera',
  25, 17
),
(
  'Praia Grande (Ubatuba)', 'Ubatuba', 'SP', 'BR',
  -23.4696693, -45.0671723,
  '{"SE"}', '{"Oeste"}',
  1, 9,
  'low', 'high', 'intense',
  'Outono – Primavera',
  25, 17
),
(
  'Maresias', 'São Sebastião', 'SP', 'BR',
  -23.7869608, -45.5616448,
  '{"Sul","SE"}', '{"Norte","Leste"}',
  1, 11,
  'medium', 'high', 'intense',
  'Primavera – Outono',
  26, 18
),
(
  'Boracéia', 'São Sebastião', 'SP', 'BR',
  -23.7538067, -45.8196291,
  '{"SE","Sul","NE"}', '{"Oeste"}',
  1, 8,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 18
),
(
  'Barra do Sahy', 'São Sebastião', 'SP', 'BR',
  -23.7704942, -45.6921092,
  '{"Sul","SE"}', '{"Norte"}',
  1, 7,
  'medium_low', 'medium', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Barra do Una', 'São Sebastião', 'SP', 'BR',
  -23.7641331, -45.761132,
  '{"Sul","SE"}', '{"Norte","Leste"}',
  1, 7,
  'medium_low', 'medium', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Camburi', 'São Sebastião', 'SP', 'BR',
  -23.7742146, -45.6437259,
  '{"Sul","SE"}', '{"Norte"}',
  1, 7,
  'medium_low', 'medium', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Juqueí', 'São Sebastião', 'SP', 'BR',
  -23.7692492, -45.7279899,
  '{"Sul","SE"}', '{"Norte"}',
  1, 6,
  'low', 'low', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Paúba', 'São Sebastião', 'SP', 'BR',
  -23.8013237, -45.5496875,
  '{"Sul","SE"}', '{"Norte"}',
  1, 6,
  'low', 'low', 'low',
  'Outono – Primavera',
  26, 18
),
(
  'Guaecá', 'São Sebastião', 'SP', 'BR',
  -23.8189336, -45.4601707,
  '{"Sul","SE"}', '{"Norte"}',
  1, 7,
  'medium_low', 'low', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Juréia', 'São Sebastião', 'SP', 'BR',
  -23.7666918, -45.8013195,
  '{"Sul","SE"}', '{"Norte"}',
  1, 7,
  'medium_low', 'low', 'low',
  'Outono – Primavera',
  26, 18
),
(
  'Boiçucanga', 'São Sebastião', 'SP', 'BR',
  -23.7812604, -45.6222934,
  '{"Sul","SE"}', '{"Norte"}',
  1, 7,
  'low', 'medium', 'intense',
  'Outono – Primavera',
  26, 18
),
(
  'Baleia', 'São Sebastião', 'SP', 'BR',
  -23.7727465, -45.6728099,
  '{"Sul","SE"}', '{"Norte"}',
  1, 7,
  'medium_low', 'low', 'intense',
  'Primavera – Outono',
  26, 18
),
(
  'Astúrias', 'Guarujá', 'SP', 'BR',
  -24.0075094, -46.2685811,
  '{"SE","NE"}', '{"Oeste"}',
  1, 9,
  'low', 'medium', 'intense',
  'Outono – Primavera',
  26, 18
),
(
  'Pernambuco (Guarujá)', 'Guarujá', 'SP', 'BR',
  -23.9662904, -46.1855491,
  '{"SE","NE"}', '{"NO","Oeste"}',
  1, 5,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 18
),
(
  'Praia Grande (SP)', 'Praia Grande', 'SP', 'BR',
  -23.4726803, -45.0668502,
  '{"SE","Sul"}', '{"NE","Leste"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  25, 18
),
(
  'Praia do Sonho', 'Itanhaém', 'SP', 'BR',
  -24.1945755, -46.7999765,
  '{"SE","NE","Sul"}', '{"NO","Oeste","Norte"}',
  1, 4,
  'low', 'high', 'intense',
  'Outono – Primavera',
  26, 18
),
(
  'Bertioga', 'Bertioga', 'SP', 'BR',
  -23.8364162, -46.1303778,
  '{"SE","Sul"}', '{"Norte"}',
  1, 6,
  'low', 'medium', 'medium',
  'Outono – Primavera',
  27, 19
),
(
  'Ilhabela', 'Ilhabela', 'SP', 'BR',
  -23.7990124, -45.3006895,
  '{"SE","Sul","NE"}', '{"Norte","Oeste"}',
  1, 7,
  'medium_low', 'medium', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Caraguatatuba', 'Caraguatatuba', 'SP', 'BR',
  -23.6017834, -45.4316235,
  '{"SE","Sul"}', '{"Norte","Oeste"}',
  1, 6,
  'low', 'medium', 'medium',
  'Outono – Primavera',
  26, 18
),
(
  'Angra dos Reis', 'Angra dos Reis', 'RJ', 'BR',
  -23.0063966, -44.316326,
  '{"SE","Sul"}', '{"Norte"}',
  1, 6,
  'low', 'low', 'medium',
  'Outono – Primavera',
  27, 20
),
(
  'Arpoador', 'Rio de Janeiro', 'RJ', 'BR',
  -22.9885801, -43.1916762,
  '{"SE","NE","Sul"}', '{"Norte"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Ipanema', 'Rio de Janeiro', 'RJ', 'BR',
  -22.9839557, -43.2022163,
  '{"SE","NE","Sul"}', '{"Norte"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Leblon', 'Rio de Janeiro', 'RJ', 'BR',
  -22.9834608, -43.2249656,
  '{"SE","NE","Sul"}', '{"Norte"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Copacabana', 'Rio de Janeiro', 'RJ', 'BR',
  -22.971974, -43.1842997,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 9,
  'medium_low', 'medium', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'São Conrado', 'Rio de Janeiro', 'RJ', 'BR',
  -22.9913592, -43.2675329,
  '{"SE","NE","Sul"}', '{"Norte"}',
  1, 9,
  'medium_low', 'medium', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Barra da Tijuca', 'Rio de Janeiro', 'RJ', 'BR',
  -22.9997404, -43.3659929,
  '{"SE","NE","Sul"}', '{"NE"}',
  1, 9,
  'medium_low', 'high', 'medium',
  'Outono – Primavera',
  26, 20
),
(
  'Barramares', 'Rio de Janeiro', 'RJ', 'BR',
  -22.3321509, -41.739489,
  '{"SE","NE","Sul"}', '{"NE"}',
  1, 9,
  'medium_low', 'high', 'medium',
  'Outono – Primavera',
  26, 20
),
(
  'Recreio dos Bandeirantes', 'Rio de Janeiro', 'RJ', 'BR',
  -23.0185151, -43.4634021,
  '{"SE","NE","Sul"}', '{"NE"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Macumba', 'Rio de Janeiro', 'RJ', 'BR',
  -23.0339375, -43.4874312,
  '{"SE","Sul"}', '{"Norte"}',
  1, 9,
  'low', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Grumari', 'Rio de Janeiro', 'RJ', 'BR',
  -23.0470388, -43.5334787,
  '{"SE","Sul"}', '{"Norte"}',
  1, 9,
  'medium', 'high', 'low',
  'Outono – Primavera',
  26, 20
),
(
  'Prainha (RJ)', 'Rio de Janeiro', 'RJ', 'BR',
  -22.7889291, -42.5697829,
  '{"SE","Sul"}', '{"Norte"}',
  1, 9,
  'medium', 'high', 'medium',
  'Outono – Primavera',
  26, 20
),
(
  'Reserva', 'Rio de Janeiro', 'RJ', 'BR',
  -22.3629096, -41.855093,
  '{"SE","Sul"}', '{"NE"}',
  1, 9,
  'medium_low', 'high', 'medium',
  'Outono – Primavera',
  26, 20
),
(
  'Diabo', 'Rio de Janeiro', 'RJ', 'BR',
  -22.5837852, -43.4852009,
  '{"SE","Sul"}', '{"Norte"}',
  1, 7,
  'medium', 'medium', 'medium',
  'Outono – Primavera',
  26, 20
),
(
  'Itacoatiara', 'Niterói', 'RJ', 'BR',
  -22.971, -43.0321,
  '{"SE","Sul"}', '{"Norte"}',
  1, 11,
  'medium', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Itaúna', 'Saquarema', 'RJ', 'BR',
  -22.933546, -42.4756608,
  '{"SE","NE"}', '{"Norte"}',
  1, 11,
  'medium', 'high', 'intense',
  'Outono – Primavera',
  25, 19
),
(
  'Praia da Vila', 'Saquarema', 'RJ', 'BR',
  -22.9345345, -42.4987997,
  '{"SE","NE","Sul"}', '{"Norte"}',
  1, 9,
  'medium', 'high', 'intense',
  'Outono – Primavera',
  25, 19
),
(
  'Massambaba', 'Saquarema', 'RJ', 'BR',
  -22.9092296, -42.4164228,
  '{"SE","Sul"}', '{"NE","Leste"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  25, 19
),
(
  'Praia Grande (AC)', 'Arraial do Cabo', 'RJ', 'BR',
  -22.9663832, -42.0322873,
  '{"SE","Sul"}', '{"NE","Leste"}',
  1, 9,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  26, 20
),
(
  'Geribá', 'Búzios', 'RJ', 'BR',
  -22.7784547, -41.914626,
  '{"SE","Sul","NE"}', '{"Norte","Oeste"}',
  1, 7,
  'medium_low', 'medium', 'intense',
  'Outono – Primavera',
  27, 21
),
(
  'Jacaraípe', 'Serra', 'ES', 'BR',
  -20.1591635, -40.1959493,
  '{"Todas direções"}', '{"Norte","Oeste"}',
  1, 7,
  'medium_low', 'high', 'intense',
  'Outono – Primavera',
  27, 22
),
(
  'Engenhoca', 'Vitória', 'ES', 'BR',
  -20.3200917, -40.3376682,
  '{"Leste","NE","Sul"}', '{"NE","Norte"}',
  NULL, NULL,
  'low', 'high', 'intense',
  'Ano todo',
  27, 22
),
(
  'Itaparica (ES)', 'Itapemirim', 'ES', 'BR',
  -20.3622414, -40.2971508,
  '{"SE","Sul"}', '{"NO","Oeste"}',
  1, 5,
  'low', 'high', 'intense',
  'Outono – Primavera',
  27, 22
),
(
  'Regência', 'Linhares', 'ES', 'BR',
  -19.6479219, -39.8247694,
  '{"SE","Leste"}', '{"Norte","Oeste"}',
  1, 5,
  'low', 'medium', 'low',
  'Outono – Primavera',
  27, 22
),
(
  'Jardim de Alah', 'Salvador', 'BA', 'BR',
  -12.9963195, -38.441744,
  '{"SE","NE"}', '{"NE","Leste"}',
  1, 7,
  'medium_low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Stella Maris', 'Salvador', 'BA', 'BR',
  -12.9377602, -38.3346758,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Jaguaribe', 'Salvador', 'BA', 'BR',
  -12.9591847, -38.3928394,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Farol da Barra', 'Salvador', 'BA', 'BR',
  -13.0103342, -38.5329164,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Aleluia', 'Salvador', 'BA', 'BR',
  -12.8402772, -38.3787255,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Espanhol', 'Salvador', 'BA', 'BR',
  -12.9864263, -38.492988,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Tony''s', 'Salvador', 'BA', 'BR',
  -12.9822499, -38.4812772,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Praia da Onda', 'Salvador', 'BA', 'BR',
  -12.9822499, -38.4812772,
  '{"SE","Leste","NE"}', '{"NE","Leste"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Pescador', 'Ilhéus', 'BA', 'BR',
  -16.3166131, -39.0469554,
  '{"Sul","Leste"}', '{"NE"}',
  1, 6,
  'medium_low', 'medium', 'medium',
  'Outono – Primavera',
  27, 23
),
(
  'Ribeira', 'Itacaré', 'BA', 'BR',
  -14.2903533, -38.9848452,
  '{"NE","Sul"}', '{"Sul"}',
  0, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 24
),
(
  'Atalaia', 'Aracajú', 'SE', 'BR',
  -10.9888439, -37.052142,
  '{"SE","NE"}', '{"Oeste"}',
  1, 3,
  'low', 'medium', 'intense',
  'Outono – Inverno',
  28, 24
),
(
  'Ponta Verde', 'Maceió', 'AL', 'BR',
  -9.6604975, -35.7034391,
  '{"SE","Leste","NE"}', '{"Oeste"}',
  1, 4,
  'low', 'high', 'intense',
  'Ano todo',
  28, 25
),
(
  'Milagres', 'São Miguel dos Milagres', 'AL', 'BR',
  -9.2379741, -35.3910943,
  '{"SE","Leste"}', '{"Oeste"}',
  1, 3,
  'low', 'medium', 'low',
  'Ano todo',
  28, 25
),
(
  'Maracaípe', 'Ipojuca', 'PE', 'BR',
  -8.5168342, -35.0086635,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 7,
  'low', 'high', 'intense',
  'Outono – Inverno',
  28, 24
),
(
  'Cupe', 'Ipojuca', 'PE', 'BR',
  -8.467532, -34.9932204,
  '{"SE","NE","Sul"}', '{"Oeste"}',
  1, 7,
  'low', 'high', 'intense',
  'Outono – Inverno',
  28, 24
),
(
  'Cacimba do Padre', 'Fernando de Noronha', 'PE', 'BR',
  -3.8497515, -32.4389861,
  '{"Norte"}', '{"Leste","Sul"}',
  1, 11,
  'high', 'high', 'medium',
  'Primavera – Verão',
  29, 26
),
(
  'Intermares', 'Cabedelo', 'PB', 'BR',
  -7.0457612, -34.8435255,
  '{"SE","Leste","NE"}', '{"Oeste","Sul"}',
  1, 4,
  'low', 'high', 'intense',
  'Ano todo',
  29, 25
),
(
  'Seixas (Ponta do Seixas)', 'João Pessoa', 'PB', 'BR',
  -7.1550796, -34.7933086,
  '{"SE","Leste"}', '{"Oeste","Sul"}',
  1, 4,
  'low', 'high', 'medium',
  'Ano todo',
  29, 25
),
(
  'Ponta Negra', 'Natal', 'RN', 'BR',
  -5.8736046, -35.1766302,
  '{"SE","Leste","NE"}', '{"Oeste","Sul"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  29, 25
),
(
  'Pipa – Lajão', 'Tibau do Sul', 'RN', 'BR',
  -6.1872965, -35.0905246,
  '{"Norte"}', '{"SE","SW","Sul"}',
  1, 5,
  'medium', 'high', 'intense',
  'Outono – Inverno',
  29, 25
),
(
  'Pipa – Praia do Amor', 'Tibau do Sul', 'RN', 'BR',
  -6.2325895, -35.0444429,
  '{"Norte","Leste"}', '{"SE","Sul"}',
  1, 5,
  'medium_low', 'high', 'intense',
  'Ano todo',
  29, 25
),
(
  'Leste-Oeste', 'Fortaleza', 'CE', 'BR',
  -3.4712102, -39.1757575,
  '{"SE","Leste","NE"}', '{"Sul"}',
  1, 4,
  'low', 'high', 'intense',
  'Ano todo',
  28, 25
),
(
  'Praia do Futuro', 'Fortaleza', 'CE', 'BR',
  -3.7312265, -38.4564034,
  '{"Leste","NE"}', '{"Sul","SW"}',
  1, 5,
  'low', 'high', 'intense',
  'Ano todo',
  28, 25
),
(
  'Titanzinho', 'Fortaleza', 'CE', 'BR',
  -3.7100286, -38.468104,
  '{"Leste","NE"}', '{"Sul","SW"}',
  1, 9,
  'high', 'high', 'medium',
  'Inverno – Primavera',
  28, 25
),
(
  'Cumbuco', 'Caucaia', 'CE', 'BR',
  -3.6258588, -38.7256353,
  '{"Leste","NE"}', '{"Sul","SW"}',
  1, 4,
  'low', 'high', 'medium',
  'Ano todo',
  28, 25
),
(
  'Atalaia (PI)', 'Luís Correia', 'PI', 'BR',
  -2.8829327, -41.6369917,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 4,
  'low', 'low', 'low',
  'Inverno – Primavera',
  29, 25
),
(
  'Calhau', 'São Luís', 'MA', 'BR',
  -2.4908678, -44.26922,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 5,
  'low', 'medium', 'medium',
  'Inverno – Primavera',
  29, 25
),
(
  'Araçagi', 'São Luís', 'MA', 'BR',
  -2.4778661, -44.2113732,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 5,
  'low', 'low', 'low',
  'Inverno – Primavera',
  29, 25
),
(
  'Ajuruteua', 'Bragança', 'PA', 'BR',
  -0.8291303, -46.6046721,
  '{"NE","Leste"}', '{"Sul","SW"}',
  1, 4,
  'low', 'low', 'low',
  'Inverno – Primavera',
  30, 26
)
;

-- Resumo: 114 geocodificadas pelo nome, 7 pela cidade, 0 sem coordenada