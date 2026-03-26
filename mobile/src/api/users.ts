// API de usuários — perfil e atualização
import api from './client';
import type { User, UserLevel, ColdTolerance } from '../types';

interface UpdateProfileParams {
  name?: string;
  level?: UserLevel;
  cold_tolerance?: ColdTolerance;
  base_lat?: number;
  base_lng?: number;
  city?: string;
  push_token?: string;
  language?: string;
}

// GET /users/me
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  return data;
}

// PUT /users/me
export async function updateMe(params: UpdateProfileParams): Promise<{ mensagem: string; usuario: Partial<User> }> {
  const { data } = await api.put('/users/me', params);
  return data;
}
