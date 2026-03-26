// Rotas de notificações
import { Router } from 'express';
import { authMiddleware, requireUser } from '../middleware/auth';
import {
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
} from '../controllers/notificationsController';

const router = Router();

// Todas as rotas de notificações exigem autenticação
router.use(authMiddleware, requireUser);

// GET   /api/v1/notifications?apenas_nao_lidas=true&limit=30&offset=0
router.get('/', listarNotificacoes);

// PATCH /api/v1/notifications/read-all — deve vir antes de /:id
router.patch('/read-all', marcarTodasComoLidas);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', marcarComoLida);

export default router;
