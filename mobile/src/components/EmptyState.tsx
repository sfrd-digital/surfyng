// Estado vazio reutilizável — quando não há dados para exibir
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo?: string;
}

export function EmptyState({ icon = 'search-outline', titulo, subtitulo }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.primary} />
      <Text style={styles.titulo}>{titulo}</Text>
      {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  titulo: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitulo: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
