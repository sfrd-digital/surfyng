// Serviço de praias — scoring, recomendação de roupa e gerenciamento de cache de condições
import { Beach, ConditionsCache, ColdTolerance } from '../types';
import { WindConditions, buscarCondicoesWindguru } from './windguruService';
import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Normaliza string de direção para comparação case-insensitive sem acentos
function normalizarDirecao(dir: string): string {
  return dir
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Verifica se a direção das condições bate com alguma direção favorável da praia
function direcaoCompativel(direcaoCondicoes: string, direcoesPraia: string[]): boolean {
  const norm = normalizarDirecao(direcaoCondicoes);
  return direcoesPraia.some((d) => {
    const normD = normalizarDirecao(d);
    return normD === norm || normD.includes(norm) || norm.includes(normD);
  });
}

// Calcula o score da praia (0–10) com base nas condições atuais
// Pesos: altura do swell (4) + direção do swell (3) + vento favorável (2) + intensidade do vento (1)
export function calcularScore(beach: Beach, condicoes: WindConditions): number {
  let score = 0;

  // 1. Altura da ondulação — peso 4
  if (condicoes.swell_height !== null) {
    const alturaFt = condicoes.swell_height * 3.281; // metros → pés
    const min = beach.min_size_feet ?? 1;
    const max = beach.max_size_feet ?? 15;
    if (alturaFt >= min && alturaFt <= max) {
      score += 4; // dentro do range ideal
    } else if (alturaFt >= min * 0.5 && alturaFt <= max * 1.5) {
      score += 2; // fora do ideal mas ainda surfável
    }
    // else: fora demais → 0 pontos
  } else {
    score += 2; // sem dados: pontuação neutra
  }

  // 2. Direção do swell — peso 3
  if (condicoes.swell_direction && beach.swell_directions.length > 0) {
    score += direcaoCompativel(condicoes.swell_direction, beach.swell_directions) ? 3 : 0;
  } else {
    score += 1.5; // sem dados: neutro
  }

  // 3. Vento na direção favorável — peso 2
  if (condicoes.wind_direction && beach.wind_directions.length > 0) {
    score += direcaoCompativel(condicoes.wind_direction, beach.wind_directions) ? 2 : 0;
  } else {
    score += 1; // sem dados: neutro
  }

  // 4. Intensidade do vento (5–25 nós é ideal para surf) — peso 1
  if (condicoes.wind_speed !== null) {
    score += condicoes.wind_speed >= 5 && condicoes.wind_speed <= 25 ? 1 : 0;
  } else {
    score += 0.5; // sem dados: neutro
  }

  return Math.round(Math.min(10, score) * 10) / 10;
}

// Recomenda roupa de neoprene baseada na temperatura da água e tolerância ao frio do usuário
export function recomendarRoupa(
  tempAgua: number | null,
  tolerancia: ColdTolerance = 'normal'
): string {
  if (tempAgua === null) return 'Dados indisponíveis';

  // Sensitive sente +2°C de frio, resistant aguenta -2°C a mais
  const ajuste = tolerancia === 'sensitive' ? 2 : tolerancia === 'resistant' ? -2 : 0;
  const tempEfetiva = tempAgua - ajuste;

  if (tempEfetiva >= 26) return 'Sem roupa / Lycra';
  if (tempEfetiva >= 23) return 'Lycra ou top 1mm';
  if (tempEfetiva >= 20) return 'Shortinho 2/2mm';
  if (tempEfetiva >= 17) return 'Wetsuit 3/2mm';
  if (tempEfetiva >= 14) return 'Wetsuit 4/3mm';
  return 'Wetsuit 5/4mm + capuz';
}

// Retorna temperatura da água baseada na estação do ano (fallback quando a API não fornece)
function tempAguaFallback(beach: Beach): number | null {
  // Meses 4–9 (abril–setembro) = inverno no hemisfério sul
  const mesAtual = new Date().getMonth(); // 0-based
  const isInverno = mesAtual >= 3 && mesAtual <= 8;
  return isInverno ? beach.water_temp_winter_c : beach.water_temp_summer_c;
}

// Busca condições válidas do cache do banco (expira a cada 30 min)
export async function buscarCondicoesCache(beachId: string): Promise<ConditionsCache | null> {
  return queryOne<ConditionsCache>(
    `SELECT * FROM conditions_cache
     WHERE beach_id = $1 AND expires_at > NOW()
     ORDER BY fetched_at DESC
     LIMIT 1`,
    [beachId]
  );
}

// Resultado das condições processadas para retornar ao cliente
export interface CondicoesProcessadas {
  wind_speed: number | null;
  wind_direction: string | null;
  swell_height: number | null;
  swell_direction: string | null;
  swell_period: number | null;
  water_temp_c: number | null;
  air_temp_c: number | null;
  score: number;
  roupa: string;
  cache_expira_em: Date;
}

// Busca condições da Windguru (com cache Redis) e persiste no banco.
// Retorna as condições processadas ou null se não for possível obter.
export async function buscarOuFetchCondicoes(
  beach: Beach,
  tolerancia: ColdTolerance = 'normal'
): Promise<CondicoesProcessadas | null> {
  if (!beach.windguru_station_id) return null;

  const condicoes = await buscarCondicoesWindguru(beach.windguru_station_id);
  if (!condicoes) return null;

  const score = calcularScore(beach, condicoes);
  const tempAgua = condicoes.water_temp_c ?? tempAguaFallback(beach);
  const roupa = recomendarRoupa(tempAgua, tolerancia);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

  // Substitui a entrada antiga no cache do banco
  await query('DELETE FROM conditions_cache WHERE beach_id = $1', [beach.id]);

  await query(
    `INSERT INTO conditions_cache
       (id, beach_id, wind_speed, wind_direction, swell_height, swell_direction,
        swell_period, water_temp_c, air_temp_c, wetsuit_recommendation, score, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      uuidv4(),
      beach.id,
      condicoes.wind_speed,
      condicoes.wind_direction,
      condicoes.swell_height,
      condicoes.swell_direction,
      condicoes.swell_period,
      tempAgua,
      condicoes.air_temp_c,
      roupa,
      score,
      expiresAt,
    ]
  );

  return {
    wind_speed:      condicoes.wind_speed,
    wind_direction:  condicoes.wind_direction,
    swell_height:    condicoes.swell_height,
    swell_direction: condicoes.swell_direction,
    swell_period:    condicoes.swell_period,
    water_temp_c:    tempAgua,
    air_temp_c:      condicoes.air_temp_c,
    score,
    roupa,
    cache_expira_em: expiresAt,
  };
}

// Converte linha do conditions_cache para CondicoesProcessadas (recalcula roupa por tolerância)
export function processarCacheCondicoes(
  cache: ConditionsCache,
  tolerancia: ColdTolerance = 'normal'
): CondicoesProcessadas & { score: number } {
  // pg retorna colunas DECIMAL como string — converte para number antes de retornar
  const waterTemp = cache.water_temp_c !== null ? Number(cache.water_temp_c) : null;
  const roupa = recomendarRoupa(waterTemp, tolerancia);
  return {
    wind_speed:      cache.wind_speed    !== null ? Number(cache.wind_speed)    : null,
    wind_direction:  cache.wind_direction,
    swell_height:    cache.swell_height  !== null ? Number(cache.swell_height)  : null,
    swell_direction: cache.swell_direction,
    swell_period:    cache.swell_period,
    water_temp_c:    waterTemp,
    air_temp_c:      cache.air_temp_c    !== null ? Number(cache.air_temp_c)    : null,
    score:           Number(cache.score) || 0,
    roupa,
    cache_expira_em: cache.expires_at,
  };
}
