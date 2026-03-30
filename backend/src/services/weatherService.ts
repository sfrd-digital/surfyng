// Serviço meteorológico usando Open-Meteo — sem API key, 100% gratuito
// Marine API: ondas, swell e mar   |   Weather API: temperatura do ar e vento atual
import axios from 'axios';
import { getCache, setCache, CACHE_TTL_SECONDS } from '../config/redis';

// Resposta da Marine API do Open-Meteo (dados horários)
interface MarineResponse {
  hourly?: {
    time?: string[];
    swell_wave_height?: number[];
    swell_wave_direction?: number[];
    swell_wave_period?: number[];
  };
}

// Resposta da Weather API do Open-Meteo (dados correntes)
interface WeatherResponse {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
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
  // Open-Meteo não fornece temperatura da água — sempre null; banco usa water_temp_summer/winter_c
  water_temp_c: number | null;
}

// Converte graus em nome de direção cardinal em português
function grausParaDirecao(graus: number): string {
  const direcoes = [
    'Norte', 'NNE', 'NE', 'ENE',
    'Leste', 'ESE', 'SE', 'SSE',
    'Sul',   'SSW', 'SW', 'WSW',
    'Oeste', 'WNW', 'NW', 'NNW',
  ];
  const indice = Math.round(graus / 22.5) % 16;
  return direcoes[indice];
}

// Retorna o índice do slot horário mais próximo do momento atual
function indiceMaisProximo(times: string[]): number {
  const agora = Date.now();
  let melhorIdx = 0;
  let menorDif = Infinity;
  for (let i = 0; i < times.length; i++) {
    const dif = Math.abs(new Date(times[i]).getTime() - agora);
    if (dif < menorDif) {
      menorDif = dif;
      melhorIdx = i;
    }
  }
  return melhorIdx;
}

// Busca condições atuais em paralelo:
//   - Marine API (open-meteo.com): swell, ondas
//   - Weather API (open-meteo.com): vento e temperatura do ar
// Cache Redis de 30 minutos por coordenada
export async function buscarCondicoesOpenMeteo(
  lat: number,
  lng: number
): Promise<WindConditions | null> {
  const latNum = parseFloat(String(lat));
  const lngNum = parseFloat(String(lng));

  // Chave de cache arredondada para 4 casas — evita miss por floating point
  const chaveCache = `openmeteo:${latNum.toFixed(4)}:${lngNum.toFixed(4)}`;

  const cached = await getCache<WindConditions>(chaveCache);
  if (cached) {
    console.log(`[OpenMeteo] Cache hit para ${latNum},${lngNum}`);
    return cached;
  }

  try {
    console.log(`[OpenMeteo] Buscando condições para ${latNum},${lngNum}`);

    // Chamadas sequenciais com delay para evitar erro 429 (rate limit Open-Meteo)
    const marineRes = await axios.get<MarineResponse>(
      'https://marine-api.open-meteo.com/v1/marine',
      {
        params: {
          latitude: latNum,
          longitude: lngNum,
          hourly: [
            'wave_height',
            'wave_direction',
            'wave_period',
            'swell_wave_height',
            'swell_wave_direction',
            'swell_wave_period',
            'wind_wave_height',
            'wind_wave_direction',
          ].join(','),
          wind_speed_unit: 'kn',
          timezone: 'America/Sao_Paulo',
        },
        timeout: 10000,
      }
    );

    await new Promise(r => setTimeout(r, 200));

    const weatherRes = await axios.get<WeatherResponse>(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude: latNum,
          longitude: lngNum,
          current: 'temperature_2m,wind_speed_10m,wind_direction_10m',
          wind_speed_unit: 'kn',
          timezone: 'America/Sao_Paulo',
        },
        timeout: 10000,
      }
    );

    const hourly  = marineRes.data?.hourly;
    const current = weatherRes.data?.current;

    // Slot horário mais próximo do agora nos dados Marine
    const idx = hourly?.time ? indiceMaisProximo(hourly.time) : 0;

    const swellDirGraus = hourly?.swell_wave_direction?.[idx];
    const windDirGraus  = current?.wind_direction_10m;

    const condicoes: WindConditions = {
      wind_speed:      current?.wind_speed_10m            ?? null,
      wind_direction:  windDirGraus  !== undefined ? grausParaDirecao(windDirGraus)  : null,
      swell_height:    hourly?.swell_wave_height?.[idx]   ?? null,
      swell_direction: swellDirGraus !== undefined ? grausParaDirecao(swellDirGraus) : null,
      swell_period:    hourly?.swell_wave_period?.[idx]   ?? null,
      air_temp_c:      current?.temperature_2m            ?? null,
      water_temp_c:    null,
    };

    // Salva no cache por 30 minutos
    await setCache(chaveCache, condicoes, CACHE_TTL_SECONDS);
    console.log(`[OpenMeteo] Condições salvas no cache para ${latNum},${lngNum}`);

    return condicoes;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(
        `[OpenMeteo] Erro na requisição para ${latNum},${lngNum}:`,
        err.response?.status,
        err.message
      );
    } else {
      console.error(`[OpenMeteo] Erro inesperado para ${latNum},${lngNum}:`, err);
    }
    return null;
  }
}
