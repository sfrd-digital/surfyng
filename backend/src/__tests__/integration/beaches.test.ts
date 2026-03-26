// Testes de integração — endpoints de praias
// GET /api/v1/beaches         (listagem)
// GET /api/v1/beaches/nearby  (por proximidade — equivalente ao "recommend")
// GET /api/v1/beaches/:id     (detalhes)

// ─── Mocks (hoistados antes de qualquer import) ───────────────────────────────

jest.mock('../../config/firebase', () => ({
  firebaseAdmin: {},
  firebaseAuth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  pool: { query: jest.fn(), on: jest.fn() },
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock('../../config/redis', () => ({
  redis: {
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  CACHE_TTL_SECONDS: 1800,
}));

jest.mock('../../config/stripe', () => ({
  stripe: {},
  PRECOS_STRIPE: { pro: 'price_test_pro', global: 'price_test_global' },
  priceIdParaPlano: jest.fn(),
}));

// Evita chamadas HTTP reais ao Windguru nos testes
jest.mock('../../services/windguruService', () => ({
  buscarCondicoesWindguru: jest.fn().mockResolvedValue(null),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import request from 'supertest';
import app from '../../app';
import { firebaseAuth } from '../../config/firebase';
import { query, queryOne } from '../../config/database';
import { getCache } from '../../config/redis';

const mockFirebaseAuth = firebaseAuth as jest.Mocked<typeof firebaseAuth>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockGetCache = getCache as jest.MockedFunction<typeof getCache>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const usuarioMock = {
  id: 'user-uuid-001',
  firebase_uid: 'fb-uid-001',
  name: 'Surfista Teste',
  email: 'surf@teste.app',
  photo_url: null,
  level: 'intermediate',
  cold_tolerance: 'normal',
  plan: 'free',
  stripe_customer_id: null,
  base_lat: null,
  base_lng: null,
  city: null,
  push_token: null,
  language: 'pt',
  created_at: new Date('2026-03-01'),
};

const praiaJoaquina = {
  id: 'praia-uuid-001',
  name: 'Joaquina',
  city: 'Florianópolis',
  state: 'SC',
  country: 'BR',
  lat: '-27.6418',
  lng: '-48.4577',
  swell_directions: ['SE', 'NE'],
  wind_directions: ['NE', 'Oeste'],
  min_size_feet: 1,
  max_size_feet: 11,
  difficulty: 'medium_low',
  best_season: 'Outono – Inverno',
  consistency: 'high',
  crowd: 'intense',
  windguru_station_id: 64,
  water_temp_summer_c: '22.0',
  water_temp_winter_c: '14.0',
  description: null,
  created_at: new Date('2026-01-01'),
};

const praiaMole = {
  ...praiaJoaquina,
  id: 'praia-uuid-002',
  name: 'Praia Mole',
  lat: '-27.5989',
  lng: '-48.4321',
};

// Restaura os padrões necessários após resetAllMocks
function setupDefaults() {
  mockFirebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'fb-uid-001' } as any);
  mockQueryOne.mockResolvedValue(usuarioMock as any); // padrão: sempre retorna o usuário
  mockGetCache.mockResolvedValue(null);               // padrão: sem cache Redis
}

// ─── GET /api/v1/beaches ──────────────────────────────────────────────────────

describe('GET /api/v1/beaches', () => {

  beforeEach(() => {
    jest.resetAllMocks(); // limpa filas de mockResolvedValueOnce + implementações
    setupDefaults();
  });

  test('lista praias com paginação padrão → 200', async () => {
    mockQuery
      .mockResolvedValueOnce([praiaJoaquina, praiaMole] as any)  // SELECT praias
      .mockResolvedValueOnce([{ total: '2' }] as any);            // COUNT

    const resposta = await request(app)
      .get('/api/v1/beaches')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(2);
    expect(resposta.body.praias).toHaveLength(2);
    expect(resposta.body.praias[0]).toMatchObject({
      nome: 'Joaquina',
      cidade: 'Florianópolis',
      estado: 'SC',
      dificuldade: 'medium_low',
      consistencia: 'high',
    });
  });

  test('filtra por estado (SC) → retorna só praias de SC', async () => {
    mockQuery
      .mockResolvedValueOnce([praiaJoaquina] as any)
      .mockResolvedValueOnce([{ total: '1' }] as any);

    const resposta = await request(app)
      .get('/api/v1/beaches?state=SC')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(1);
    expect(resposta.body.praias[0].estado).toBe('SC');
  });

  test('sem Authorization header → 401', async () => {
    jest.resetAllMocks(); // garante sem mock de auth
    const resposta = await request(app).get('/api/v1/beaches');
    expect(resposta.status).toBe(401);
    expect(resposta.body.error).toContain('ausente');
  });

  test('limit e offset são refletidos na resposta', async () => {
    mockQuery
      .mockResolvedValueOnce([praiaJoaquina] as any)
      .mockResolvedValueOnce([{ total: '10' }] as any);

    const resposta = await request(app)
      .get('/api/v1/beaches?limit=1&offset=5')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.limit).toBe(1);
    expect(resposta.body.offset).toBe(5);
    expect(resposta.body.total).toBe(10);
  });

  test('limit inválido (> 50) → 400 com detalhes do campo', async () => {
    const resposta = await request(app)
      .get('/api/v1/beaches?limit=999')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toBe('Dados inválidos');
    // O array detalhes informa qual campo falhou na validação Zod
    expect(resposta.body.detalhes[0].campo).toBe('limit');
  });

});

// ─── GET /api/v1/beaches/nearby ───────────────────────────────────────────────

describe('GET /api/v1/beaches/nearby', () => {

  beforeEach(() => {
    jest.resetAllMocks();
    setupDefaults();
  });

  test('retorna praias no raio com distância calculada → 200', async () => {
    const praiasComDist = [
      { ...praiaJoaquina, distancia_km: '3.2' },
      { ...praiaMole, distancia_km: '5.7' },
    ];
    mockQuery.mockResolvedValueOnce(praiasComDist as any);
    // buscarCondicoesCache chama queryOne para cada praia (padrão: retorna usuário)
    // Precisamos que retorne null (sem cache) para cada praia
    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any) // auth middleware
      .mockResolvedValueOnce(null)               // cache praia 1
      .mockResolvedValueOnce(null);              // cache praia 2

    const resposta = await request(app)
      .get('/api/v1/beaches/nearby?lat=-27.6418&lng=-48.4577&raio_km=50')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.raio_km).toBe(50);
    expect(resposta.body.total).toBe(2);
    expect(resposta.body.praias[0]).toMatchObject({
      nome: 'Joaquina',
      distancia_km: 3.2,
    });
    expect(resposta.body.praias[0].condicoes).toBeNull();
  });

  test('retorna condicoes do cache quando disponível → score e roupa no response', async () => {
    const praiaComDist = { ...praiaJoaquina, distancia_km: '4.0' };
    mockQuery.mockResolvedValueOnce([praiaComDist] as any);

    const cacheCondicoes = {
      id: 'cache-uuid-001',
      beach_id: praiaJoaquina.id,
      wind_speed: '15.0',
      wind_direction: 'NE',
      swell_height: '1.50',
      swell_direction: 'SE',
      swell_period: 12,
      water_temp_c: '20.0',
      air_temp_c: '24.0',
      wetsuit_recommendation: 'Shortinho 2/2mm',
      score: '9.5',
      fetched_at: new Date(),
      expires_at: new Date(Date.now() + 20 * 60 * 1000),
    };

    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any)    // auth
      .mockResolvedValueOnce(cacheCondicoes as any); // cache da praia

    const resposta = await request(app)
      .get('/api/v1/beaches/nearby?lat=-27.6418&lng=-48.4577')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    const condicoes = resposta.body.praias[0].condicoes;
    expect(condicoes).not.toBeNull();
    expect(condicoes.score).toBe(9.5);
    expect(condicoes.roupa).toBe('Shortinho 2/2mm');
    expect(condicoes.wind_direction).toBe('NE');
    expect(condicoes.swell_height).toBe(1.5);
  });

  test('raio customizado de 10km respeitado no response', async () => {
    mockQuery.mockResolvedValueOnce([{ ...praiaJoaquina, distancia_km: '2.1' }] as any);
    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any) // auth
      .mockResolvedValueOnce(null);              // cache

    const resposta = await request(app)
      .get('/api/v1/beaches/nearby?lat=-27.6418&lng=-48.4577&raio_km=10')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.raio_km).toBe(10);
  });

  test('sem lat/lng obrigatórios → 400', async () => {
    const resposta = await request(app)
      .get('/api/v1/beaches/nearby')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(400);
  });

  test('lat fora do intervalo válido (-90 a 90) → 400', async () => {
    const resposta = await request(app)
      .get('/api/v1/beaches/nearby?lat=-999&lng=-48.4')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(400);
  });

  test('nenhuma praia encontrada no raio → lista vazia', async () => {
    mockQuery.mockResolvedValueOnce([] as any);
    mockQueryOne.mockResolvedValueOnce(usuarioMock as any); // auth

    const resposta = await request(app)
      .get('/api/v1/beaches/nearby?lat=-23.5&lng=-46.6&raio_km=5')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(0);
    expect(resposta.body.praias).toHaveLength(0);
  });

});

