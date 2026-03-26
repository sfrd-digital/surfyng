// API de notificações e alertas
import api from './client';
import type { Notificacao, AlertaPreferencia } from '../types';

interface NotificacoesResponse {
  nao_lidas: number;
  total_pagina: number;
  limit: number;
  offset: number;
  notificacoes: Notificacao[];
}

interface AlertasResponse {
  total: number;
  alertas: AlertaPreferencia[];
}

export async function getNotificacoes(params?: { apenas_nao_lidas?: boolean; limit?: number }): Promise<NotificacoesResponse> {
  const { data } = await api.get<NotificacoesResponse>('/notifications', { params });
  return data;
}

export async function marcarComoLida(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function marcarTodasComoLidas(): Promise<{ total: number }> {
  const { data } = await api.patch('/notifications/read-all');
  return data;
}

export async function getAlertas(): Promise<AlertasResponse> {
  const { data } = await api.get<AlertasResponse>('/alerts');
  return data;
}

export async function criarAlerta(beach_id: string, min_score: number): Promise<void> {
  await api.post('/alerts', { beach_id, min_score });
}

export async function atualizarAlerta(beach_id: string, params: { min_score?: number; active?: boolean }): Promise<void> {
  await api.put(`/alerts/${beach_id}`, params);
}

export async function removerAlerta(beach_id: string): Promise<void> {
  await api.delete(`/alerts/${beach_id}`);
}
