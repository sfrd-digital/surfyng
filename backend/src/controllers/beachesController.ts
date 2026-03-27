// Controller de praias — listagem, busca por proximidade e detalhes com condições
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { Beach, ColdTolerance } from '../types';
import { createError } from '../middleware/errorHandler';
import {
  buscarCondicoesCache,
  buscarOuFetchCondicoes,
  processarCacheCondicoes,
} from '../services/beachesService';

// ─── Schemas de validação ────────────────────────────────────────────────────

const listarSchema = z.object({
  state:      z.string().max(5).optional(),
  difficulty: z.enum(['low', 'medium_low', 'medium', 'medium_high', 'high']).optional(),
  country:    z.string().max(5).optional(),
  limit:      z.coerce.number().int().min(1).max(50).default(20),
  offset:     z.coerce.number().int().min(0).default(0),
});

const proximidadeSchema = z.object({
  lat:      z.coerce.number().min(-90).max(90),
  lng:      z.coerce.number().min(-180).max(180),
  raio_km:  z.coerce.number().min(1).max(500).default(50),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Formata uma praia para a resposta da API
function formatarPraia(beach: Beach) {
  return {
    id:              beach.id,
    nome:            beach.name,
    cidade:          beach.city,
    estado:          beach.state,
    pais:            beach.country,
    lat:             Number(beach.lat),
    lng:             Number(beach.lng),
    dificuldade:     beach.difficulty,
    consistencia:    beach.consistency,
    lotacao:         beach.crowd,
    melhor_estacao:  beach.best_season,
    tamanho_min_pes: beach.min_size_feet,
    tamanho_max_pes: beach.max_size_feet,
    descricao:       beach.description,
    temp_agua_verao: beach.water_temp_summer_c ? Number(beach.water_temp_summer_c) : null,
    temp_agua_inverno: beach.water_temp_winter_c ? Number(beach.water_temp_winter_c) : null,
  };
}

// Tolerância ao frio do usuário autenticado (ou padrão 'normal')
function toleranciaDoUsuario(req: Request): ColdTolerance {
  return (req.user?.cold_tolerance as ColdTolerance) ?? 'normal';
}

// ─── Controllers ─────────────────────────────────────────────────────────────

// GET /api/v1/beaches
// Lista praias com filtros opcionais. Não retorna condições em tempo real.
export async function listarPraias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { state, difficulty, country, limit, offset } = listarSchema.parse(req.query);

    // Monta filtros dinamicamente
    const condicoes: string[] = ['1=1'];
    const params: unknown[] = [];
    let idx = 1;

    if (country) {
      condicoes.push(`country = $${idx++}`);
      params.push(country);
    } else {
      condicoes.push(`country = $${idx++}`);
      params.push('BR');
    }

    if (state) {
      condicoes.push(`state = $${idx++}`);
      params.push(state.toUpperCase());
    }

    if (difficulty) {
      condicoes.push(`difficulty = $${idx++}`);
      params.push(difficulty);
    }

    params.push(limit, offset);

    const praias = await query<Beach>(
      `SELECT * FROM beaches
       WHERE ${condicoes.join(' AND ')}
       ORDER BY state, name
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    const [{ total }] = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM beaches WHERE ${condicoes.join(' AND ')}`,
      params.slice(0, params.length - 2) // sem limit/offset
    );

    res.json({
      total: Number(total),
      limit,
      offset,
      praias: praias.map(formatarPraia),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/beaches/nearby?lat=X&lng=Y&raio_km=Z&limit=N
// Busca praias dentro de um raio usando a fórmula de Haversine.
// Retorna condições do cache do banco (sem buscar da Windguru).
export async function praiasPorProximidade(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lat, lng, raio_km, limit } = proximidadeSchema.parse(req.query);
    const tolerancia = toleranciaDoUsuario(req);

    // Fórmula de Haversine em SQL — raio da terra: 6371 km
    const praias = await query<Beach & { distancia_km: number }>(
      `SELECT *,
        ROUND(
          (6371 * acos(
            cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2))
            + sin(radians($1)) * sin(radians(lat))
          ))::numeric, 1
        ) AS distancia_km
       FROM beaches
       WHERE (
         6371 * acos(
           cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2))
           + sin(radians($1)) * sin(radians(lat))
         )
       ) <= $3
       ORDER BY distancia_km
       LIMIT $4`,
      [lat, lng, raio_km, limit]
    );

    // Para cada praia, tenta pegar condições do cache do banco (sem chamar Windguru)
    const resultado = await Promise.all(
      praias.map(async (praia) => {
        const cache = await buscarCondicoesCache(praia.id);
        const condicoes = cache ? processarCacheCondicoes(cache, tolerancia) : null;

        return {
          ...formatarPraia(praia),
          distancia_km: Number(praia.distancia_km),
          condicoes,
        };
      })
    );

    res.json({
      total: resultado.length,
      raio_km,
      praias: resultado,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/beaches/:id
// Detalhes de uma praia com condições em tempo real (busca Windguru se cache estiver vencido).
// Score e roupa são personalizados pelo perfil do usuário autenticado.
export async function detalhesPraia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const tolerancia = toleranciaDoUsuario(req);

    const praia = await queryOne<Beach>('SELECT * FROM beaches WHERE id = $1', [id]);
    if (!praia) {
      throw createError('Praia não encontrada', 404);
    }

    // Verifica se o usuário favoritou esta praia (apenas se autenticado)
    let isFavorita = false;
    if (req.user) {
      const fav = await queryOne(
        'SELECT id FROM favorite_beaches WHERE user_id = $1 AND beach_id = $2',
        [req.user.id, id]
      );
      isFavorita = !!fav;
    }

    // 1. Tenta o cache do banco
    let condicoes = null;
    const cache = await buscarCondicoesCache(id);

    if (cache) {
      condicoes = processarCacheCondicoes(cache, tolerancia);
    } else {
      // 2. Cache vencido ou ausente — busca da Windguru (com Redis como camada rápida)
      condicoes = await buscarOuFetchCondicoes(praia, tolerancia);
    }

    res.json({
      ...formatarPraia(praia),
      direcoes_swell:  praia.swell_directions,
      direcoes_vento:  praia.wind_directions,
      is_favorita:     isFavorita,
      condicoes,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/beaches/:id/conditions
// Força a atualização das condições de uma praia (ignora cache, busca Windguru direto).
// Útil para o usuário apertar "atualizar" no app.
export async function atualizarCondicoes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const tolerancia = toleranciaDoUsuario(req);

    const praia = await queryOne<Beach>('SELECT * FROM beaches WHERE id = $1', [id]);
    if (!praia) {
      throw createError('Praia não encontrada', 404);
    }

    // Open-Meteo usa lat/lng — todas as praias com coordenadas têm suporte
    const condicoes = await buscarOuFetchCondicoes(praia, tolerancia);
    if (!condicoes) {
      res.status(503).json({ error: 'Não foi possível obter condições meteorológicas no momento' });
      return;
    }

    res.json({ praia_id: id, condicoes });
  } catch (err) {
    next(err);
  }
}
