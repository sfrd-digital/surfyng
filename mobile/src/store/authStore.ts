// Store de autenticação — Zustand
// Mantém o usuário Firebase + dados do backend + token JWT em memória
import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '../types';

interface AuthState {
  // Usuário do Firebase (contém uid, email, foto, métodos de token)
  firebaseUser: FirebaseUser | null;
  // Usuário do banco Surfyng (contém nivel, plano, etc.)
  user:  User | null;
  // Token JWT atual do Firebase
  token: string | null;
  // Indica que o estado de auth ainda está sendo resolvido (splash/loading)
  isLoading: boolean;

  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser:         (user: User | null) => void;
  setToken:        (token: string | null) => void;
  setLoading:      (loading: boolean) => void;

  // Limpa todo o estado (logout)
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  user:         null,
  token:        null,
  isLoading:    true,

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUser:         (user) => set({ user }),
  setToken:        (token) => set({ token }),
  setLoading:      (isLoading) => set({ isLoading }),

  clear: () => set({
    firebaseUser: null,
    user:         null,
    token:        null,
    isLoading:    false,
  }),
}));
