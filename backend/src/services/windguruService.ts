// Serviço de integração com a API do Windguru
// Busca condições de vento e ondulação em tempo real por estação
import axios from 'axios';
import { getCache, setCache, CACHE_TTL_SECONDS } from '../config/redis';

// Dados brutos retornados pela API do Windguru
interface WindguruResponse {
  fcst?: {
    WINDSPD?: number[];       // velocidade do vento em nós
    WINDDIRNAME?: string[];   // direção do vento (ex: "NE", "Sul")
    SHWW?: number[];          // altura da ondulação em metros
    DIRPW?: number[];         // direção da ondulação em graus
    PERPW?: number[];         // período da ondulação em segundos
    TMP?: number[];           // temperatura do ar em °C
    SST?: number[];           // temperatura da superfície do mar em °C
  };
}

// Condições processadas e normalizadas
export interface WindConditions {
  wind_speed: number | null;
  wind_direction: string | null;
  swell_height: number | null;
  swell_direction: string | null;
  swell_period: number | null;
  air_temp_c: number | null;
  water_temp_c: number | null;
}

// Converte graus em nome de direção cardinal
function grausParaDirecao(graus: number): string {
  const direcoes = [
    'Norte', 'NNE', 'NE', 'ENE',
    'Leste', 'ESE', 'SE', 'SSE',
    'Sul', 'SSW', 'SW', 'WSW',
    'Oeste', 'WNW', 'NW', 'NNW',
  ];
  const indice = Math.round(graus / 22.5) % 16;
  return direcoes[indice];
}

// Busca condições atuais de uma estação Windguru
// Usa cache Redis de 30 minutos para evitar requisições excessivas
export async function buscarCondicoesWindguru(
  stationId: number
): Promise<WindConditions | null> {
  const chaveCache = `windguru:station:${stationId}`;

  // Tenta o cache primeiro
  const cached = await getCache<WindConditions>(chaveCache);
  if (cached) {
    console.log(`[Windguru] Cache hit para estação ${stationId}`);
    return cached;
  }

  try {
    console.log(`[Windguru] Buscando condições da estação ${stationId}`);

    const resposta = await axios.get<WindguruResponse>(
      'https://www.windguru.cz/int/iapi.php',
      {
        params: {
          uid: stationId,
          q: 'forecast',
          format: 'json',
        },
        headers: {
          // Referer necessário para a API do Windguru aceitar a requisição
          Referer: 'https://www.windguru.cz/',
          'User-Agent': 'Surfyng/1.0 (surf conditions app)',
        },
        timeout: 10000, // 10 segundos
      }
    );

    const fcst = resposta.data?.fcst;
    if (!fcst) {
      console.warn(`[Windguru] Resposta sem dados de forecast para estação ${stationId}`);
      return null;
    }

    // Usa o índice 0 = condição atual (primeiro slot de previsão)
    const direcaoGraus = fcst.DIRPW?.[0];
    const direcaoNome = direcaoGraus !== undefined
      ? grausParaDirecao(direcaoGraus)
      : null;

    const condicoes: WindConditions = {
      wind_speed:      fcst.WINDSPD?.[0]    ?? null,
      wind_direction:  fcst.WINDDIRNAME?.[0] ?? null,
      swell_height:    fcst.SHWW?.[0]        ?? null,
      swell_direction: direcaoNome,
      swell_period:    fcst.PERPW?.[0]       ?? null,
      air_temp_c:      fcst.TMP?.[0]         ?? null,
      water_temp_c:    fcst.SST?.[0]         ?? null,
    };

    // Salva no cache por 30 minutos
    await setCache(chaveCache, condicoes, CACHE_TTL_SECONDS);
    console.log(`[Windguru] Condições salvas no cache para estação ${stationId}`);

    return condicoes;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(
        `[Windguru] Erro na requisição para estação ${stationId}:`,
        err.response?.status,
        err.message
      );
    } else {
      console.error(`[Windguru] Erro inesperado para estação ${stationId}:`, err);
    }
    return null;
  }
}
