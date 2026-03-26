// Configuração da conexão com PostgreSQL
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexões com o banco de dados
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // máximo de conexões simultâneas
  idleTimeoutMillis: 30000, // fecha conexões ociosas após 30s
  connectionTimeoutMillis: 2000,
});

// Testa a conexão ao iniciar
pool.on('connect', () => {
  console.log('[DB] Nova conexão com PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado na conexão com PostgreSQL:', err);
  process.exit(-1);
});

// Helper para executar queries com tipagem
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper para buscar um único registro
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// Executa um bloco de queries dentro de uma transação
// Faz rollback automático em caso de erro
export async function withTransaction<T>(
  fn: (client: { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }> }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
