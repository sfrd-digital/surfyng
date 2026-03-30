// ⚠️  REMOVER ANTES DE IR PARA PRODUÇÃO
// Endpoint temporário para validar praias e condições sem autenticação JWT.
// Uso: GET /api/v1/test/recommend?lat=-27.6418&lng=-48.4577

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { Beach } from '../types';
import { buscarOuFetchCondicoes } from '../services/beachesService';

const router = Router();

const recomendarSchema = z.object({
  lat:     z.coerce.number().min(-90).max(90),
  lng:     z.coerce.number().min(-180).max(180),
  raio_km: z.coerce.number().min(1).max(500).default(50),
  limit:   z.coerce.number().int().min(1).max(20).default(10),
});

// GET /api/v1/test/recommend?lat=X&lng=Y&raio_km=Z&limit=N
// Busca praias próximas e retorna condições Open-Meteo com scores — sem JWT.
router.get('/recommend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, raio_km, limit } = recomendarSchema.parse(req.query);

    // Busca praias dentro do raio usando Haversine (igual a praiasPorProximidade)
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

    // Para cada praia, busca condições frescas do Open-Meteo (ignora cache)
    const resultado = await Promise.all(
      praias.map(async (praia) => {
        const condicoes = await buscarOuFetchCondicoes(praia, 'normal');

        return {
          id:           praia.id,
          nome:         praia.name,
          cidade:       praia.city,
          estado:       praia.state,
          lat:          Number(praia.lat),
          lng:          Number(praia.lng),
          dificuldade:  praia.difficulty,
          distancia_km: Number(praia.distancia_km),
          condicoes,
        };
      })
    );

    // Ordena por score decrescente para facilitar validação visual
    resultado.sort((a, b) => (b.condicoes?.score ?? 0) - (a.condicoes?.score ?? 0));

    res.json({
      aviso: 'ENDPOINT DE TESTE — REMOVER ANTES DE IR PARA PRODUÇÃO',
      total: resultado.length,
      raio_km,
      lat,
      lng,
      praias: resultado,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
