// API de praias
import api from './client';
import type { PraiaComDistancia, PraiaDetalhes, Praia } from '../types';

interface NearbyParams {
  lat: number;
  lng: number;
  raio_km?: number;
  limit?: number;
}

interface NearbyResponse {
  total: number;
  raio_km: number;
  praias: PraiaComDistancia[];
}

interface ListResponse {
  total: number;
  limit: number;
  offset: number;
  praias: Praia[];
}

// GET /beaches/nearby — praias próximas com score e condições
export async function getNearby(params: NearbyParams): Promise<NearbyResponse> {
  const { data } = await api.get<NearbyResponse>('/beaches/nearby', { params });
  return data;
}

// GET /beaches/:id — detalhes completos com condições em tempo real
export async function getBeach(id: string): Promise<PraiaDetalhes> {
  const { data } = await api.get<PraiaDetalhes>(`/beaches/${id}`);
  return data;
}

// GET /beaches/:id/conditions — força atualização do cache (botão "Atualizar")
export async function refreshConditions(id: string): Promise<{ praia_id: string; condicoes: import('../types').Condicoes }> {
  const { data } = await api.get(`/beaches/${id}/conditions`);
  return data;
}

// GET /beaches?state=X&difficulty=Y
export async function listBeaches(params?: { state?: string; difficulty?: string; limit?: number }): Promise<ListResponse> {
  const { data } = await api.get<ListResponse>('/beaches', { params });
  return data;
}

// POST /users/me/favorites/:beach_id
export async function addFavorite(beachId: string): Promise<void> {
  await api.post(`/users/me/favorites/${beachId}`);
}

// DELETE /users/me/favorites/:beach_id
export async function removeFavorite(beachId: string): Promise<void> {
  await api.delete(`/users/me/favorites/${beachId}`);
}
