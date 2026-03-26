// ProfileScreen — perfil do usuário, configurações e plano
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseAuth } from '../../src/config/firebase';
import { useAuthStore } from '../../src/store/authStore';
import { updateMe } from '../../src/api/users';
import { colors, spacing, typography, radius } from '../../src/theme';
import { NIVEL_LABEL, TOLERANCIA_LABEL, PLANO_LABEL } from '../../src/types';
import type { UserLevel, ColdTolerance } from '../../src/types';

export default function ProfileScreen() {
  const qc = useQueryClient();
  const { user, clear } = useAuthStore();

  const mutUpdate = useMutation({
    mutationFn: updateMe,
    onSuccess: (res) => {
      // Atualiza o store com os novos dados
      const { setUser } = useAuthStore.getState();
      setUser({ ...user!, ...(res.usuario as any) });
    },
  });

  const sair = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut(firebaseAuth);
          qc.clear();
          clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const isPro = user.plano === 'pro' || user.plano === 'global';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Cabeçalho do perfil */}
      <View style={styles.heroContainer}>
        <View style={styles.avatarContainer}>
          {user.foto
            ? <Image source={{ uri: user.foto }} style={styles.avatar} />
            : <Ionicons name="person" size={40} color={colors.textSecondary} />
          }
        </View>
        <Text style={styles.nome}>{user.nome ?? 'Surfista'}</Text>
        <Text style={styles.email}>{user.email}</Text>

        {/* Badge do plano */}
        <View style={[styles.planoBadge, isPro && styles.planoBadgePro]}>
          <Ionicons
            name={isPro ? 'star' : 'star-outline'}
            size={13}
            color={isPro ? '#FBBF24' : colors.textSecondary}
          />
          <Text style={[styles.planoTexto, isPro && styles.planoTextoPro]}>
            {PLANO_LABEL[user.plano]}
          </Text>
        </View>
      </View>

      {/* Seção: Meu perfil de surf */}
      <Secao titulo="Perfil de surf">
        <OpcaoSelect
          label="Nível"
          valor={NIVEL_LABEL[user.nivel]}
          icone="trophy-outline"
          onPress={() => router.push('/(auth)/profile-setup')}
        />
        <OpcaoSelect
          label="Tolerância ao frio"
          valor={TOLERANCIA_LABEL[user.tolerancia_frio]}
          icone="thermometer-outline"
          onPress={() => router.push('/(auth)/profile-setup')}
        />
      </Secao>

      {/* Seção: Plano */}
      {!isPro && (
        <Secao titulo="Plano">
          <Pressable style={styles.upgradeBanner} onPress={() => router.push('/plans')}>
            <View style={styles.upgradeTexto}>
              <Text style={styles.upgradeTitulo}>Atualize para o Pro</Text>
              <Text style={styles.upgradeDesc}>
                Alertas ilimitados, histórico e acesso a praias globais
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.accent} />
          </Pressable>
        </Secao>
      )}

      {/* Seção: Conta */}
      <Secao titulo="Conta">
        <OpcaoSimples
          label="Sair"
          icone="log-out-outline"
          cor="#EF4444"
          onPress={sair}
        />
      </Secao>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      <View style={styles.secaoConteudo}>{children}</View>
    </View>
  );
}

function OpcaoSelect({ label, valor, icone, onPress }: {
  label: string;
  valor: string;
  icone: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.opcao} onPress={onPress}>
      <Ionicons name={icone} size={18} color={colors.accent} />
      <Text style={styles.opcaoLabel}>{label}</Text>
      <Text style={styles.opcaoValor}>{valor}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

function OpcaoSimples({ label, icone, cor, onPress }: {
  label: string;
  icone: keyof typeof Ionicons.glyphMap;
  cor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.opcao} onPress={onPress}>
      <Ionicons name={icone} size={18} color={cor ?? colors.accent} />
      <Text style={[styles.opcaoLabel, cor ? { color: cor } : {}]}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    gap: spacing.lg,
  },
  centrado: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 88,
    height: 88,
  },
  nome: {
    ...typography.h2,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  planoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  planoBadgePro: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251,191,36,0.08)',
  },
  planoTexto: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  planoTextoPro: {
    color: '#FBBF24',
  },
  secao: {
    gap: spacing.sm,
  },
  secaoTitulo: {
    ...typography.small,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  secaoConteudo: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  opcaoLabel: {
    ...typography.body,
    flex: 1,
  },
  opcaoValor: {
    ...typography.body,
    color: colors.textSecondary,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  upgradeTexto: {
    flex: 1,
  },
  upgradeTitulo: {
    ...typography.body,
    fontWeight: '700',
    color: colors.accent,
  },
  upgradeDesc: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
