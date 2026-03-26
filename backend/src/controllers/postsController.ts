// Controller de posts — feed da comunidade, criação, likes e deleção
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne, withTransaction } from '../config/database';
import { Post } from '../types';
import { createError } from '../middleware/errorHandler';
import { buscarCondicoesCache } from '../services/beachesService';
import { v4 as uuidv4 } from 'uuid';

// ─── Schemas de validação ────────────────────────────────────────────────────

const criarPostSchema = z.object({
  beach_id:           z.string().uuid(),
  rating:             z.number().int().min(1).max(5),
  text:               z.string().max(1000).optional(),
  photos:             z.array(z.string().url()).max(5).default([]),
  incluir_condicoes:  z.boolean().default(false),
});

const feedSchema = z.object({
  beach_id: z.string().uuid().optional(),
  user_id:  z.string().uuid().optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  offset:   z.coerce.number().int().min(0).default(0),
});

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface PostComDetalhes extends Post {
  autor_nome:     string | null;
  autor_foto:     string | null;
  autor_nivel:    string;
  praia_nome:     string;
  praia_cidade:   string | null;
  praia_estado:   string | null;
  curtido_por_mim: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarPost(p: PostComDetalhes) {
  return {
    id:         p.id,
    rating:     p.rating,
    texto:      p.text,
    fotos:      p.photos,
    likes:      p.likes_count,
    curtido:    p.curtido_por_mim,
    criado_em:  p.created_at,
    condicoes_snapshot: p.conditions_snapshot,
    autor: {
      id:     p.user_id,
      nome:   p.autor_nome,
      foto:   p.autor_foto,
      nivel:  p.autor_nivel,
    },
    praia: {
      id:     p.beach_id,
      nome:   p.praia_nome,
      cidade: p.praia_cidade,
      estado: p.praia_estado,
    },
  };
}

// Query base do feed — junta posts com dados do autor e da praia
function queryFeed(userId: string | null) {
  return `
    SELECT
      p.*,
      u.name         AS autor_nome,
      u.photo_url    AS autor_foto,
      u.level        AS autor_nivel,
      b.name         AS praia_nome,
      b.city         AS praia_cidade,
      b.state        AS praia_estado,
      EXISTS(
        SELECT 1 FROM post_likes pl
        WHERE pl.post_id = p.id AND pl.user_id = ${userId ? `'${userId}'` : 'NULL'}
      ) AS curtido_por_mim
    FROM posts p
    JOIN users   u ON u.id = p.user_id
    JOIN beaches b ON b.id = p.beach_id
  `;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

// GET /api/v1/posts?beach_id=X&user_id=Y&limit=20&offset=0
// Feed geral, filtrável por praia ou por usuário.
export async function listarPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { beach_id, user_id, limit, offset } = feedSchema.parse(req.query);
    const meId = req.user?.id ?? null;

    const filtros: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (beach_id) {
      filtros.push(`p.beach_id = $${idx++}`);
      params.push(beach_id);
    }
    if (user_id) {
      filtros.push(`p.user_id = $${idx++}`);
      params.push(user_id);
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    params.push(limit, offset);

    // Evita injeção SQL: meId é null ou UUID vindo do banco (não do usuário)
    const posts = await query<PostComDetalhes>(
      `${queryFeed(meId)} ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    const [{ total }] = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM posts p ${where}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      total: Number(total),
      limit,
      offset,
      posts: posts.map(formatarPost),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/posts/:id
// Detalhes de um post específico.
export async function detalhePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const meId = req.user?.id ?? null;

    const post = await queryOne<PostComDetalhes>(
      `${queryFeed(meId)} WHERE p.id = $1`,
      [id]
    );

    if (!post) throw createError('Post não encontrado', 404);

    res.json(formatarPost(post));
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/posts
// Cria um novo post de sessão de surf.
// Se incluir_condicoes = true, salva um snapshot das condições atuais da praia.
export async function criarPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const dados = criarPostSchema.parse(req.body);

    // Verifica se a praia existe
    const praia = await queryOne('SELECT id FROM beaches WHERE id = $1', [dados.beach_id]);
    if (!praia) throw createError('Praia não encontrada', 404);

    // Snapshot opcional das condições atuais
    let snapshot: Record<string, unknown> | null = null;
    if (dados.incluir_condicoes) {
      const cache = await buscarCondicoesCache(dados.beach_id);
      if (cache) {
        snapshot = {
          wind_speed:      cache.wind_speed,
          wind_direction:  cache.wind_direction,
          swell_height:    cache.swell_height,
          swell_direction: cache.swell_direction,
          swell_period:    cache.swell_period,
          water_temp_c:    cache.water_temp_c,
          air_temp_c:      cache.air_temp_c,
          score:           cache.score,
          capturado_em:    cache.fetched_at,
        };
      }
    }

    const [post] = await query<Post>(
      `INSERT INTO posts (id, user_id, beach_id, rating, text, photos, conditions_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        uuidv4(),
        user.id,
        dados.beach_id,
        dados.rating,
        dados.text ?? null,
        dados.photos,
        snapshot ? JSON.stringify(snapshot) : null,
      ]
    );

    console.log(`[Posts] Novo post criado: ${post.id} por ${user.id} na praia ${dados.beach_id}`);
    res.status(201).json({ mensagem: 'Post criado com sucesso', post_id: post.id });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/posts/:id
// Remove um post — apenas o autor pode deletar o próprio post.
export async function deletarPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const post = await queryOne<Post>('SELECT * FROM posts WHERE id = $1', [id]);
    if (!post) throw createError('Post não encontrado', 404);

    if (post.user_id !== user.id) {
      throw createError('Sem permissão para deletar este post', 403);
    }

    // O CASCADE nas foreign keys remove post_likes automaticamente
    await query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ mensagem: 'Post removido com sucesso' });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/posts/:id/like
// Curte um post. Incrementa likes_count de forma atômica com transação.
export async function curtirPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const post = await queryOne<Post>('SELECT id FROM posts WHERE id = $1', [id]);
    if (!post) throw createError('Post não encontrado', 404);

    await withTransaction(async (client) => {
      // Insere o like — o UNIQUE (post_id, user_id) lança erro se já curtiu
      await client.query(
        'INSERT INTO post_likes (id, post_id, user_id) VALUES ($1, $2, $3)',
        [uuidv4(), id, user.id]
      );
      await client.query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
        [id]
      );
    });

    res.status(201).json({ mensagem: 'Post curtido' });
  } catch (err: unknown) {
    // Código 23505 = violação de UNIQUE (já curtiu)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      res.status(409).json({ error: 'Você já curtiu este post' });
      return;
    }
    next(err);
  }
}

// DELETE /api/v1/posts/:id/like
// Remove o like de um post. Decrementa likes_count de forma atômica.
export async function descurtirPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const post = await queryOne<Post>('SELECT id FROM posts WHERE id = $1', [id]);
    if (!post) throw createError('Post não encontrado', 404);

    await withTransaction(async (client) => {
      const resultado = await client.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [id, user.id]
      );

      if ((resultado as unknown as { rowCount: number }).rowCount === 0) {
        throw createError('Você não curtiu este post', 404);
      }

      // Garante que likes_count nunca fique negativo
      await client.query(
        'UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1',
        [id]
      );
    });

    res.json({ mensagem: 'Like removido' });
  } catch (err) {
    next(err);
  }
}
