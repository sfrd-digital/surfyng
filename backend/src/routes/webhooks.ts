// Rotas de webhooks externos — raw body obrigatório (configurado no app.ts)
import { Router } from 'express';
import { handleWebhook } from '../controllers/stripeController';

const router = Router();

// POST /api/v1/webhooks/stripe
// Recebe eventos do Stripe. NÃO aplicar authMiddleware aqui — a autenticação é via assinatura HMAC.
router.post('/stripe', handleWebhook);

export default router;
