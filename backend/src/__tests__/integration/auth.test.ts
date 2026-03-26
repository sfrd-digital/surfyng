// Testes de integração — POST /api/v1/auth/verify
// Mocka Firebase e banco para testar fluxo de autenticação sem infraestrutura real

// ─── Mocks (devem vir antes de qualquer import) ───────────────────────────────

jest.mock('../../config/firebase', () => ({
  firebaseAdmin: {},
  firebaseAuth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    on: jest.fn(),
    connect: jest.fn(),
  },
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock('../../config/redis', () => ({
  redis: {
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  deleteCache: jest.fn().mockResolvedValue(undefined),
  CACHE_TTL_SECONDS: 1800,
}));

jest.mock('../../config/stripe', () => ({
  stripe: {},
  PRECOS_STRIPE: { pro: 'price_test_pro', global: 'price_test_global' },
  priceIdParaPlano: jest.fn(),
}));

// ─── Imports (após os mocks) ──────────────────────────────────────────────────

import request from 'supertest';
import app from '../../app';
import { firebaseAuth } from '../../config/firebase';
import { query, queryOne } from '../../config/database';

const mockFirebaseAuth = firebaseAuth as jest.Mocked<typeof firebaseAuth>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tokenDecodificado = {
  uid: 'firebase-uid-abc123',
  name: 'Surfista Teste',
  email: 'teste@surfyng.app',
  picture: 'https://example.com/foto.jpg',
};

const usuarioBanco = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  firebase_uid: 'firebase-uid-abc123',
  name: 'Surfista Teste',
  email: 'teste@surfyng.app',
  photo_url: 'https://example.com/foto.jpg',
  level: 'beginner',
  cold_tolerance: 'normal',
  plan: 'free',
  stripe_customer_id: null,
  base_lat: null,
  base_lng: null,
  city: null,
  push_token: null,
  language: 'pt',
  created_at: new Date('2026-03-25'),
};

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/verify', () => {

  beforeEach(() => {
    jest.resetAllMocks(); // limpa filas de once + implementações
    // Firebase valida o token com sucesso por padrão
    mockFirebaseAuth.verifyIdToken.mockResolvedValue(tokenDecodificado as any);
  });

  test('primeiro acesso — cria usuário e retorna 200', async () => {
    // Usuário não existe ainda no banco
    mockQueryOne.mockResolvedValueOnce(null);
    // INSERT INTO users retorna o usuário criado
    mockQuery.mockResolvedValueOnce([usuarioBanco] as any);

    const resposta = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', 'Bearer token-firebase-valido')
      .send({ language: 'pt' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toBe('Autenticação bem-sucedida');
    expect(resposta.body.usuario).toMatchObject({
      email: 'teste@surfyng.app',
      nivel: 'beginner',
      plano: 'free',
      idioma: 'pt',
    });
  });

  test('login existente — retorna usuário sem criar novo', async () => {
    // Usuário já existe no banco
    mockQueryOne.mockResolvedValueOnce(usuarioBanco as any);

    const resposta = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', 'Bearer token-firebase-valido')
      .send({});

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.email).toBe('teste@surfyng.app');
    // Não deve chamar query (INSERT) para criação de usuário
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('push_token atualizado se diferente do salvo', async () => {
    const usuarioSemToken = { ...usuarioBanco, push_token: null };
    mockQueryOne.mockResolvedValueOnce(usuarioSemToken as any);
    mockQuery.mockResolvedValueOnce([] as any); // UPDATE push_token

    const resposta = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', 'Bearer token-firebase-valido')
      .send({ push_token: 'ExponentPushToken[xxx123]' });

    expect(resposta.status).toBe(200);
    // UPDATE foi chamado para salvar o novo push_token
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET push_token'),
      expect.arrayContaining(['ExponentPushToken[xxx123]'])
    );
  });

  test('sem Authorization header → 401', async () => {
    const resposta = await request(app)
      .post('/api/v1/auth/verify')
      .send({});

    expect(resposta.status).toBe(401);
    expect(resposta.body.error).toContain('ausente');
  });

  test('token Firebase inválido → 401', async () => {
    mockFirebaseAuth.verifyIdToken.mockRejectedValueOnce(
      new Error('Token inválido')
    );

    const resposta = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', 'Bearer token-invalido')
      .send({});

    expect(resposta.status).toBe(401);
    expect(resposta.body.error).toContain('inválido');
  });

});
