// Testes unitários do beachesService — scoring e recomendação de roupa
// Não dependem de banco, Redis ou Firebase
import { calcularScore, recomendarRoupa } from '../../services/beachesService';
import { Beach } from '../../types';

// ─── Fixture: praia de referência ────────────────────────────────────────────

const praiaBase: Beach = {
  id: 'uuid-test-1',
  name: 'Joaquina',
  city: 'Florianópolis',
  state: 'SC',
  country: 'BR',
  lat: -27.64,
  lng: -48.45,
  swell_directions: ['SE', 'NE'],
  wind_directions: ['NE', 'Oeste'],
  min_size_feet: 2,
  max_size_feet: 10,
  difficulty: 'medium',
  best_season: 'Outono – Inverno',
  consistency: 'high',
  crowd: 'intense',
  windguru_station_id: 64,
  water_temp_summer_c: 22,
  water_temp_winter_c: 14,
  description: null,
  created_at: new Date(),
};

// ─── calcularScore ────────────────────────────────────────────────────────────

describe('calcularScore', () => {

  test('condições perfeitas → score 10', () => {
    const condicoes = {
      wind_speed: 15,          // ideal (5–25 nós) → +1
      wind_direction: 'NE',    // favorável p/ Joaquina → +2
      swell_height: 1.8,       // 1.8m ≈ 6 pés (dentro do range 2–10) → +4
      swell_direction: 'SE',   // favorável → +3
      swell_period: 12,
      air_temp_c: 24,
      water_temp_c: 20,
    };

    const score = calcularScore(praiaBase, condicoes);
    expect(score).toBe(10);
  });

  test('swell fora do range ideal mas surfável → score intermediário', () => {
    const condicoes = {
      wind_speed: 15,        // +1
      wind_direction: 'NE',  // favorável → +2
      swell_height: 0.4,     // 1.3 pés — abaixo do mínimo (2 pés) mas dentro de 50% → +2
      swell_direction: 'SE', // +3
      swell_period: 8,
      air_temp_c: 22,
      water_temp_c: 18,
    };

    const score = calcularScore(praiaBase, condicoes);
    // Esperado: 2 (swell surfável) + 3 (swell dir ok) + 2 (vento ok) + 1 (vel ok) = 8
    expect(score).toBe(8);
  });

  test('ondulação muito pequena + vento desfavorável → score baixo', () => {
    const condicoes = {
      wind_speed: 35,         // acima de 25 nós → +0
      wind_direction: 'Sul',  // não está em ['NE', 'Oeste'] → +0
      swell_height: 0.1,      // 0.3 pés — fora até de 50% do mínimo → +0
      swell_direction: 'Sul', // não está em ['SE', 'NE'] → +0
      swell_period: 4,
      air_temp_c: 16,
      water_temp_c: 14,
    };

    const score = calcularScore(praiaBase, condicoes);
    expect(score).toBe(0);
  });

  test('sem dados de condições → score neutro (pontuações parciais)', () => {
    const condicoes = {
      wind_speed: null,
      wind_direction: null,
      swell_height: null,
      swell_direction: null,
      swell_period: null,
      air_temp_c: null,
      water_temp_c: null,
    };

    const score = calcularScore(praiaBase, condicoes);
    // Esperado: 2 (swell neutro) + 1.5 (swell dir neutro) + 1 (vento neutro) + 0.5 (vel neutro) = 5
    expect(score).toBe(5);
  });

  test('praia sem restrição de direções → não penaliza', () => {
    const praiaSemDirecoes: Beach = {
      ...praiaBase,
      swell_directions: [],
      wind_directions: [],
    };

    const condicoes = {
      wind_speed: 20,
      wind_direction: 'Norte',
      swell_height: 1.5,  // ≈5 pés (dentro de 2–10) → +4
      swell_direction: 'Norte',
      swell_period: 10,
      air_temp_c: 22,
      water_temp_c: 20,
    };

    const score = calcularScore(praiaSemDirecoes, condicoes);
    // Sem direções: swell=4, swell_dir=1.5 (neutro), vento=1 (neutro), vel=1 → 7.5
    expect(score).toBe(7.5);
  });

  test('score nunca ultrapassa 10', () => {
    // Mesmo com bônus em tudo, deve ficar em 10
    const condicoes = {
      wind_speed: 10,
      wind_direction: 'Oeste',
      swell_height: 1.5,
      swell_direction: 'SE',
      swell_period: 14,
      air_temp_c: 24,
      water_temp_c: 22,
    };

    const score = calcularScore(praiaBase, condicoes);
    expect(score).toBeLessThanOrEqual(10);
  });

  test('score nunca é negativo', () => {
    const condicoes = {
      wind_speed: 100,
      wind_direction: 'Norte',
      swell_height: 0.01,
      swell_direction: 'Norte',
      swell_period: 1,
      air_temp_c: 5,
      water_temp_c: 5,
    };

    const score = calcularScore(praiaBase, condicoes);
    expect(score).toBeGreaterThanOrEqual(0);
  });

});

// ─── recomendarRoupa ──────────────────────────────────────────────────────────

describe('recomendarRoupa', () => {

  test('água quente (28°C) + tolerância normal → Sem roupa / Lycra', () => {
    expect(recomendarRoupa(28, 'normal')).toBe('Sem roupa / Lycra');
  });

  test('água morna (24°C) + tolerância normal → Lycra ou top 1mm', () => {
    expect(recomendarRoupa(24, 'normal')).toBe('Lycra ou top 1mm');
  });

  test('água amena (21°C) + tolerância normal → Shortinho 2/2mm', () => {
    expect(recomendarRoupa(21, 'normal')).toBe('Shortinho 2/2mm');
  });

  test('água fria (18°C) + tolerância normal → Wetsuit 3/2mm', () => {
    expect(recomendarRoupa(18, 'normal')).toBe('Wetsuit 3/2mm');
  });

  test('água muito fria (15°C) + tolerância normal → Wetsuit 4/3mm', () => {
    expect(recomendarRoupa(15, 'normal')).toBe('Wetsuit 4/3mm');
  });

  test('água gelada (12°C) + tolerância normal → Wetsuit 5/4mm + capuz', () => {
    expect(recomendarRoupa(12, 'normal')).toBe('Wetsuit 5/4mm + capuz');
  });

  test('sensível ao frio ajusta +2°C (18°C parece 16°C → Wetsuit 4/3mm)', () => {
    expect(recomendarRoupa(18, 'sensitive')).toBe('Wetsuit 4/3mm');
  });

  test('resistente ao frio ajusta -2°C (18°C parece 20°C → Shortinho 2/2mm)', () => {
    expect(recomendarRoupa(18, 'resistant')).toBe('Shortinho 2/2mm');
  });

  test('água a 20°C exato na fronteira (20–23°C = shorty, abaixo = wetsuit)', () => {
    expect(recomendarRoupa(20, 'normal')).toBe('Shortinho 2/2mm');
  });

  test('sem dados de temperatura → Dados indisponíveis', () => {
    expect(recomendarRoupa(null, 'normal')).toBe('Dados indisponíveis');
  });

  test('temperatura zero → Wetsuit 5/4mm + capuz', () => {
    expect(recomendarRoupa(0, 'normal')).toBe('Wetsuit 5/4mm + capuz');
  });

});
