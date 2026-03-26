// NotificationsScreen — lista de notificações push e alertas de score
import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getNotificacoes, marcarComoLida, marcarTodasComoLidas } from '../../src/api/notifications';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, spacing, typography, radius } from '../../src/theme';
import type { Notificacao } from '../../src/types';

const ICONE_TIPO: Record<string, keyof typeof Ionicons.glyphMap> = {
  alerta_score: 'trending-up-outline',
  sessao_like:  'heart-outline',
  sessao_nova:  'water-outline',
  sistema:      'information-circle-outline',
};

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notificacoes'],
    queryFn:  getNotificacoes,
    staleTime: 2 * 60 * 1000,
  });

  const mutLer = useMutation({
    mutationFn: marcarComoLida,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const mutLerTodas = useMutation({
    mutationFn: marcarTodasComoLidas,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const notificacoes = data?.notificacoes ?? [];
  const naoLidas     = data?.nao_lidas ?? 0;

  const renderItem = ({ item }: { item: Notificacao }) => {
    const icone = ICONE_TIPO[item.tipo] ?? 'notifications-outline';
    return (
      <Pressable
        style={[styles.item, !item.lida && styles.itemNaoLido]}
        onPress={() => !item.lida && mutLer.mutate(item.id)}
      >
        <View style={[styles.iconeContainer, !item.lida && styles.iconeContainerAtivo]}>
          <Ionicons name={icone} size={20} color={item.lida ? colors.textSecondary : colors.accent} />
        </View>
        <View style={styles.itemTexto}>
          <Text style={[styles.itemTitulo, !item.lida && styles.itemTituloAtivo]} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={styles.itemCorpo} numberOfLines={2}>{item.corpo}</Text>
          <Text style={styles.itemData}>
            {new Date(item.criado_em).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        {!item.lida && <View style={styles.dotNaoLido} />}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerEsquerda}>
          <Text style={styles.titulo}>Notificações</Text>
          {naoLidas > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{naoLidas}</Text>
            </View>
          )}
        </View>
        {naoLidas > 0 && (
          <Pressable
            onPress={() => mutLerTodas.mutate()}
            disabled={mutLerTodas.isPending}
          >
            <Text style={styles.lerTodas}>Marcar todas como lidas</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centrado}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              titulo="Sem notificações"
              subtitulo="Você será avisado quando houver boas condições nas suas praias favoritas."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titulo: {
    ...typography.h2,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bg,
  },
  lerTodas: {
    ...typography.small,
    color: colors.accent,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  itemNaoLido: {
    borderColor: 'rgba(34,211,238,0.3)',
    backgroundColor: 'rgba(34,211,238,0.04)',
  },
  iconeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeContainerAtivo: {
    backgroundColor: 'rgba(34,211,238,0.15)',
  },
  itemTexto: {
    flex: 1,
    gap: 3,
  },
  itemTitulo: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  itemTituloAtivo: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  itemCorpo: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  itemData: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dotNaoLido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
});
