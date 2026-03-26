// Controller de notificações — histórico e marcação de leitura
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { createError } from '../middleware/errorHandler';

// ─── Schema ──────────────────────────────────────────────────────────────────

const listarSchema = z.object({
  apenas_nao_lidas: z.coerce.boolean().default(false),
  limit:            z.coerce.number().int().min(1).max(100).default(30),
  offset:           z.coerce.number().int().min(0).default(0),
});

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface Notificacao {
  id:         string;
  user_id:    string;
  beach_id:   string | null;
  title:      string;
  body:       string;
  type:       string;
  read:       boolean;
  created_at: Date;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

// GET /api/v1/notifications
// Lista notificações do usuário autenticado com contador de não lidas.
export async function listarNotificacoes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { apenas_nao_lidas, limit, offset } = listarSchema.parse(req.query);

    const filtroLeitura = apenas_nao_lidas ? 'AND read = false' : '';

    const notificacoes = await query<Notificacao>(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${filtroLeitura}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    const [{ nao_lidas }] = await query<{ nao_lidas: string }>(
      `SELECT COUNT(*) AS nao_lidas FROM notifications WHERE user_id = $1 AND read = false`,
      [user.id]
    );

    res.json({
      nao_lidas:     Number(nao_lidas),
      total_pagina:  notificacoes.length,
      limit,
      offset,
      notificacoes: notificacoes.map((n) => ({
        id:         n.id,
        titulo:     n.title,
        corpo:      n.body,
        tipo:       n.type,
        lida:       n.read,
        praia_id:   n.beach_id,
        criado_em:  n.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/:id/read
// Marca uma notificação específica como lida.
export async function marcarComoLida(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const notificacao = await queryOne<Notificacao>(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );

    if (!notificacao) throw createError('Notificação não encontrada', 404);
    if (notificacao.user_id !== user.id) throw createError('Sem permissão', 403);

    await query('UPDATE notifications SET read = true WHERE id = $1', [id]);

    res.json({ mensagem: 'Notificação marcada como lida' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/read-all
// Marca todas as notificações do usuário como lidas.
export async function marcarTodasComoLidas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    const resultado = await query<{ count: string }>(
      `WITH updated AS (
         UPDATE notifications SET read = true
         WHERE user_id = $1 AND read = false
         RETURNING id
       )
       SELECT COUNT(*) AS count FROM updated`,
      [user.id]
    );

    res.json({ mensagem: 'Notificações marcadas como lidas', total: Number(resultado[0].count) });
  } catch (err) {
    next(err);
  }
}
