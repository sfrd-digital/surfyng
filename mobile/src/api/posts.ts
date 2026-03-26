// API de posts da comunidade
import api from './client';
import type { Post } from '../types';

interface FeedParams {
  beach_id?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

interface FeedResponse {
  total: number;
  limit: number;
  offset: number;
  posts: Post[];
}

interface CreatePostParams {
  beach_id: string;
  rating: number;
  text?: string;
  photos?: string[];
  incluir_condicoes?: boolean;
}

export async function getFeed(params?: FeedParams): Promise<FeedResponse> {
  const { data } = await api.get<FeedResponse>('/posts', { params });
  return data;
}

export async function getPost(id: string): Promise<Post> {
  const { data } = await api.get<Post>(`/posts/${id}`);
  return data;
}

export async function createPost(params: CreatePostParams): Promise<{ mensagem: string; post_id: string }> {
  const { data } = await api.post('/posts', params);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}

export async function likePost(id: string): Promise<void> {
  await api.post(`/posts/${id}/like`);
}

export async function unlikePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}/like`);
}
