// Badge circular com score colorido (verde/âmbar/vermelho)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scoreColor, scoreLabel, colors, typography } from '../theme';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: Props) {
  const cor = scoreColor(score);
  const dim = size === 'sm' ? 36 : size === 'md' ? 48 : 64;
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 18 : 24;

  return (
    <View style={styles.wrapper}>
      <View style={[
        styles.badge,
        { width: dim, height: dim, borderRadius: dim / 2, borderColor: cor }
      ]}>
        <Text style={[styles.score, { fontSize, color: cor }]}>
          {score.toFixed(1)}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: cor }]}>{scoreLabel(score)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  score: {
    fontWeight: '700',
  },
  label: {
    ...typography.tiny,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
