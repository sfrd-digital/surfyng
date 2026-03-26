// API de autenticação — sincroniza token Firebase com o backend
import api from './client';
import type { User } from '../types';

interface VerifyResponse {
  mensagem: string;
  usuario: User;
}

// POST /auth/verify — verifica token e registra/atualiza usuário no banco
export async function verifyAuth(pushToken?: string): Promise<User> {
  const { data } = await api.post<VerifyResponse>('/auth/verify', {
    push_token: pushToken ?? null,
    language: 'pt',
  });
  return data.usuario;
}
