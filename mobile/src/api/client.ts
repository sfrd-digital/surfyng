// Cliente Axios — instância central com interceptors de token e retry em 401
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Em dev, use http://10.0.2.2:3000 no Android Emulator ou http://localhost:3000 no iOS Simulator
export const api = axios.create({
  baseURL:         process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  timeout:         15_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// Injeta o token Bearer em cada requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tenta renovar o token ao receber 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { firebaseUser, setToken } = useAuthStore.getState();

      if (firebaseUser) {
        try {
          const novoToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
          setToken(novoToken);
          original.headers.Authorization = `Bearer ${novoToken}`;
          return api(original);
        } catch {
          // Token não pôde ser renovado — força logout
          useAuthStore.getState().clear();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
