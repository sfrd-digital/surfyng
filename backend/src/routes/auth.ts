// Rotas de autenticação
import { Router } from 'express';
import { verifyAuth } from '../controllers/authController';

const router = Router();

// POST /api/v1/auth/verify
// Verifica token Firebase, cria usuário se primeiro acesso
router.post('/verify', verifyAuth);

export default router;