// ─── GET /api/v1/beaches/:id ──────────────────────────────────────────────────

describe('GET /api/v1/beaches/:id', () => {

  beforeEach(() => {
    jest.resetAllMocks();
    setupDefaults();
  });

  test('praia existente sem cache → 200 com condicoes null (windguru mockado)', async () => {
    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any)   // auth
      .mockResolvedValueOnce(praiaJoaquina as any)  // busca praia
      .mockResolvedValueOnce(null)                  // favorito?
      .mockResolvedValueOnce(null);                 // buscarCondicoesCache

    const resposta = await request(app)
      .get(`/api/v1/beaches/${praiaJoaquina.id}`)
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('Joaquina');
    expect(resposta.body.estado).toBe('SC');
    expect(resposta.body.is_favorita).toBe(false);
    // windguru mockado para retornar null → condicoes null
    expect(resposta.body.condicoes).toBeNull();
  });

  test('praia com cache → retorna condicoes sem chamar Windguru', async () => {
    const cacheCondicoes = {
      id: 'cache-uuid-002',
      beach_id: praiaJoaquina.id,
      wind_speed: '18.0',
      wind_direction: 'Oeste',
      swell_height: '1.20',
      swell_direction: 'SE',
      swell_period: 10,
      water_temp_c: '18.0',
      air_temp_c: '22.0',
      wetsuit_recommendation: 'Wetsuit 3/2mm',
      score: '8.0',
      fetched_at: new Date(),
      expires_at: new Date(Date.now() + 25 * 60 * 1000),
    };

    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any)    // auth
      .mockResolvedValueOnce(praiaJoaquina as any)  // busca praia
      .mockResolvedValueOnce(null)                  // favorito?
      .mockResolvedValueOnce(cacheCondicoes as any);// buscarCondicoesCache

    const resposta = await request(app)
      .get(`/api/v1/beaches/${praiaJoaquina.id}`)
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.condicoes).toMatchObject({
      score: 8,
      roupa: 'Wetsuit 3/2mm',
      wind_direction: 'Oeste',
      swell_height: 1.2,
    });
  });

  test('praia favoritada pelo usuário → is_favorita = true', async () => {
    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any)           // auth
      .mockResolvedValueOnce(praiaJoaquina as any)         // busca praia
      .mockResolvedValueOnce({ id: 'fav-uuid-001' } as any) // favorito encontrado
      .mockResolvedValueOnce(null);                        // sem cache

    const resposta = await request(app)
      .get(`/api/v1/beaches/${praiaJoaquina.id}`)
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(200);
    expect(resposta.body.is_favorita).toBe(true);
  });

  test('praia inexistente → 404', async () => {
    mockQueryOne
      .mockResolvedValueOnce(usuarioMock as any) // auth
      .mockResolvedValueOnce(null);              // praia não encontrada

    const resposta = await request(app)
      .get('/api/v1/beaches/uuid-que-nao-existe')
      .set('Authorization', 'Bearer token-valido');

    expect(resposta.status).toBe(404);
    expect(resposta.body.error).toContain('não encontrada');
  });

});
