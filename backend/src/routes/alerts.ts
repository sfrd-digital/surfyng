// Rotas de alertas de condições
import { Router } from 'express';
import { authMiddleware, requireUser } from '../middleware/auth';
import {
  listarAlertas,
  criarAlerta,
  atualizarAlerta,
  removerAlerta,
} from '../controllers/alertsController';

const router = Router();

// Todas as rotas de alertas exigem autenticação
router.use(authMiddleware, requireUser);

// GET  /api/v1/alerts
router.get('/', listarAlertas);

// POST /api/v1/alerts
router.post('/', criarAlerta);

// PUT  /api/v1/alerts/:beach_id
router.put('/:beach_id', atualizarAlerta);

// DELETE /api/v1/alerts/:beach_id
router.delete('/:beach_id', removerAlerta);

export default router;
