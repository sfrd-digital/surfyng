// Configuração da conexão com Redis (cache de condições meteorológicas)
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Tempo padrão de expiração do cache: 30 minutos
export const CACHE_TTL_SECONDS = 30 * 60;

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('[Redis] Conexão estabelecida com sucesso');
});

redis.on('error', (err) => {
  console.error('[Redis] Erro de conexão:', err.message);
});

// Helper: buscar valor do cache
export async function getCache<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// Helper: salvar valor no cache com TTL
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

// Helper: invalidar cache por chave
export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}
