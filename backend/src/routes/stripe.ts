// Rotas do Stripe — checkout e portal do cliente
import { Router } from 'express';
import { authMiddleware, requireUser } from '../middleware/auth';
import { criarCheckout, abrirPortal } from '../controllers/stripeController';

const router = Router();

// Ambas as rotas exigem usuário autenticado
router.use(authMiddleware, requireUser);

// POST /api/v1/stripe/checkout — inicia assinatura, retorna URL do checkout
router.post('/checkout', criarCheckout);

// POST /api/v1/stripe/portal — retorna URL do portal para gerenciar assinatura
router.post('/portal', abrirPortal);

export default router;
