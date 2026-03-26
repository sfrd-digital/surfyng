// PlansScreen — comparativo Free / Pro / Global com Stripe app-to-web
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { colors, spacing, typography, radius } from '../src/theme';

// ─── Dados dos planos ─────────────────────────────────────────────────────────

type PlanoId = 'free' | 'pro' | 'global';

interface RecursoLinha {
  label: string;
  free:   string | boolean;
  pro:    string | boolean;
  global: string | boolean;
}

const RECURSOS: RecursoLinha[] = [
  { label: 'Praias próximas',      free: 'Raio 50 km',    pro: 'Raio 200 km',   global: 'Raio 500 km' },
  { label: 'Alertas de score',     free: '1 alerta',      pro: 'Ilimitados',    global: 'Ilimitados'  },
  { label: 'Histórico condições',  free: false,           pro: '30 dias',       global: '90 dias'     },
  { label: 'Previsão estendida',   free: false,           pro: false,           global: '7 dias'      },
  { label: 'Praias internacionais',free: false,           pro: false,           global: true          },
  { label: 'Posts na comunidade',  free: true,            pro: true,            global: true          },
  { label: 'Anúncios',            free: true,            pro: false,           global: false         },
];

interface PlanoCard {
  id:           PlanoId;
  nome:         string;
  preco:        string | null;
  periodo:      string;
  destaque:     boolean;
  checkoutPath: string | null;
}

