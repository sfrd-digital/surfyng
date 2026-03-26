// Serviço de alertas — verifica condições ativas e gera notificações quando o score é atingido
import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface AlertaAtivo {
  id: string;
  user_id: string;
  beach_id: string;
  min_score: number;
  beach_name: string;
  push_token: string | null;
}

interface CondicaoAtual {
  score: number;
  swell_height: number | null;
  wind_direction: string | null;
}

// Verifica todos os alertas ativos e cria notificações para os que atingiram o score mínimo.
// Chamada pelo cron job a cada 30 minutos (alinhado ao TTL do cache Windguru).
export async function verificarAlertas(): Promise<void> {
  console.log('[Alertas] Iniciando verificação de alertas ativos...');

  const alertas = await query<AlertaAtivo>(
    `SELECT
       ap.id, ap.user_id, ap.beach_id, ap.min_score,
       b.name AS beach_name,
       u.push_token
     FROM alert_preferences ap
     JOIN beaches b ON b.id = ap.beach_id
     JOIN users   u ON u.id = ap.user_id
     WHERE ap.active = true`
  );

  if (alertas.length === 0) {
    console.log('[Alertas] Nenhum alerta ativo encontrado.');
    return;
  }

  console.log(`[Alertas] Verificando ${alertas.length} alerta(s)...`);
  let disparados = 0;

  for (const alerta of alertas) {
    // Busca condições válidas no cache do banco
    const condicao = await queryOne<CondicaoAtual>(
      `SELECT score, swell_height, wind_direction
       FROM conditions_cache
       WHERE beach_id = $1 AND expires_at > NOW()
       ORDER BY fetched_at DESC
       LIMIT 1`,
      [alerta.beach_id]
    );

    if (!condicao || condicao.score < alerta.min_score) continue;

    // Evita spam: só dispara se não houver notificação de alerta nas últimas 2 horas
    const jaNotificado = await queryOne(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND beach_id = $2 AND type = 'alert'
         AND created_at > NOW() - INTERVAL '2 hours'`,
      [alerta.user_id, alerta.beach_id]
    );

    if (jaNotificado) continue;

    // Monta o conteúdo da notificação
    const alturaTexto = condicao.swell_height
      ? `Ondas de ${(condicao.swell_height * 3.281).toFixed(1)} pés`
      : 'Condições ideais';

    const titulo = `🏄 ${alerta.beach_name} está boa!`;
    const corpo = `${alturaTexto} · Score ${condicao.score}/10 · Vento ${condicao.wind_direction ?? 'n/d'}`;

    await query(
      `INSERT INTO notifications (id, user_id, beach_id, title, body, type)
       VALUES ($1, $2, $3, $4, $5, 'alert')`,
      [uuidv4(), alerta.user_id, alerta.beach_id, titulo, corpo]
    );

    disparados++;
    console.log(
      `[Alertas] Notificação criada para usuário ${alerta.user_id} — ${alerta.beach_name} (score ${condicao.score})`
    );

    // TODO Fase 3: enviar push via Expo Push API usando alerta.push_token
  }

  console.log(`[Alertas] Verificação concluída. ${disparados} notificação(ões) gerada(s).`);
}
