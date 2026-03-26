// Controller de usuários — perfil, atualização e favoritos
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { User } from '../types';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// Schema de validação para atualização de perfil
const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  cold_tolerance: z.enum(['sensitive', 'normal', 'resistant']).optional(),
  base_lat: z.number().min(-90).max(90).optional(),
  base_lng: z.number().min(-180).max(180).optional(),
  city: z.string().max(100).optional(),
  push_token: z.string().optional(),
  language: z.string().max(5).optional(),
});

// GET /api/v1/users/me — retorna perfil completo do usuário autenticado
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    // Busca favoritos do usuário
    const favoritos = await query<{ beach_id: string; beach_name: string; city: string }>(
      `SELECT fb.beach_id, b.name AS beach_name, b.city
       FROM favorite_beaches fb
       JOIN beaches b ON b.id = fb.beach_id
       WHERE fb.user_id = $1
       ORDER BY fb.created_at DESC`,
      [user.id]
    );

    res.json({
      id: user.id,
      nome: user.name,
      email: user.email,
      foto: user.photo_url,
      nivel: user.level,
      tolerancia_frio: user.cold_tolerance,
      plano: user.plan,
      localizacao_base: user.base_lat
        ? { lat: user.base_lat, lng: user.base_lng, cidade: user.city }
        : null,
      idioma: user.language,
      criado_em: user.created_at,
      praias_favoritas: favoritos,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/users/me — atualiza perfil do usuário autenticado
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const dados = updateProfileSchema.parse(req.body);

    // Monta a query de update dinamicamente com os campos fornecidos
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    for (const [chave, valor] of Object.entries(dados)) {
      if (valor !== undefined) {
        campos.push(`${chave} = $${idx}`);
        valores.push(valor);
        idx++;
      }
    }

    if (campos.length === 0) {
      res.status(400).json({ error: 'Nenhum campo enviado para atualização' });
      return;
    }

    valores.push(user.id);
    const usuarioAtualizado = await queryOne<User>(
      `UPDATE users SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
      valores
    );

    res.json({
      mensagem: 'Perfil atualizado com sucesso',
      usuario: {
        id: usuarioAtualizado!.id,
        nome: usuarioAtualizado!.name,
        nivel: usuarioAtualizado!.level,
        tolerancia_frio: usuarioAtualizado!.cold_tolerance,
        plano: usuarioAtualizado!.plan,
        idioma: usuarioAtualizado!.language,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/users/me/favorites/:beach_id — adiciona praia aos favoritos
export async function addFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { beach_id } = req.params;

    // Verifica se a praia existe
    const praia = await queryOne('SELECT id FROM beaches WHERE id = $1', [beach_id]);
    if (!praia) {
      throw createError('Praia não encontrada', 404);
    }

    // Verifica se já é favorita
    const jaFavorita = await queryOne(
      'SELECT id FROM favorite_beaches WHERE user_id = $1 AND beach_id = $2',
      [user.id, beach_id]
    );

    if (jaFavorita) {
      res.status(409).json({ error: 'Praia já está nos favoritos' });
      return;
    }

    await query(
      'INSERT INTO favorite_beaches (id, user_id, beach_id) VALUES ($1, $2, $3)',
      [uuidv4(), user.id, beach_id]
    );

    res.status(201).json({ mensagem: 'Praia adicionada aos favoritos' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/users/me/favorites/:beach_id — remove praia dos favoritos
export async function removeFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { beach_id } = req.params;

    const resultado = await query(
      'DELETE FROM favorite_beaches WHERE user_id = $1 AND beach_id = $2',
      [user.id, beach_id]
    );

    if ((resultado as unknown as unknown[]).length === 0) {
      throw createError('Favorito não encontrado', 404);
    }

    res.json({ mensagem: 'Praia removida dos favoritos' });
  } catch (err) {
    next(err);
  }
}
