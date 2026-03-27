// Card de condições meteorológicas — vento, ondulação, temperatura, roupa
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { translateDirection } from '../utils/windDirection';
import type { Condicoes } from '../types';

interface Props {
  condicoes: Condicoes;
  compact?: boolean;
}

interface ItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function Item({ icon, label, value }: ItemProps) {
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <View style={styles.itemTexto}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ConditionsCard({ condicoes, compact = false }: Props) {
  const { wind_speed, wind_direction, swell_height, swell_direction,
          swell_period, water_temp_c, air_temp_c, roupa } = condicoes;

  const alturaFt = swell_height != null
    ? `${(swell_height * 3.281).toFixed(1)} pés`
    : 'N/D';

  const alturaM = swell_height != null
    ? `(${swell_height.toFixed(2)} m)`
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.grade}>
        <Item
          icon="water-outline"
          label="Ondulação"
          value={swell_height != null
            ? `${alturaFt} ${alturaM} · ${swell_direction ? translateDirection(swell_direction) : 'N/D'}`
            : 'N/D'}
        />
        <Item
          icon="time-outline"
          label="Período"
          value={swell_period != null ? `${swell_period}s` : 'N/D'}
        />
        <Item
          icon="navigate-outline"
          label="Vento"
          value={wind_speed != null
            ? `${wind_speed} nós · ${wind_direction ? translateDirection(wind_direction) : 'N/D'}`
            : 'N/D'}
        />
        {!compact && (
          <>
            <Item
              icon="thermometer-outline"
              label="Água"
              value={water_temp_c != null ? `${water_temp_c}°C` : 'N/D'}
            />
            <Item
              icon="sunny-outline"
              label="Ar"
              value={air_temp_c != null ? `${air_temp_c}°C` : 'N/D'}
            />
          </>
        )}
      </View>

      {/* Recomendação de roupa */}
      <View style={styles.roupa}>
        <Ionicons name="shirt-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.roupaTexto}>{roupa}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '46%',
  },
  itemTexto: {
    flex: 1,
  },
  itemLabel: {
    ...typography.tiny,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemValue: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  roupa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  roupaTexto: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
