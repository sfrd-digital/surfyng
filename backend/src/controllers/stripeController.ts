// Controller Stripe — checkout, portal do cliente e webhook
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { stripe, PRECOS_STRIPE, priceIdParaPlano } from '../config/stripe';
import { query, queryOne } from '../config/database';
import { User } from '../types';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// ─── Schema ──────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  plano: z.enum(['pro', 'global']),
});

// ─── Helpers internos ─────────────────────────────────────────────────────────

// Garante que o usuário tem um customer_id no Stripe.
// Se não tiver, cria um novo customer e salva no banco.
async function garantirStripeCustomer(user: User): Promise<string> {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await stripe.customers.create({
    email:    user.email ?? undefined,
    name:     user.name ?? undefined,
    metadata: { user_id: user.id },
  });

  await query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, user.id]
  );

  console.log(`[Stripe] Customer criado: ${customer.id} para usuário ${user.id}`);
  return customer.id;
}

// Atualiza o plano do usuário no banco e cria registro em subscriptions
async function atualizarPlanoUsuario(
  userId: string,
  plano: 'pro' | 'global' | 'free',
  stripeSubscriptionId: string | null,
  sessionId: string | null,
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' = 'active'
): Promise<void> {
  await query('UPDATE users SET plan = $1 WHERE id = $2', [plano, userId]);

  await query(
    `INSERT INTO subscriptions
       (id, user_id, plan, stripe_subscription_id, stripe_checkout_session_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), userId, plano, stripeSubscriptionId, sessionId, status]
  );

  console.log(`[Stripe] Plano atualizado para ${plano} — usuário ${userId}`);
}

// ─── Controllers ─────────────────────────────────────────────────────────────

// POST /api/v1/stripe/checkout
// Cria uma Stripe Checkout Session e retorna a URL para o app abrir no browser.
export async function criarCheckout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { plano } = checkoutSchema.parse(req.body);

    if (user.plan === plano) {
      res.status(409).json({ error: `Você já possui o plano ${plano}` });
      return;
    }

    const customerId = await garantirStripeCustomer(user);
    const priceId = PRECOS_STRIPE[plano];

    if (!priceId) {
      throw createError(`Price ID para o plano "${plano}" não configurado`, 500);
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  process.env.STRIPE_CANCEL_URL,
      // Usado no webhook para identificar o usuário sem depender de metadados
      client_reference_id: user.id,
      metadata: { user_id: user.id, plano },
      subscription_data: {
        metadata: { user_id: user.id, plano },
      },
    });

    console.log(`[Stripe] Checkout criado: ${session.id} — ${user.id} → plano ${plano}`);
    res.json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/stripe/portal
// Cria uma sessão do Customer Portal (gerenciar/cancelar assinatura).
export async function abrirPortal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    if (!user.stripe_customer_id) {
      res.status(422).json({ error: 'Nenhuma assinatura encontrada para este usuário' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripe_customer_id,
      return_url: process.env.STRIPE_PORTAL_RETURN_URL,
    });

    res.json({ portal_url: session.url });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/webhooks/stripe
// Recebe e processa eventos do Stripe. Usa raw body para validar a assinatura.
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig!, secret);
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Assinatura inválida';
    console.error('[Stripe Webhook] Falha na verificação de assinatura:', mensagem);
    res.status(400).json({ error: `Webhook inválido: ${mensagem}` });
    return;
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);

  try {
    switch (event.type) {

      // Pagamento do checkout concluído com sucesso
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.client_reference_id;
        const plano   = session.metadata?.plano as 'pro' | 'global' | undefined;

        if (!userId || !plano) {
          console.warn('[Stripe Webhook] checkout.session.completed sem user_id ou plano nos metadados');
          break;
        }

        // Busca o subscription_id gerado pelo checkout
        let subscriptionId: string | null = null;
        if (typeof session.subscription === 'string') {
          subscriptionId = session.subscription;
        }

        await atualizarPlanoUsuario(userId, plano, subscriptionId, session.id);
        break;
      }

      // Assinatura cancelada (pelo cliente no portal ou via dashboard)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId   = subscription.customer as string;

        const usuario = await queryOne<User>(
          'SELECT * FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (!usuario) {
          console.warn(`[Stripe Webhook] Usuário não encontrado para customer ${customerId}`);
          break;
        }

        await query('UPDATE users SET plan = $1 WHERE id = $2', ['free', usuario.id]);
        await query(
          `UPDATE subscriptions SET status = 'canceled', ends_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );

        console.log(`[Stripe Webhook] Assinatura cancelada — usuário ${usuario.id} voltou para free`);
        break;
      }

      // Assinatura atualizada (upgrade, downgrade ou renovação)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId   = subscription.customer as string;

        const usuario = await queryOne<User>(
          'SELECT * FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (!usuario) break;

        // Determina o plano atual pelo price ID do primeiro item da assinatura
        const priceId = subscription.items.data[0]?.price.id;
        const plano   = priceId ? priceIdParaPlano(priceId) : null;

        if (plano) {
          await query('UPDATE users SET plan = $1 WHERE id = $2', [plano, usuario.id]);
          await query(
            'UPDATE subscriptions SET plan = $1 WHERE stripe_subscription_id = $2',
            [plano, subscription.id]
          );
          console.log(`[Stripe Webhook] Plano atualizado para ${plano} — usuário ${usuario.id}`);
        }
        break;
      }

      // Cobrança falhou (cartão recusado, saldo insuficiente etc.)
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const usuario = await queryOne<User>(
          'SELECT * FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (!usuario) break;

        await query(
          `UPDATE subscriptions SET status = 'past_due'
           WHERE user_id = $1 AND status = 'active'`,
          [usuario.id]
        );

        console.warn(`[Stripe Webhook] Pagamento falhou — usuário ${usuario.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
    }

    res.json({ recebido: true });
  } catch (err) {
    console.error('[Stripe Webhook] Erro ao processar evento:', err);
    // Retorna 200 para o Stripe não reenviar — o erro foi nosso, não do payload
    res.json({ recebido: true, erro: 'Falha no processamento interno' });
  }
}
