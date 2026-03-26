// Roteador raiz — decide para onde enviar o usuário ao abrir o app
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../src/store/authStore';
import { colors } from '../src/theme';

const ONBOARDING_KEY = 'onboarding_concluido';

export default function Index() {
  const { user, firebaseUser, isLoading } = useAuthStore();
  const [onboardingOk, setOnboardingOk]   = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then(val => {
      if (!val) SecureStore.setItemAsync(ONBOARDING_KEY, '1');
      setOnboardingOk(!!val);
    });
  }, []);

  // Aguarda auth + verificação de onboarding
  if (isLoading || onboardingOk === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // Primeira vez → onboarding
  if (!onboardingOk) return <Redirect href="/(auth)/onboarding" />;

  // Não autenticado → tela de login
  if (!firebaseUser) return <Redirect href="/(auth)/login" />;

  // Autenticado mas sem nível configurado → setup do perfil
  if (firebaseUser && (!user || !user.nivel)) return <Redirect href="/(auth)/profile-setup" />;

  // Pronto → tela principal
  return <Redirect href="/(tabs)/" />;
}
