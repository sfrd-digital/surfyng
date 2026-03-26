// Rotas de usuários
import { Router } from 'express';
import { authMiddleware, requireUser } from '../middleware/auth';
import { getMe, updateMe, addFavorite, removeFavorite } from '../controllers/usersController';

const router = Router();

// Todas as rotas de usuário exigem autenticação e usuário cadastrado
router.use(authMiddleware, requireUser);

// GET  /api/v1/users/me — perfil completo
router.get('/me', getMe);

// PUT  /api/v1/users/me — atualizar perfil
router.put('/me', updateMe);

// POST /api/v1/users/me/favorites/:beach_id — adicionar favorita
router.post('/me/favorites/:beach_id', addFavorite);

// DELETE /api/v1/users/me/favorites/:beach_id — remover favorita
router.delete('/me/favorites/:beach_id', removeFavorite);

export default router;
