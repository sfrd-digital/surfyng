// Card de praia — usado no Home (lista de alternativas) e na tela de Mapa
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography, scoreColor } from '../theme';
import { DIFICULDADE_LABEL } from '../types';
import { translateDirection } from '../utils/windDirection';
import { ScoreBadge } from './ScoreBadge';
import type { PraiaComDistancia } from '../types';

interface Props {
  praia: PraiaComDistancia;
  onPress: () => void;
  destaque?: boolean; // card maior para a praia principal
}

export function BeachCard({ praia, onPress, destaque = false }: Props) {
  const { nome, cidade, estado, dificuldade, distancia_km, condicoes } = praia;
  const score = condicoes?.score ?? null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        destaque && styles.cardDestaque,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(34,211,238,0.1)' }}
    >
      {/* Linha superior: nome + score */}
      <View style={styles.header}>
        <View style={styles.headerTexto}>
          <Text style={[styles.nome, destaque && styles.nomeDestaque]} numberOfLines={1}>
            {nome}
          </Text>
          <Text style={styles.local}>
            {cidade}{estado ? `, ${estado}` : ''}
          </Text>
        </View>
        {score != null && (
          <ScoreBadge score={score} size={destaque ? 'lg' : 'md'} showLabel={destaque} />
        )}
      </View>

      {/* Linha inferior: badges */}
      <View style={styles.badges}>
        {/* Distância */}
        <View style={styles.badge}>
          <Ionicons name="location-outline" size={11} color={colors.accent} />
          <Text style={styles.badgeText}>{distancia_km} km</Text>
        </View>

        {/* Dificuldade */}
        {dificuldade && (
          <View style={styles.badge}>
            <Ionicons name="trophy-outline" size={11} color={colors.accent} />
            <Text style={styles.badgeText}>{DIFICULDADE_LABEL[dificuldade]}</Text>
          </View>
        )}

        {/* Condições rápidas */}
        {condicoes && (
          <>
            {condicoes.swell_height != null && (
              <View style={styles.badge}>
                <Ionicons name="water-outline" size={11} color={colors.accent} />
                <Text style={styles.badgeText}>
                  {(condicoes.swell_height * 3.281).toFixed(1)} pés
                </Text>
              </View>
            )}
            {condicoes.wind_speed != null && (
              <View style={styles.badge}>
                <Ionicons name="navigate-outline" size={11} color={colors.accent} />
                <Text style={styles.badgeText}>
                  {condicoes.wind_speed} nós{condicoes.wind_direction ? ` ${translateDirection(condicoes.wind_direction)}` : ''}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Seta de navegação */}
        <View style={styles.seta}>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
      </View>

      {/* Barra de score na base do card destaque */}
      {destaque && score != null && (
        <View style={styles.scoreBarra}>
          <View style={[
            styles.scoreBarraFill,
            { width: `${score * 10}%` as any, backgroundColor: scoreColor(score) }
          ]} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  cardDestaque: {
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCardAlt,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTexto: {
    flex: 1,
  },
  nome: {
    ...typography.h3,
    fontSize: 16,
  },
  nomeDestaque: {
    fontSize: 22,
    fontWeight: '700',
  },
  local: {
    ...typography.small,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(10,79,110,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.tiny,
    color: colors.textPrimary,
  },
  seta: {
    marginLeft: 'auto',
  },
  scoreBarra: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarraFill: {
    height: 3,
    borderRadius: 2,
  },
});
