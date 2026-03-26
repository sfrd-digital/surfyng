// HomeScreen — recomendação principal + alternativas próximas
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getNearby } from '../../src/api/beaches';
import { useLocation } from '../../src/hooks/useLocation';
import { useAuthStore } from '../../src/store/authStore';
import { BeachCard } from '../../src/components/BeachCard';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, spacing, typography } from '../../src/theme';
import type { PraiaComDistancia } from '../../src/types';

export default function HomeScreen() {
  const { user }                    = useAuthStore();
  const { localizacao, erro, carregando: locCarregando, recarregar } = useLocation();
  const [raio, setRaio]             = useState(50);

  const {
    data: nearbyData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['beaches-nearby', localizacao?.latitude, localizacao?.longitude, raio],
    queryFn: () => getNearby({
      lat:     localizacao!.latitude,
      lng:     localizacao!.longitude,
      raio_km: raio,
    }),
    enabled: !!localizacao,
    staleTime: 30 * 60 * 1000,
  });

  const praias = nearbyData?.praias;

  const onRefresh = useCallback(async () => {
    await recarregar();
    refetch();
  }, [recarregar, refetch]);

  const abrirPraia = (praia: PraiaComDistancia) =>
    router.push(`/beach/${praia.id}`);

  const principal = praias?.[0] ?? null;
  const alternativas = praias?.slice(1) ?? [];

  // Estado de carregamento de localização
  if (locCarregando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.carregandoTexto}>Obtendo localização...</Text>
      </View>
    );
  }

  // Erro de localização
  if (erro) {
    return (
      <View style={styles.centrado}>
        <EmptyState
          icon="location-outline"
          titulo="Localização necessária"
          subtitulo="Permita o acesso à localização para ver as praias próximas."
        />
        <Pressable style={styles.botaoTentar} onPress={recarregar}>
          <Text style={styles.botaoTentarTexto}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>
            {saudacao()}{user?.nome ? `, ${primeiroNome(user.nome)}` : ''}
          </Text>
          {localizacao?.cidade && (
            <View style={styles.localRow}>
              <Ionicons name="location-outline" size={13} color={colors.accent} />
              <Text style={styles.localTexto}>{localizacao!.cidade}</Text>
            </View>
          )}
        </View>

        {/* Filtro de raio */}
        <View style={styles.raioContainer}>
          {[30, 50, 100].map(r => (
            <Pressable
              key={r}
              style={[styles.raioBotao, raio === r && styles.raioBotaoAtivo]}
              onPress={() => setRaio(r)}
            >
              <Text style={[styles.raioTexto, raio === r && styles.raioTextoAtivo]}>
                {r}km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Carregando praias */}
      {isLoading && (
        <View style={styles.centradoInline}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {/* Erro de API */}
      {isError && (
        <EmptyState
          icon="cloud-offline-outline"
          titulo="Erro ao carregar"
          subtitulo="Verifique sua conexão e puxe para atualizar."
        />
      )}

      {/* Sem praias */}
      {!isLoading && !isError && praias?.length === 0 && (
        <EmptyState
          icon="search-outline"
          titulo="Nenhuma praia encontrada"
          subtitulo={`Não há praias cadastradas em ${raio} km. Tente aumentar o raio.`}
        />
      )}

      {/* Praia principal (destaque) */}
      {principal && (
        <>
          <Text style={styles.secaoTitulo}>Melhor opção agora</Text>
          <BeachCard praia={principal} onPress={() => abrirPraia(principal)} destaque />
        </>
      )}

      {/* Alternativas */}
      {alternativas.length > 0 && (
        <>
          <Text style={styles.secaoTitulo}>Outras opções próximas</Text>
          {alternativas.map(p => (
            <BeachCard key={p.id} praia={p} onPress={() => abrirPraia(p)} />
          ))}
        </>
      )}

      {/* Espaço no final */}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function primeiroNome(nome: string) {
  return nome.split(' ')[0];
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
    gap: spacing.md,
  },
  centrado: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  centradoInline: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  carregandoTexto: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  saudacao: {
    ...typography.h2,
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  localTexto: {
    ...typography.small,
    color: colors.accent,
  },
  raioContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  raioBotao: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 16,
  },
  raioBotaoAtivo: {
    backgroundColor: colors.accent,
  },
  raioTexto: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  raioTextoAtivo: {
    color: colors.bg,
  },
  secaoTitulo: {
    ...typography.h3,
    marginBottom: -spacing.xs,
  },
  botaoTentar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  botaoTentarTexto: {
    ...typography.body,
    color: colors.bg,
    fontWeight: '700',
  },
});
