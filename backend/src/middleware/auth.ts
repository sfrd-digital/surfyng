// Middleware de autenticação — verifica o token JWT do Firebase
import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { queryOne } from '../config/database';
import { User } from '../types';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Extrai o token do header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente ou inválido' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verifica o token com o Firebase
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;

    // Busca o usuário no banco de dados
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (user) {
      req.user = user;
    }

    next();
  } catch (err) {
    console.error('[Auth] Falha na verificação do token:', err);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Middleware que exige que o usuário já exista no banco (após /auth/verify)
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(403).json({ error: 'Usuário não encontrado. Faça o login novamente.' });
    return;
  }
  next();
}
