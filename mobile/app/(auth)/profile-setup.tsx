// Setup de perfil — escolha de nível e tolerância ao frio (primeira vez)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMe } from '../../src/api/users';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, radius } from '../../src/theme';
import { NIVEL_LABEL, TOLERANCIA_LABEL } from '../../src/types';
import type { UserLevel, ColdTolerance } from '../../src/types';

const NIVEIS: { value: UserLevel; descricao: string; icone: string }[] = [
  { value: 'beginner',     descricao: 'Aprendo a surfar ou surf ocasional',       icone: '🏄' },
  { value: 'intermediate', descricao: 'Surfista regular, domino o remado básico', icone: '🏄‍♂️' },
  { value: 'advanced',     descricao: 'Ondas grandes, tubos e manobras aéreas',   icone: '🤙' },
];

const TOLERANCIAS: { value: ColdTolerance; descricao: string }[] = [
  { value: 'sensitive', descricao: 'Sinto frio fácil, prefiro água quente' },
  { value: 'normal',    descricao: 'Adaptado a temperaturas variadas' },
  { value: 'resistant', descricao: 'Aguentou bem água fria' },
];

export default function ProfileSetupScreen() {
  const [nivel, setNivel]         = useState<UserLevel | null>(null);
  const [tolerancia, setToleranc] = useState<ColdTolerance | null>(null);
  const [salvando, setSalvando]   = useState(false);
  const { setUser }               = useAuthStore();

  const podeSalvar = nivel && tolerancia;

  const salvar = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      const { usuario } = await updateMe({ level: nivel, cold_tolerance: tolerancia });
      setUser(usuario as any);
      // A navegação é automática via app/index.tsx ao detectar user.nivel
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Personalize sua experiência</Text>
      <Text style={styles.subtitulo}>
        Usamos essas informações para recomendar praias e trajes adequados ao seu perfil.
      </Text>

      {/* Nível de surf */}
      <Text style={styles.secao}>Qual é o seu nível de surf?</Text>
      <View style={styles.opcoes}>
        {NIVEIS.map(n => (
          <Pressable
            key={n.value}
            style={[styles.opcao, nivel === n.value && styles.opcaoSelecionada]}
            onPress={() => setNivel(n.value)}
          >
            <Text style={styles.opcaoIcone}>{n.icone}</Text>
            <View style={styles.opcaoTexto}>
              <Text style={[styles.opcaoLabel, nivel === n.value && styles.opcaoLabelSelecionada]}>
                {NIVEL_LABEL[n.value]}
              </Text>
              <Text style={styles.opcaoDesc}>{n.descricao}</Text>
            </View>
            {nivel === n.value && (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Tolerância ao frio */}
      <Text style={styles.secao}>Tolerância ao frio</Text>
      <View style={styles.opcoes}>
        {TOLERANCIAS.map(t => (
          <Pressable
            key={t.value}
            style={[styles.opcao, tolerancia === t.value && styles.opcaoSelecionada]}
            onPress={() => setToleranc(t.value)}
          >
            <View style={styles.opcaoTexto}>
              <Text style={[styles.opcaoLabel, tolerancia === t.value && styles.opcaoLabelSelecionada]}>
                {TOLERANCIA_LABEL[t.value]}
              </Text>
              <Text style={styles.opcaoDesc}>{t.descricao}</Text>
            </View>
            {tolerancia === t.value && (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Botão salvar */}
      <Pressable
        style={[styles.botao, !podeSalvar && styles.botaoDesabilitado]}
        onPress={salvar}
        disabled={!podeSalvar || salvando}
      >
        {salvando
          ? <ActivityIndicator color={colors.bg} />
          : <Text style={styles.botaoTexto}>Começar a surfar</Text>
        }
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
    gap: spacing.lg,
  },
  titulo: {
    ...typography.h1,
  },
  subtitulo: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  secao: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  opcoes: {
    gap: spacing.sm,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  opcaoSelecionada: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(34,211,238,0.07)',
  },
  opcaoIcone: {
    fontSize: 28,
  },
  opcaoTexto: {
    flex: 1,
    gap: 2,
  },
  opcaoLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  opcaoLabelSelecionada: {
    color: colors.accent,
  },
  opcaoDesc: {
    ...typography.small,
    color: colors.textSecondary,
  },
  botao: {
    backgroundColor: colors.accent,
    padding: spacing.md + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  botaoDesabilitado: {
    opacity: 0.4,
  },
  botaoTexto: {
    ...typography.body,
    color: colors.bg,
    fontWeight: '700',
  },
});
