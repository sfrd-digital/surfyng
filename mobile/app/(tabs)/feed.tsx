// FeedScreen — comunidade: posts de sessões por praia com estrelas e condições
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getFeed, likePost, unlikePost } from '../../src/api/posts';
import { useAuthStore } from '../../src/store/authStore';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, spacing, typography, radius } from '../../src/theme';
import { NIVEL_LABEL } from '../../src/types';
import { translateDirection } from '../../src/utils/windDirection';
import type { Post } from '../../src/types';

// ─── Subcomponente: 5 estrelas de rating ─────────────────────────────────────

function Estrelas({ rating, size = 14 }: { rating: number; size?: number }) {
  // rating 1-5 → estrelas cheias/vazias
  const cheias = Math.round(Math.max(1, Math.min(5, rating)));
  return (
    <View style={estrelasStyles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= cheias ? 'star' : 'star-outline'}
          size={size}
          color={i <= cheias ? '#FBBF24' : colors.textSecondary}
        />
      ))}
    </View>
  );
}

const estrelasStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});

// ─── Card de post ─────────────────────────────────────────────────────────────

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  const { autor, praia, rating, texto, fotos, likes, curtido, criado_em, condicoes_snapshot } = post;
  const dataFormatada = new Date(criado_em).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  });

  return (
    <View style={styles.card}>
      {/* Topo: avatar + autor + data */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {autor.foto
            ? <Image source={{ uri: autor.foto }} style={styles.avatarImg} />
            : <Ionicons name="person" size={20} color={colors.textSecondary} />
          }
        </View>
        <View style={styles.cardHeaderTexto}>
          <Text style={styles.autorNome}>{autor.nome ?? 'Surfista'}</Text>
          <Text style={styles.autorNivel}>{NIVEL_LABEL[autor.nivel]}</Text>
        </View>
        <Text style={styles.data}>{dataFormatada}</Text>
      </View>

      {/* Praia + rating */}
      <View style={styles.praiaRatingRow}>
        <View style={styles.praiaRow}>
          <Ionicons name="location-outline" size={12} color={colors.accent} />
          <Text style={styles.praiaNome} numberOfLines={1}>
            {praia.nome}{praia.cidade ? ` · ${praia.cidade}` : ''}
          </Text>
        </View>
        <Estrelas rating={rating} />
      </View>

      {/* Fotos */}
      {fotos.length > 0 && (
        <View style={styles.fotosContainer}>
          {fotos.length === 1 ? (
            <Image source={{ uri: fotos[0] }} style={styles.fotoUnica} resizeMode="cover" />
          ) : (
            <View style={styles.fotosGrade}>
              {fotos.slice(0, 4).map((uri, i) => (
                <View key={i} style={styles.fotoGradeWrap}>
                  <Image source={{ uri }} style={styles.fotoGrade} resizeMode="cover" />
                  {i === 3 && fotos.length > 4 && (
                    <View style={styles.fotoMaisOverlay}>
                      <Text style={styles.fotoMaisTexto}>+{fotos.length - 4}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Texto */}
      {texto ? (
        <Text style={styles.texto}>{texto}</Text>
      ) : null}

      {/* Condições do momento */}
      {condicoes_snapshot && (
        <View style={styles.condicoes}>
          {condicoes_snapshot.swell_height != null && (
            <View style={styles.condicaoItem}>
              <Ionicons name="water-outline" size={11} color={colors.accent} />
              <Text style={styles.condicaoTexto}>
                {(condicoes_snapshot.swell_height * 3.281).toFixed(1)} pés
              </Text>
            </View>
          )}
          {condicoes_snapshot.wind_speed != null && (
            <View style={styles.condicaoItem}>
              <Ionicons name="navigate-outline" size={11} color={colors.accent} />
              <Text style={styles.condicaoTexto}>
                {condicoes_snapshot.wind_speed} nós{condicoes_snapshot.wind_direction ? ` ${translateDirection(condicoes_snapshot.wind_direction)}` : ''}
              </Text>
            </View>
          )}
          {condicoes_snapshot.swell_period != null && (
            <View style={styles.condicaoItem}>
              <Ionicons name="time-outline" size={11} color={colors.accent} />
              <Text style={styles.condicaoTexto}>{condicoes_snapshot.swell_period}s</Text>
            </View>
          )}
        </View>
      )}

      {/* Rodapé: like */}
      <View style={styles.rodape}>
        <Pressable style={styles.likeBtn} onPress={onLike}>
          <Ionicons
            name={curtido ? 'heart' : 'heart-outline'}
            size={18}
            color={curtido ? '#EF4444' : colors.textSecondary}
          />
          <Text style={styles.likeTexto}>{likes}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function FeedScreen() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: feedData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['feed'],
    queryFn:  getFeed,
    staleTime: 5 * 60 * 1000,
  });
  const posts = feedData?.posts ?? [];

  const mutLike = useMutation({
    mutationFn: ({ id, curtido }: { id: string; curtido: boolean }) =>
      curtido ? unlikePost(id) : likePost(id),
    onMutate: async ({ id, curtido }) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const prev = qc.getQueryData(['feed']);
      qc.setQueryData(['feed'], (old: any) => old
        ? { ...old, posts: old.posts.map((p: Post) =>
            p.id === id
              ? { ...p, curtido: !curtido, likes: p.likes + (curtido ? -1 : 1) }
              : p
          )}
        : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['feed'], ctx?.prev),
  });

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => mutLike.mutate({ id: item.id, curtido: item.curtido })}
    />
  ), [mutLike]);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Comunidade</Text>
        <Pressable style={styles.botaoPostar} onPress={() => router.push('/post/create')}>
          <Ionicons name="add" size={20} color={colors.bg} />
          <Text style={styles.botaoPostarTexto}>Postar sessão</Text>
        </Pressable>
      </View>

      {isLoading && (
        <View style={styles.centrado}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      )}

      {isError && (
        <EmptyState icon="cloud-offline-outline" titulo="Erro ao carregar" subtitulo="Puxe para tentar novamente." />
      )}

      {!isLoading && !isError && (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching} onRefresh={refetch}
              tintColor={colors.accent} colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              titulo="Nenhum post ainda"
              subtitulo="Seja o primeiro a compartilhar uma sessão!"
            />
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
  },
  titulo: { ...typography.h2 },
  botaoPostar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, gap: 4,
  },
  botaoPostarTexto: { ...typography.small, color: colors.bg, fontWeight: '700' },
  lista: { padding: spacing.md, paddingBottom: spacing.xxl },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
  cardHeaderTexto: { flex: 1 },
  autorNome: { ...typography.body, fontWeight: '600' },
  autorNivel: { ...typography.tiny, color: colors.textSecondary },
  data: { ...typography.tiny, color: colors.textSecondary },

  praiaRatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  praiaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: spacing.sm },
  praiaNome: { ...typography.small, color: colors.accent, flex: 1 },

  // Fotos
  fotosContainer: { borderRadius: radius.md, overflow: 'hidden' },
  fotoUnica: { width: '100%', height: 200, borderRadius: radius.md },
  fotosGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  fotoGradeWrap: { width: '49%', aspectRatio: 1 },
  fotoGrade: { width: '100%', height: '100%' },
  fotoMaisOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  fotoMaisTexto: { ...typography.h2, color: '#fff' },

  texto: { ...typography.body, lineHeight: 22 },

  // Condições snapshot
  condicoes: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
    backgroundColor: 'rgba(10,79,110,0.25)',
    borderRadius: radius.sm, padding: spacing.sm,
  },
  condicaoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  condicaoTexto: { ...typography.tiny, color: colors.textPrimary },

  // Rodapé
  rodape: {
    flexDirection: 'row', paddingTop: spacing.xs,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: spacing.xs },
  likeTexto: { ...typography.small, color: colors.textSecondary },
});
