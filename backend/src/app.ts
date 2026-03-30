// Ponto de entrada do servidor Surfyng
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import beachesRoutes from './routes/beaches';
import postsRoutes from './routes/posts';
import alertsRoutes from './routes/alerts';
import notificationsRoutes from './routes/notifications';
import stripeRoutes from './routes/stripe';
import webhooksRoutes from './routes/webhooks';
// ⚠️  REMOVER ANTES DE IR PARA PRODUÇÃO
import testRoutes from './routes/test';
import { errorHandler } from './middleware/errorHandler';
import { pool } from './config/database';
import { redis } from './config/redis';
import { verificarAlertas } from './services/alertsService';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Segurança e logging
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Body parser — exceto para o webhook Stripe (precisa do raw body)
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servico: 'Surfyng API', versao: '1.0.0' });
});

// Rotas da API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/beaches', beachesRoutes);
app.use('/api/v1/posts', postsRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
// ⚠️  REMOVER ANTES DE IR PARA PRODUÇÃO
app.use('/api/v1/test', testRoutes);

// Middleware global de erros (deve ser o último)
app.use(errorHandler);

// Inicializa o servidor após confirmar conexões
async function iniciar(): Promise<void> {
  try {
    // Testa conexão com o banco
    await pool.query('SELECT 1');
    console.log('[DB] PostgreSQL conectado com sucesso');

    // Testa conexão com Redis
    await redis.connect();
    console.log('[Redis] Redis conectado com sucesso');

    app.listen(PORT, () => {
      console.log(`[Servidor] Surfyng API rodando na porta ${PORT}`);
      console.log(`[Servidor] Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
    });

    // Cron interno: verifica alertas a cada 30 minutos (alinhado ao TTL do cache Windguru).
    // Em modo cluster PM2, só o worker 0 executa o cron para evitar disparos duplicados.
    const pmId = process.env['pm_id'];
    const isCronWorker = pmId === undefined || pmId === '0';

    if (isCronWorker) {
      const INTERVALO_ALERTAS_MS = 30 * 60 * 1000;
      setInterval(() => {
        verificarAlertas().catch((err) =>
          console.error('[Alertas] Erro na verificação periódica:', err)
        );
      }, INTERVALO_ALERTAS_MS);
      console.log('[Alertas] Cron de verificação configurado (intervalo: 30 min)');
    }
  } catch (err) {
    console.error('[Servidor] Falha ao iniciar:', err);
    process.exit(1);
  }
}

// Em modo de teste (Jest), o servidor não sobe automaticamente
if (process.env.NODE_ENV !== 'test') {
  iniciar();
}

export default app;
