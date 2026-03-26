// Tela de login — Google OAuth via Firebase
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../../src/config/firebase';
import { colors, spacing, typography, radius } from '../../src/theme';

// Necessário para fechar o browser após autenticação
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [carregando, setCarregando] = useState(false);

  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Processa resposta do Google OAuth
  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      setCarregando(true);
      const credencial = GoogleAuthProvider.credential(id_token);
      signInWithCredential(firebaseAuth, credencial)
        .catch(err => {
          console.error('[Login] Erro Firebase:', err);
          Alert.alert('Erro', 'Não foi possível fazer login. Tente novamente.');
        })
        .finally(() => setCarregando(false));
    }
  }, [response]);

  const handleGoogle = async () => {
    try {
      setCarregando(true);
      await promptAsync();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível iniciar o login com Google.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo / marca */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Ionicons name="water" size={56} color={colors.accent} />
        </View>
        <Text style={styles.nome}>Surfyng</Text>
        <Text style={styles.tagline}>Sua sessão perfeita começa aqui</Text>
      </View>

      {/* Ações de login */}
      <View style={styles.acoes}>
        <Pressable
          style={({ pressed }) => [styles.botaoGoogle, pressed && styles.pressed, carregando && styles.disabled]}
          onPress={handleGoogle}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={colors.bg} />
              <Text style={styles.botaoGoogleTexto}>Continuar com Google</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.termos}>
          Ao continuar, você concorda com nossos{' '}
          <Text style={styles.link}>Termos de Uso</Text> e{' '}
          <Text style={styles.link}>Política de Privacidade</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(34,211,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  nome: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  acoes: {
    gap: spacing.lg,
  },
  botaoGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  botaoGoogleTexto: {
    ...typography.body,
    color: colors.bg,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  termos: {
    ...typography.tiny,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.accent,
  },
});
