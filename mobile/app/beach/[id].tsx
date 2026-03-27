// BeachDetailScreen — detalhes completos de uma praia
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getBeach, addFavorite, removeFavorite, refreshConditions } from '../../src/api/beaches';
import { criarAlerta } from '../../src/api/notifications';
import { useAuthStore } from '../../src/store/authStore';
import { ConditionsCard } from '../../src/components/ConditionsCard';
import { ScoreBadge } from '../../src/components/ScoreBadge';
import { colors, spacing, typography, radius, scoreColor } from '../../src/theme';
import { DIFICULDADE_LABEL } from '../../src/types';
import { translateDirection } from '../../src/utils/windDirection';

export default function BeachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc      = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [minScore, setMinScore] = useState(7);
  const [alertaModal, setAlertaModal] = useState(false);

  const { data: praia, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['beach', id],
    queryFn:  () => getBeach(id!),
    enabled:  !!id,
    staleTime: 30 * 60 * 1000,
  });

  const mutFav = useMutation({
    mutationFn: () => praia?.is_favorita ? removeFavorite(id!) : addFavorite(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beach', id] });
      // Atualiza lista de favoritas no store
      if (user && praia) {
        const novasFavs = praia.is_favorita
          ? user.praias_favoritas.filter(f => f.beach_id !== id)
          : [...user.praias_favoritas, {
              beach_id:   id!,
              beach_name: praia.nome,
              city:       praia.cidade ?? '',
            }];
        setUser({ ...user, praias_favoritas: novasFavs });
      }
    },
  });

  const mutRefresh = useMutation({
    mutationFn: () => refreshConditions(id!),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['beach', id] }),
  });

  const mutAlerta = useMutation({
    mutationFn: () => criarAlerta(id!, minScore),
    onSuccess:  () => {
      setAlertaModal(false);
      Alert.alert('Alerta criado!', `Você será notificado quando o score atingir ${minScore}.`);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError || !praia) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.erroTexto}>Praia não encontrada</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.voltarLink}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const score = praia.condicoes?.score ?? null;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Barra superior */}
        <View style={styles.topBar}>
          <Pressable style={styles.voltarBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.topBarAcoes}>
            {/* Atualizar condições */}
            <Pressable
              style={styles.iconeBtn}
              onPress={() => mutRefresh.mutate()}
              disabled={mutRefresh.isPending}
            >
              {mutRefresh.isPending
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
              }
            </Pressable>
            {/* Favoritar */}
            <Pressable
              style={styles.iconeBtn}
              onPress={() => mutFav.mutate()}
              disabled={mutFav.isPending}
            >
              <Ionicons
                name={praia.is_favorita ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={praia.is_favorita ? colors.accent : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Barra de score */}
        {score != null && (
          <View style={styles.scoreBar}>
            <View style={[
              styles.scoreBarFill,
              { width: `${score * 10}%` as any, backgroundColor: scoreColor(score) }
            ]} />
          </View>
        )}

        {/* Cabeçalho da praia */}
        <View style={styles.header}>
          <View style={styles.headerTexto}>
            <Text style={styles.nome}>{praia.nome}</Text>
            <Text style={styles.local}>
              {praia.cidade}{praia.estado ? `, ${praia.estado}` : ''}
            </Text>
          </View>
          {score != null && <ScoreBadge score={score} size="lg" showLabel />}
        </View>

        {/* Badges de características */}
        <View style={styles.badges}>
          {praia.dificuldade && (
            <BadgeInfo
              icone="trophy-outline"
              texto={DIFICULDADE_LABEL[praia.dificuldade]}
            />
          )}
          {praia.consistencia && (
            <BadgeInfo
              icone="pulse-outline"
              texto={`Consistência ${praia.consistencia === 'high' ? 'Alta' : praia.consistencia === 'medium' ? 'Média' : 'Baixa'}`}
            />
          )}
          {praia.melhor_estacao && (
            <BadgeInfo icone="sunny-outline" texto={`Melhor: ${praia.melhor_estacao}`} />
          )}
          {praia.tamanho_min_pes != null && praia.tamanho_max_pes != null && (
            <BadgeInfo
              icone="water-outline"
              texto={`${praia.tamanho_min_pes}–${praia.tamanho_max_pes} pés`}
            />
          )}
        </View>

        {/* Descrição */}
        {praia.descricao && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Sobre a praia</Text>
            <Text style={styles.descricao}>{praia.descricao}</Text>
          </View>
        )}

        {/* Condições atuais */}
        {praia.condicoes ? (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Condições agora</Text>
            <View style={styles.condicoesBox}>
              <ConditionsCard condicoes={praia.condicoes} />
            </View>
            <Text style={styles.cacheInfo}>
              Atualizado às{' '}
              {new Date(praia.condicoes.cache_expira_em).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.semCondicoes}>
            <Ionicons name="cloud-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.semCondicoesTexto}>Condições não disponíveis</Text>
          </View>
        )}

        {/* Temperaturas sazonais */}
        {(praia.temp_agua_verao != null || praia.temp_agua_inverno != null) && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Temperatura da água</Text>
            <View style={styles.tempsRow}>
              {praia.temp_agua_verao != null && (
                <View style={styles.tempItem}>
                  <Ionicons name="sunny" size={18} color="#F59E0B" />
                  <Text style={styles.tempLabel}>Verão</Text>
                  <Text style={styles.tempValor}>{praia.temp_agua_verao}°C</Text>
                </View>
              )}
              {praia.temp_agua_inverno != null && (
                <View style={styles.tempItem}>
                  <Ionicons name="snow" size={18} color="#60A5FA" />
                  <Text style={styles.tempLabel}>Inverno</Text>
                  <Text style={styles.tempValor}>{praia.temp_agua_inverno}°C</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Direções ideais */}
        {(praia.direcoes_swell.length > 0 || praia.direcoes_vento.length > 0) && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Condições ideais</Text>
            <View style={styles.direcoes}>
              {praia.direcoes_swell.length > 0 && (
                <View style={styles.direcaoGrupo}>
                  <Text style={styles.direcaoLabel}>Ondulação</Text>
                  <View style={styles.direcaoTags}>
                    {praia.direcoes_swell.map(d => (
                      <View key={d} style={styles.tag}>
                        <Text style={styles.tagTexto}>{translateDirection(d)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {praia.direcoes_vento.length > 0 && (
                <View style={styles.direcaoGrupo}>
                  <Text style={styles.direcaoLabel}>Vento</Text>
                  <View style={styles.direcaoTags}>
                    {praia.direcoes_vento.map(d => (
                      <View key={d} style={styles.tag}>
                        <Text style={styles.tagTexto}>{translateDirection(d)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Botão fixo: criar alerta */}
      <View style={styles.footerFixo}>
        <Pressable
          style={styles.botaoAlerta}
          onPress={() => setAlertaModal(true)}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.bg} />
          <Text style={styles.botaoAlertaTexto}>Criar alerta de score</Text>
        </Pressable>
        <Pressable
          style={styles.botaoPostar}
          onPress={() => router.push('/post/create')}
        >
          <Ionicons name="camera-outline" size={18} color={colors.accent} />
        </Pressable>
      </View>

      {/* Modal de score mínimo */}
      {alertaModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Alerta de score</Text>
            <Text style={styles.modalDesc}>
              Avise-me quando {praia.nome} atingir score mínimo de:
            </Text>
            <View style={styles.scoreSelector}>
              {[5, 6, 7, 8, 9].map(s => (
                <Pressable
                  key={s}
                  style={[styles.scoreBotao, minScore === s && styles.scoreBotaoAtivo]}
                  onPress={() => setMinScore(s)}
                >
                  <Text style={[styles.scoreBotaoTexto, minScore === s && styles.scoreBotaoTextoAtivo]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalBotoes}>
              <Pressable style={styles.modalCancelar} onPress={() => setAlertaModal(false)}>
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmar}
                onPress={() => mutAlerta.mutate()}
                disabled={mutAlerta.isPending}
              >
                {mutAlerta.isPending
                  ? <ActivityIndicator size="small" color={colors.bg} />
                  : <Text style={styles.modalConfirmarTexto}>Criar alerta</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

// ─── Badge de característica ──────────────────────────────────────────────────

function BadgeInfo({ icone, texto }: { icone: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icone} size={12} color={colors.accent} />
      <Text style={styles.badgeTexto}>{texto}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingBottom: spacing.xl },
  centrado: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', gap: spacing.lg,
  },
  erroTexto: { ...typography.h3 },
  voltarLink: { ...typography.body, color: colors.accent },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
  },
  voltarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarAcoes: { flexDirection: 'row', gap: spacing.sm },
  iconeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreBar: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.md,
  },
  scoreBarFill: { height: 3 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerTexto: { flex: 1 },
  nome: { ...typography.h1, fontSize: 26 },
  local: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  badges: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(10,79,110,0.4)',
    paddingHorizontal: spacing.sm, paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeTexto: { ...typography.tiny, color: colors.textPrimary },
  secao: { paddingHorizontal: spacing.md, marginTop: spacing.xl, gap: spacing.sm },
  secaoTitulo: { ...typography.h3 },
  descricao: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  condicoesBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cacheInfo: { ...typography.tiny, color: colors.textSecondary },
  semCondicoes: {
    marginHorizontal: spacing.md, marginTop: spacing.xl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
  },
  semCondicoesTexto: { ...typography.body, color: colors.textSecondary },
  tempsRow: { flexDirection: 'row', gap: spacing.md },
  tempItem: {
    flex: 1, backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  tempLabel: { ...typography.tiny, color: colors.textSecondary },
  tempValor: { ...typography.h3 },
  direcoes: { gap: spacing.md },
  direcaoGrupo: { gap: spacing.xs },
  direcaoLabel: { ...typography.small, color: colors.textSecondary },
  direcaoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: 'rgba(34,211,238,0.12)',
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.full,
  },
  tagTexto: { ...typography.small, color: colors.accent, fontWeight: '600' },
  footerFixo: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: spacing.sm,
  },
  botaoAlerta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md, borderRadius: radius.lg, gap: spacing.xs,
  },
  botaoAlertaTexto: { ...typography.body, color: colors.bg, fontWeight: '700' },
  botaoPostar: {
    width: 50, height: 50, borderRadius: radius.lg,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, gap: spacing.lg, width: '100%',
  },
  modalTitulo: { ...typography.h2 },
  modalDesc: { ...typography.body, color: colors.textSecondary },
  scoreSelector: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  scoreBotao: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  scoreBotaoAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  scoreBotaoTexto: { ...typography.h3, color: colors.textSecondary },
  scoreBotaoTextoAtivo: { color: colors.bg },
  modalBotoes: { flexDirection: 'row', gap: spacing.md },
  modalCancelar: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  modalCancelarTexto: { ...typography.body, color: colors.textSecondary },
  modalConfirmar: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.accent, alignItems: 'center',
  },
  modalConfirmarTexto: { ...typography.body, color: colors.bg, fontWeight: '700' },
});
