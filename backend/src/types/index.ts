// Tipos globais do Surfyng backend

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type ColdTolerance = 'sensitive' | 'normal' | 'resistant';
export type UserPlan = 'free' | 'pro' | 'global';
export type BeachDifficulty = 'low' | 'medium_low' | 'medium' | 'medium_high' | 'high';
export type Consistency = 'low' | 'medium' | 'high';
export type CrowdLevel = 'low' | 'medium' | 'intense';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';

export interface User {
  id: string;
  firebase_uid: string;
  name: string | null;
  email: string | null;
  photo_url: string | null;
  level: UserLevel;
  cold_tolerance: ColdTolerance;
  plan: UserPlan;
  stripe_customer_id: string | null;
  base_lat: number | null;
  base_lng: number | null;
  city: string | null;
  push_token: string | null;
  language: string;
  created_at: Date;
}

export interface Beach {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  lat: number;
  lng: number;
  swell_directions: string[];
  wind_directions: string[];
  min_size_feet: number | null;
  max_size_feet: number | null;
  difficulty: BeachDifficulty | null;
  best_season: string | null;
  consistency: Consistency | null;
  crowd: CrowdLevel | null;
  water_temp_summer_c: number | null;
  water_temp_winter_c: number | null;
  description: string | null;
  created_at: Date;
}

export interface ConditionsCache {
  id: string;
  beach_id: string;
  wind_speed: number | null;
  wind_direction: string | null;
  swell_height: number | null;
  swell_direction: string | null;
  swell_period: number | null;
  water_temp_c: number | null;
  air_temp_c: number | null;
  wetsuit_recommendation: string | null;
  score: number | null;
  fetched_at: Date;
  expires_at: Date;
}

export interface Post {
  id: string;
  user_id: string;
  beach_id: string;
  rating: number;
  text: string | null;
  photos: string[];
  conditions_snapshot: Record<string, unknown> | null;
  likes_count: number;
  created_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: UserPlan;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  status: SubscriptionStatus;
  started_at: Date;
  ends_at: Date | null;
}

export interface AlertPreference {
  id: string;
  user_id: string;
  beach_id: string;
  min_score: number;
  active: boolean;
  created_at: Date;
}

// Extensão do Request do Express para incluir usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: User;
      firebaseUid?: string;
    }
  }
}
