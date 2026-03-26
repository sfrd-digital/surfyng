// Tipos globais do app Surfyng mobile

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type ColdTolerance = 'sensitive' | 'normal' | 'resistant';
export type UserPlan = 'free' | 'pro' | 'global';
export type BeachDifficulty = 'low' | 'medium_low' | 'medium' | 'medium_high' | 'high';

// ─── Usuário ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  nome: string | null;
  email: string | null;
  foto: string | null;
  nivel: UserLevel;
  tolerancia_frio: ColdTolerance;
  plano: UserPlan;
  idioma: string;
  localizacao_base: { lat: number; lng: number; cidade: string } | null;
  praias_favoritas: { beach_id: string; beach_name: string; city: string }[];
  criado_em: string;
}

// ─── Condições meteorológicas ─────────────────────────────────────────────────

export interface Condicoes {
  wind_speed: number | null;
  wind_direction: string | null;
  swell_height: number | null;
  swell_direction: string | null;
  swell_period: number | null;
  water_temp_c: number | null;
  air_temp_c: number | null;
  score: number;
  roupa: string;
  cache_expira_em: string;
}

// ─── Praia ────────────────────────────────────────────────────────────────────

export interface Praia {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  pais: string;
  lat: number;
  lng: number;
  dificuldade: BeachDifficulty | null;
  consistencia: 'low' | 'medium' | 'high' | null;
  lotacao: 'low' | 'medium' | 'intense' | null;
  melhor_estacao: string | null;
  tamanho_min_pes: number | null;
  tamanho_max_pes: number | null;
  descricao: string | null;
  temp_agua_verao: number | null;
  temp_agua_inverno: number | null;
}

export interface PraiaComDistancia extends Praia {
  distancia_km: number;
  condicoes: Condicoes | null;
}

export interface PraiaDetalhes extends Praia {
  direcoes_swell: string[];
  direcoes_vento: string[];
  is_favorita: boolean;
  condicoes: Condicoes | null;
}

// ─── Posts da comunidade ──────────────────────────────────────────────────────

export interface Post {
  id: string;
  rating: number;
  texto: string | null;
  fotos: string[];
  likes: number;
  curtido: boolean;
  criado_em: string;
  condicoes_snapshot: Condicoes | null;
  autor: {
    id: string;
    nome: string | null;
    foto: string | null;
    nivel: UserLevel;
  };
  praia: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
  };
}

// ─── Notificações ─────────────────────────────────────────────────────────────

export interface Notificacao {
  id: string;
  titulo: string;
  corpo: string;
  tipo: string;
  lida: boolean;
  praia_id: string | null;
  criado_em: string;
}

export interface AlertaPreferencia {
  id: string;
  min_score: number;
  ativo: boolean;
  criado_em: string;
  score_atual: number | null;
  disparando: boolean;
  praia: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const DIFICULDADE_LABEL: Record<BeachDifficulty, string> = {
  low:         'Iniciante',
  medium_low:  'Iniciante+',
  medium:      'Intermediário',
  medium_high: 'Avançado-',
  high:        'Avançado',
};

export const NIVEL_LABEL: Record<UserLevel, string> = {
  beginner:     'Iniciante',
  intermediate: 'Intermediário',
  advanced:     'Avançado',
};

export const TOLERANCIA_LABEL: Record<ColdTolerance, string> = {
  sensitive: 'Sensível ao frio',
  normal:    'Tolerância normal',
  resistant: 'Resistente ao frio',
};

export const PLANO_LABEL: Record<UserPlan, string> = {
  free:   'Gratuito',
  pro:    'Pro',
  global: 'Global',
};

// Praias válidas para o nível do usuário
export function dificuldadesPermitidas(nivel: UserLevel): BeachDifficulty[] {
  switch (nivel) {
    case 'beginner':     return ['low', 'medium_low'];
    case 'intermediate': return ['low', 'medium_low', 'medium'];
    case 'advanced':     return ['low', 'medium_low', 'medium', 'medium_high', 'high'];
  }
}