const PLANOS: PlanoCard[] = [
  { id: 'free',   nome: 'Free',   preco: null,       periodo: 'Grátis',   destaque: false, checkoutPath: null },
  { id: 'pro',    nome: 'Pro',    preco: 'R$ 19,90', periodo: '/mês',     destaque: true,  checkoutPath: '/checkout/pro' },
  { id: 'global', nome: 'Global', preco: 'R$ 39,90', periodo: '/mês',     destaque: false, checkoutPath: '/checkout/global' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CelulaValor({ valor, destaque }: { valor: string | boolean; destaque: boolean }) {
  if (typeof valor === 'boolean') {
    return (
      <Ionicons
        name={valor ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={valor ? (destaque ? colors.accent : colors.success) : colors.textSecondary}
      />
    );
  }
  return (
    <Text style={[celulaStyles.texto, destaque && celulaStyles.textoDestaque]} numberOfLines={1}>
      {valor}
    </Text>
  );
}

const celulaStyles = StyleSheet.create({
  texto:         { ...typography.tiny, color: colors.textSecondary, textAlign: 'center' },
  textoDestaque: { color: colors.accent, fontWeight: '700' },
});

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const { user, token } = useAuthStore();
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://app.surfyng.com.br';
  const planoAtual = user?.plano ?? 'free';

  const assinar = (plano: PlanoCard) => {
    if (!plano.checkoutPath) return;
    if (!token) {
      Alert.alert('Erro', 'Você precisa estar logado para assinar.');
      return;
    }
    // Deep link de retorno: surfyng://payment-success
    const returnUrl  = encodeURIComponent('surfyng://payment-success');
    const cancelUrl  = encodeURIComponent('surfyng://payment-cancel');
    const url = `${webUrl}${plano.checkoutPath}?token=${encodeURIComponent(token)}&return_url=${returnUrl}&cancel_url=${cancelUrl}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o checkout.')
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Pressable style={styles.fecharBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.titulo}>Planos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitulo}>
          Nunca mais perca uma boa sessão por falta de informação.
        </Text>

        {/* Cards de preço dos 3 planos */}
        <View style={styles.cardsRow}>
          {PLANOS.map(plano => {
            const atual = planoAtual === plano.id;
            return (
              <View key={plano.id} style={[styles.precoCard, plano.destaque && styles.precoCardDestaque]}>
                {plano.destaque && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularTexto}>Popular</Text>
                  </View>
                )}
                <Text style={styles.precoNome}>{plano.nome}</Text>
                {plano.preco ? (
                  <>
                    <Text style={[styles.preco, plano.destaque && styles.precoDestaque]}>{plano.preco}</Text>
                    <Text style={styles.periodo}>{plano.periodo}</Text>
                  </>
                ) : (
                  <Text style={[styles.preco, { fontSize: 20 }]}>Grátis</Text>
                )}

                <Pressable
                  style={[
                    styles.botao,
                    plano.destaque && styles.botaoDestaque,
                    (atual || !plano.checkoutPath) && styles.botaoDesabilitado,
                  ]}
                  onPress={() => assinar(plano)}
                  disabled={atual || !plano.checkoutPath}
                >
                  <Text style={[styles.botaoTexto, plano.destaque && styles.botaoTextoDestaque]}>
                    {atual ? 'Plano atual' : plano.preco ? `Assinar` : 'Atual'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Tabela comparativa */}
        <View style={styles.tabela}>
          <Text style={styles.tabelaTitulo}>Comparativo de recursos</Text>

          {/* Cabeçalho da tabela */}
          <View style={styles.tabelaHeader}>
            <View style={styles.colLabel} />
            {PLANOS.map(p => (
              <View key={p.id} style={[styles.colValor, p.destaque && styles.colDestaque]}>
                <Text style={[styles.colNome, p.destaque && styles.colNomeDestaque]}>{p.nome}</Text>
              </View>
            ))}
          </View>

          {/* Linhas */}
          {RECURSOS.map((rec, i) => (
            <View key={i} style={[styles.tabelaLinha, i % 2 === 0 && styles.tabelaLinhaAlternada]}>
              <View style={styles.colLabel}>
                <Text style={styles.recursoLabel} numberOfLines={2}>{rec.label}</Text>
              </View>
              {PLANOS.map(p => (
                <View key={p.id} style={[styles.colValor, p.destaque && styles.colDestaque]}>
                  <CelulaValor valor={rec[p.id]} destaque={p.destaque} />
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.rodape}>
          Pagamento seguro via Stripe. Cancele a qualquer momento.
        </Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  fecharBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  titulo: { ...typography.h2 },
  conteudo: { padding: spacing.md, gap: spacing.lg },
  subtitulo: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },

  // Cards de preço
  cardsRow: { flexDirection: 'row', gap: spacing.sm },
  precoCard: {
    flex: 1, backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  precoCardDestaque: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(34,211,238,0.06)',
  },
  popularBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    marginBottom: 4,
  },
  popularTexto: { fontSize: 10, fontWeight: '700', color: colors.bg },
  precoNome: { ...typography.small, fontWeight: '700', color: colors.textSecondary },
  preco: {
    fontSize: 26, fontWeight: '800', color: colors.textPrimary, lineHeight: 32,
  },
  precoDestaque: { color: colors.accent },
  periodo: { ...typography.tiny, color: colors.textSecondary, marginBottom: spacing.xs },
  botao: {
    width: '100%', paddingVertical: spacing.xs + 2,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent,
    alignItems: 'center', marginTop: spacing.xs,
  },
  botaoDestaque: { backgroundColor: colors.accent },
  botaoDesabilitado: { opacity: 0.45 },
  botaoTexto: { ...typography.tiny, color: colors.accent, fontWeight: '700' },
  botaoTextoDestaque: { color: colors.bg },

  // Tabela
  tabela: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', gap: 0,
  },
  tabelaTitulo: {
    ...typography.small, fontWeight: '700',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabelaHeader: { flexDirection: 'row', paddingVertical: spacing.sm },
  colLabel: { flex: 2, paddingLeft: spacing.sm },
  colValor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  colDestaque: { backgroundColor: 'rgba(34,211,238,0.04)' },
  colNome: { ...typography.tiny, color: colors.textSecondary, fontWeight: '700' },
  colNomeDestaque: { color: colors.accent },
  tabelaLinha: { flexDirection: 'row', paddingVertical: spacing.sm, alignItems: 'center' },
  tabelaLinhaAlternada: { backgroundColor: 'rgba(255,255,255,0.02)' },
  recursoLabel: { ...typography.tiny, color: colors.textSecondary, paddingLeft: spacing.sm, lineHeight: 16 },

  rodape: { ...typography.tiny, color: colors.textSecondary, textAlign: 'center' },
});
