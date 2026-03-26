// Controller de alertas — configura notificações por score mínimo em praias favoritas
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { AlertPreference } from '../types';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const criarAlertaSchema = z.object({
  beach_id:  z.string().uuid(),
  min_score: z.number().min(1).max(10).default(7),
});

const atualizarAlertaSchema = z.object({
  min_score: z.number().min(1).max(10).optional(),
  active:    z.boolean().optional(),
}).refine((d) => d.min_score !== undefined || d.active !== undefined, {
  message: 'Informe min_score ou active',
});

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface AlertaComDetalhes extends AlertPreference {
  beach_name:  string;
  beach_city:  string | null;
  beach_state: string | null;
  score_atual: number | null; // última leitura do cache (pode ser null se sem dados)
}

// ─── Controllers ─────────────────────────────────────────────────────────────

// GET /api/v1/alerts
// Lista todos os alertas do usuário com dados da praia e score atual.
export async function listarAlertas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    const alertas = await query<AlertaComDetalhes>(
      `SELECT
         ap.*,
         b.name  AS beach_name,
         b.city  AS beach_city,
         b.state AS beach_state,
         (
           SELECT cc.score
           FROM conditions_cache cc
           WHERE cc.beach_id = ap.beach_id AND cc.expires_at > NOW()
           ORDER BY cc.fetched_at DESC
           LIMIT 1
         ) AS score_atual
       FROM alert_preferences ap
       JOIN beaches b ON b.id = ap.beach_id
       WHERE ap.user_id = $1
       ORDER BY ap.created_at DESC`,
      [user.id]
    );

    res.json({
      total: alertas.length,
      alertas: alertas.map((a) => ({
        id:         a.id,
        min_score:  Number(a.min_score),
        ativo:      a.active,
        criado_em:  a.created_at,
        score_atual: a.score_atual !== null ? Number(a.score_atual) : null,
        disparando: a.score_atual !== null && Number(a.score_atual) >= Number(a.min_score),
        praia: {
          id:     a.beach_id,
          nome:   a.beach_name,
          cidade: a.beach_city,
          estado: a.beach_state,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/alerts
// Cria um alerta para uma praia. Se já existir, retorna 409.
export async function criarAlerta(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { beach_id, min_score } = criarAlertaSchema.parse(req.body);

    // Verifica se a praia existe
    const praia = await queryOne('SELECT id, name FROM beaches WHERE id = $1', [beach_id]);
    if (!praia) throw createError('Praia não encontrada', 404);

    // Verifica se alerta já existe para este par user+praia
    const existente = await queryOne(
      'SELECT id FROM alert_preferences WHERE user_id = $1 AND beach_id = $2',
      [user.id, beach_id]
    );
    if (existente) {
      res.status(409).json({ error: 'Alerta já existe para esta praia. Use PUT para atualizar.' });
      return;
    }

    const [alerta] = await query<AlertPreference>(
      `INSERT INTO alert_preferences (id, user_id, beach_id, min_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), user.id, beach_id, min_score]
    );

    res.status(201).json({
      mensagem: 'Alerta criado com sucesso',
      alerta: {
        id:        alerta.id,
        min_score: Number(alerta.min_score),
        ativo:     alerta.active,
        praia_id:  alerta.beach_id,
      },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/alerts/:beach_id
// Atualiza min_score ou ativa/desativa um alerta existente.
export async function atualizarAlerta(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { beach_id } = req.params;
    const dados = atualizarAlertaSchema.parse(req.body);

    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (dados.min_score !== undefined) {
      campos.push(`min_score = $${idx++}`);
      valores.push(dados.min_score);
    }
    if (dados.active !== undefined) {
      campos.push(`active = $${idx++}`);
      valores.push(dados.active);
    }

    valores.push(user.id, beach_id);

    const alerta = await queryOne<AlertPreference>(
      `UPDATE alert_preferences
       SET ${campos.join(', ')}
       WHERE user_id = $${idx++} AND beach_id = $${idx}
       RETURNING *`,
      valores
    );

    if (!alerta) throw createError('Alerta não encontrado', 404);

    res.json({
      mensagem: 'Alerta atualizado',
      alerta: {
        id:        alerta.id,
        min_score: Number(alerta.min_score),
        ativo:     alerta.active,
        praia_id:  alerta.beach_id,
      },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/alerts/:beach_id
// Remove o alerta de uma praia.
export async function removerAlerta(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { beach_id } = req.params;

    const resultado = await query(
      'DELETE FROM alert_preferences WHERE user_id = $1 AND beach_id = $2',
      [user.id, beach_id]
    );

    if ((resultado as unknown as unknown[]).length === 0) {
      throw createError('Alerta não encontrado', 404);
    }

    res.json({ mensagem: 'Alerta removido' });
  } catch (err) {
    next(err);
  }
}
