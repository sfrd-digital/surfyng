// Utilitário de direção de vento e ondulação
// Traduz siglas técnicas para português completo e converte graus para direção
// Usado em todas as telas que exibem direção de vento ou ondulação

// Mapa de siglas → nome completo em português
// Cobre notação em inglês (N/S/E/W), português (O/NO/SO) e formas por extenso (idempotente)
const DIRECOES: Record<string, string> = {
  // ─── Pontos cardeais ──────────────────────────────────────────────────────
  N:   'Norte',
  S:   'Sul',
  E:   'Leste',
  W:   'Oeste',
  O:   'Oeste',   // notação portuguesa

  // ─── Pontos colaterais ────────────────────────────────────────────────────
  NE: 'Nordeste',
  SE: 'Sudeste',
  SW: 'Sudoeste',
  SO: 'Sudoeste', // notação portuguesa
  NW: 'Noroeste',
  NO: 'Noroeste', // notação portuguesa

  // ─── Pontos subcolaterais ─────────────────────────────────────────────────
  NNE: 'Norte-Nordeste',
  ENE: 'Leste-Nordeste',
  ESE: 'Leste-Sudeste',
  SSE: 'Sul-Sudeste',
  SSW: 'Sul-Sudoeste',
  SSO: 'Sul-Sudoeste', // notação portuguesa
  WSW: 'Oeste-Sudoeste',
  OSO: 'Oeste-Sudoeste', // notação portuguesa
  WNW: 'Oeste-Noroeste',
  ONO: 'Oeste-Noroeste', // notação portuguesa
  NNW: 'Norte-Noroeste',
  NNO: 'Norte-Noroeste', // notação portuguesa

  // ─── Formas por extenso — idempotente ─────────────────────────────────────
  NORTE:          'Norte',
  SUL:            'Sul',
  LESTE:          'Leste',
  OESTE:          'Oeste',
  NORDESTE:       'Nordeste',
  SUDESTE:        'Sudeste',
  SUDOESTE:       'Sudoeste',
  NOROESTE:       'Noroeste',
  'NORTE-NORDESTE':  'Norte-Nordeste',
  'LESTE-NORDESTE':  'Leste-Nordeste',
  'LESTE-SUDESTE':   'Leste-Sudeste',
  'SUL-SUDESTE':     'Sul-Sudeste',
  'SUL-SUDOESTE':    'Sul-Sudoeste',
  'OESTE-SUDOESTE':  'Oeste-Sudoeste',
  'OESTE-NOROESTE':  'Oeste-Noroeste',
  'NORTE-NOROESTE':  'Norte-Noroeste',
};

// Nomes dos 16 pontos na rosa dos ventos (sentido horário a partir do Norte)
// Usados por degreesToDirection
const PONTOS_16: string[] = [
  'Norte',
  'Norte-Nordeste',
  'Nordeste',
  'Leste-Nordeste',
  'Leste',
  'Leste-Sudeste',
  'Sudeste',
  'Sul-Sudeste',
  'Sul',
  'Sul-Sudoeste',
  'Sudoeste',
  'Oeste-Sudoeste',
  'Oeste',
  'Oeste-Noroeste',
  'Noroeste',
  'Norte-Noroeste',
];

/**
 * Traduz uma sigla técnica de direção para o nome completo em português.
 *
 * Exemplos:
 *   translateDirection('NE')   → 'Nordeste'
 *   translateDirection('SSW')  → 'Sul-Sudoeste'
 *   translateDirection('NO')   → 'Noroeste'
 *   translateDirection('Norte')→ 'Norte'   (já traduzido — idempotente)
 *
 * Retorna a sigla original caso não seja reconhecida.
 */
export function translateDirection(sigla: string): string {
  const chave = sigla.trim().toUpperCase();
  return DIRECOES[chave] ?? sigla;
}

/**
 * Converte um ângulo em graus (0–360) para o nome de direção em português.
 * Usa rosa dos ventos de 16 pontos (incrementos de 22,5°).
 *
 * Exemplos:
 *   degreesToDirection(0)   → 'Norte'
 *   degreesToDirection(83)  → 'Leste'
 *   degreesToDirection(225) → 'Sudoeste'
 */
export function degreesToDirection(degrees: number): string {
  // Normaliza para [0, 360)
  const graus = ((degrees % 360) + 360) % 360;
  const indice = Math.round(graus / 22.5) % 16;
  return PONTOS_16[indice];
}
