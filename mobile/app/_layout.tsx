import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { useAuthStore } from '../src/store/authStore';
import { verifyAuth } from '../src/api/auth';
import { getMe } from '../src/api/users';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30 * 60 * 1000 },
  },
});

export default function RootLayout() {
  const { setFirebaseUser, setUser, setToken, setLoading } = useAuthStore();
  const authReady = useRef(false);

  // Carrega as fontes Gotham Rounded — splash permanece visível até tudo estar pronto
  const [fontsLoaded] = useFonts({
    'GothamRounded-Bold':         require('../assets/fonts/gotham-rounded-bold.otf'),
    'GothamRounded-BoldItalic':   require('../assets/fonts/gotham-rounded-bold-italic.otf'),
    'GothamRounded-Book':         require('../assets/fonts/gotham-rounded-book.otf'),
    'GothamRounded-BookItalic':   require('../assets/fonts/gotham-rounded-book-italic.otf'),
    'GothamRounded-Light':        require('../assets/fonts/gotham-rounded-light.otf'),
    'GothamRounded-LightItalic':  require('../assets/fonts/gotham-rounded-light-italic.otf'),
    'GothamRounded-Medium':       require('../assets/fonts/gotham-rounded-medium.otf'),
    'GothamRounded-MediumItalic': require('../assets/fonts/gotham-rounded-medium-italic.otf'),
  });

  // Esconde o splash quando fontes E auth estiverem prontos
  useEffect(() => {
    if (fontsLoaded && authReady.current) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  async function handleDeepLink(url: string) {
    const { path } = Linking.parse(url);
    if (path === 'payment-success') {
      try {
        const usuario = await getMe();
        setUser(usuario);
        Alert.alert('🎉 Assinatura ativada!', 'Seu plano foi atualizado. Aproveite!');
      } catch {
        Alert.alert('Pagamento confirmado!', 'Seu plano será atualizado em breve.');
      }
    }
    if (path === 'payment-cancel') {
      Alert.alert('Pagamento cancelado', 'Sua assinatura não foi processada.');
    }
  }

  useEffect(() => {
    // Importa Firebase de forma lazy — só depois do React Native estar pronto
    let unsubscribe: () => void;

    const initFirebase = async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { default: app } = await import('../src/config/firebaseApp');
      const auth = getAuth(app);

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setFirebaseUser(firebaseUser);

        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            setToken(token);

            let pushToken: string | undefined;
            try {
              const { status } = await Notifications.getPermissionsAsync();
              if (status === 'granted') {
                const t = await Notifications.getExpoPushTokenAsync();
                pushToken = t.data;
              }
            } catch {}

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
        authReady.current = true;
        if (fontsLoaded) SplashScreen.hideAsync();
      });
    };

    initFirebase();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="beach/[id]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="post/create" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="plans" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
