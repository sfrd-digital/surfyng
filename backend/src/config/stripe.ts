// Configuração do cliente Stripe
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

// Mapa de plano → price ID do Stripe (configurado no .env)
export const PRECOS_STRIPE: Record<'pro' | 'global', string> = {
  pro:    process.env.STRIPE_PRICE_PRO!,
  global: process.env.STRIPE_PRICE_GLOBAL!,
};

// Converte um price ID do Stripe de volta para o nome do plano
export function priceIdParaPlano(priceId: string): 'pro' | 'global' | null {
  if (priceId === process.env.STRIPE_PRICE_PRO)    return 'pro';
  if (priceId === process.env.STRIPE_PRICE_GLOBAL) return 'global';
  return null;
}
