// Controller de autenticação — verifica token Firebase e cria usuário se necessário
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { firebaseAuth } from '../config/firebase';
import { query, queryOne } from '../config/database';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Schema de validação do body
const verifySchema = z.object({
  push_token: z.string().optional(),
  language: z.string().max(5).optional(),
});

// POST /api/v1/auth/verify
// Verifica o token Firebase, cria o usuário no banco se for o primeiro acesso
export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticação ausente' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // verifyIdToken lança erro para tokens inválidos/expirados → retorna 401 diretamente
    let decodedToken;
    try {
      decodedToken = await firebaseAuth.verifyIdToken(token);
    } catch {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const body = verifySchema.parse(req.body);

    // Verifica se o usuário já existe no banco
    let user = await queryOne<User>(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (!user) {
      // Primeiro acesso — cria o usuário no banco
      const newId = uuidv4();
      const rows = await query<User>(
        `INSERT INTO users (id, firebase_uid, name, email, photo_url, push_token, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          newId,
          decodedToken.uid,
          decodedToken.name ?? null,
          decodedToken.email ?? null,
          decodedToken.picture ?? null,
          body.push_token ?? null,
          body.language ?? 'pt',
        ]
      );
      user = rows[0];
      console.log(`[Auth] Novo usuário criado: ${user.id} (${user.email})`);
    } else {
      // Atualiza push_token se fornecido
      if (body.push_token && body.push_token !== user.push_token) {
        await query(
          'UPDATE users SET push_token = $1 WHERE id = $2',
          [body.push_token, user.id]
        );
        user.push_token = body.push_token;
      }
      console.log(`[Auth] Login existente: ${user.id} (${user.email})`);
    }

    res.status(200).json({
      mensagem: 'Autenticação bem-sucedida',
      usuario: {
        id: user.id,
        nome: user.name,
        email: user.email,
        foto: user.photo_url,
        nivel: user.level,
        tolerancia_frio: user.cold_tolerance,
        plano: user.plan,
        idioma: user.language,
        criado_em: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}
