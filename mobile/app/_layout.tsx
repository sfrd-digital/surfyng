// Layout raiz — inicializa Firebase, escuta auth state, deep links e roteia o usuário
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../src/config/firebase';
import { useAuthStore } from '../src/store/authStore';
import { verifyAuth } from '../src/api/auth';
import { getMe } from '../src/api/users';
import { colors } from '../src/theme';

// Mantém o splash visível até o app estar pronto
SplashScreen.preventAutoHideAsync();

// Configuração global de notificações push
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 60 * 1000, // 30 min — alinhado ao TTL do cache do backend
    },
  },
});

export default function RootLayout() {
  const { setFirebaseUser, setUser, setToken, setLoading } = useAuthStore();

  // ── Deep link: retorno do Stripe ──────────────────────────────────────────
  useEffect(() => {
    // Captura URL se o app foi aberto via deep link (estado frio)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    // Captura URL se o app estava em background
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  async function handleDeepLink(url: string) {
    const { path, queryParams } = Linking.parse(url);

    if (path === 'payment-success') {
      // Recarrega dados do usuário para refletir novo plano
      try {
        const usuario = await getMe();
        setUser(usuario);
        Alert.alert('🎉 Assinatura ativada!', 'Seu plano foi atualizado. Aproveite!');
      } catch {
        Alert.alert('Pagamento confirmado!', 'Seu plano será atualizado em breve.');
      }
      return;
    }

    if (path === 'payment-cancel') {
      Alert.alert('Pagamento cancelado', 'Sua assinatura não foi processada.');
      return;
    }
  }

  // ── Firebase auth state ───────────────────────────────────────────────────
  useEffect(() => {
    // Escuta mudanças no estado de autenticação Firebase
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Obtém token JWT válido
          const token = await firebaseUser.getIdToken();
          setToken(token);

          // Registra push token para notificações
          let pushToken: string | undefined;
          try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status === 'granted') {
              const t = await Notifications.getExpoPushTokenAsync();
              pushToken = t.data;
            }
          } catch {
            // Push não disponível no emulador/Expo Go
          }

          // Sincroniza com o backend (cria usuário se novo)
          const usuario = await verifyAuth(pushToken);
          setUser(usuario);
        } catch (err) {
          console.error('[Auth] Erro ao sincronizar com backend:', err);
        }
      } else {
        setUser(null);
        setToken(null);
      }

      setLoading(false);
      SplashScreen.hideAsync();
    });

    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="beach/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="post/create"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="plans"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
