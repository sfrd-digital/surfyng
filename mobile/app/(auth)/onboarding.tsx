// Onboarding — 3 slides apresentando o app antes do login
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Dimensions, ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'navigate' as const,
    titulo: 'Encontre a melhor praia',
    descricao: 'O app analisa vento, ondulação e sua localização para indicar a praia ideal para surfar agora.',
  },
  {
    id: '2',
    icon: 'water' as const,
    titulo: 'Condições em tempo real',
    descricao: 'Dados do Windguru atualizados de hora em hora. Score de 0 a 10 para cada praia próxima.',
  },
  {
    id: '3',
    icon: 'people' as const,
    titulo: 'Comunidade de surfistas',
    descricao: 'Compartilhe sessões, fotos e dicas com outros surfistas da sua região.',
  },
];

export default function OnboardingScreen() {
  const [indice, setIndice] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const onViewChange = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setIndice(viewableItems[0].index ?? 0);
  }).current;

  const avancar = () => {
    if (indice < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: indice + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewChange}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={72} color={colors.accent} />
            </View>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.descricao}>{item.descricao}</Text>
          </View>
        )}
      />

      {/* Indicadores de página */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === indice && styles.dotAtivo]} />
        ))}
      </View>

      {/* Botão de avanço */}
      <Pressable style={styles.botao} onPress={avancar}>
        <Text style={styles.botaoTexto}>
          {indice === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.bg} />
      </Pressable>

      {/* Pular */}
      {indice < SLIDES.length - 1 && (
        <Pressable style={styles.pular} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.pularTexto}>Pular</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(34,211,238,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titulo: {
    ...typography.h1,
    textAlign: 'center',
  },
  descricao: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotAtivo: {
    backgroundColor: colors.accent,
    width: 24,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  botaoTexto: {
    ...typography.body,
    color: colors.bg,
    fontWeight: '700',
  },
  pular: {
    padding: spacing.sm,
  },
  pularTexto: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
