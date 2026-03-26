// Rotas de posts — feed da comunidade
import { Router } from 'express';
import { authMiddleware, requireUser } from '../middleware/auth';
import {
  listarPosts,
  detalhePost,
  criarPost,
  deletarPost,
  curtirPost,
  descurtirPost,
} from '../controllers/postsController';

const router = Router();

// Leitura do feed: auth opcional (para saber se o usuário já curtiu)
router.get('/',    authMiddleware, listarPosts);
router.get('/:id', authMiddleware, detalhePost);

// Escrita: exige autenticação e usuário cadastrado
router.post('/',            authMiddleware, requireUser, criarPost);
router.delete('/:id',       authMiddleware, requireUser, deletarPost);
router.post('/:id/like',    authMiddleware, requireUser, curtirPost);
router.delete('/:id/like',  authMiddleware, requireUser, descurtirPost);

export default router;
