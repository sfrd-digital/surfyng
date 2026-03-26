// Rotas de praias
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listarPraias,
  praiasPorProximidade,
  detalhesPraia,
  atualizarCondicoes,
} from '../controllers/beachesController';

const router = Router();

// Auth opcional em todas as rotas — permite personalizar score/roupa quando autenticado
router.use(authMiddleware);

// GET /api/v1/beaches?state=SC&difficulty=medium&limit=20&offset=0
router.get('/', listarPraias);

// GET /api/v1/beaches/nearby?lat=-27.6&lng=-48.4&raio_km=50&limit=20
// IMPORTANTE: deve vir antes de /:id para não conflitar
router.get('/nearby', praiasPorProximidade);

// GET /api/v1/beaches/:id
router.get('/:id', detalhesPraia);

// GET /api/v1/beaches/:id/conditions — força atualização da Windguru
router.get('/:id/conditions', atualizarCondicoes);

export default router;
