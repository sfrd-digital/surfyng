// MapScreen — mapa interativo com pins coloridos por score
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
// react-native-maps não é importado estaticamente — carregado apenas fora da web
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MapView: any, Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  ({ default: MapView, Marker, Callout } = require('react-native-maps'));
}
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getNearby } from '../../src/api/beaches';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, spacing, typography, radius, scoreColor } from '../../src/theme';
import type { PraiaComDistancia } from '../../src/types';

export default function MapScreen() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.centrado}>
        <Text style={typography.body}>Mapa disponível apenas no app mobile</Text>
      </View>
    );
  }

  const { localizacao, carregando, erro, recarregar } = useLocation();
  const mapRef = useRef<any>(null);

  const { data: nearbyData, isLoading } = useQuery({
    queryKey: ['beaches-nearby-map', localizacao?.latitude, localizacao?.longitude],
    queryFn:  () => getNearby({
      lat:     localizacao!.latitude,
      lng:     localizacao!.longitude,
      raio_km: 150,
    }),
    enabled:  !!localizacao,
    staleTime: 30 * 60 * 1000,
  });
  const praias = nearbyData?.praias;

  const irParaMinhaLocalizacao = () => {
    if (!localizacao) return;
    mapRef.current?.animateToRegion({
      latitude:        localizacao.latitude,
      longitude:       localizacao.longitude,
      latitudeDelta:   0.5,
      longitudeDelta:  0.5,
    }, 500);
  };

  if (carregando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (erro || !localizacao) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.erroTexto}>Localização necessária</Text>
        <Pressable style={styles.botao} onPress={recarregar}>
          <Text style={styles.botaoTexto}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const regiaoInicial = {
    latitude:       localizacao.latitude,
    longitude:      localizacao.longitude,
    latitudeDelta:  1.0,
    longitudeDelta: 1.0,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapa}
        initialRegion={regiaoInicial}
        mapType="satellite"
        showsUserLocation
        showsMyLocationButton={false}
      >
        {praias?.map(praia => (
          <PraiaMarcador
            key={praia.id}
            praia={praia}
            onPress={() => router.push(`/beach/${praia.id}`)}
          />
        ))}
      </MapView>

      {/* Botão de localização */}
      <Pressable style={styles.botaoLoc} onPress={irParaMinhaLocalizacao}>
        <Ionicons name="locate" size={22} color={colors.accent} />
      </Pressable>

      {/* Indicador de carregamento */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      )}

      {/* Legenda de score */}
      <View style={styles.legenda}>
        {[
          { label: '8–10', cor: '#059669' },
          { label: '5–7',  cor: '#D97706' },
          { label: '0–4',  cor: '#DC2626' },
        ].map(item => (
          <View key={item.label} style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: item.cor }]} />
            <Text style={styles.legendaTexto}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Marcador de praia ────────────────────────────────────────────────────────

function PraiaMarcador({ praia, onPress }: { praia: PraiaComDistancia; onPress: () => void }) {
  const score = praia.condicoes?.score ?? null;
  const cor   = score != null ? scoreColor(score) : colors.textSecondary;

  return (
    <Marker coordinate={{ latitude: praia.lat, longitude: praia.lng }}>
      {/* Pin personalizado */}
      <View style={[styles.pin, { backgroundColor: cor }]}>
        <Text style={styles.pinTexto}>
          {score != null ? score.toFixed(1) : '?'}
        </Text>
      </View>

      {/* Callout ao tocar */}
      <Callout tooltip onPress={onPress}>
        <View style={styles.callout}>
          <Text style={styles.calloutNome} numberOfLines={1}>{praia.nome}</Text>
          <Text style={styles.calloutLocal}>
            {praia.cidade}{praia.estado ? `, ${praia.estado}` : ''}
          </Text>
          <Text style={styles.calloutDist}>{praia.distancia_km} km • Toque para detalhes</Text>
        </View>
      </Callout>
    </Marker>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapa: {
    flex: 1,
  },
  centrado: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  erroTexto: {
    ...typography.h3,
  },
  botao: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  botaoTexto: {
    ...typography.body,
    color: colors.bg,
    fontWeight: '700',
  },
  botaoLoc: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingOverlay: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.bgCard,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  legenda: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.lg,
    backgroundColor: 'rgba(6,39,54,0.9)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendaTexto: {
    ...typography.tiny,
    color: colors.textPrimary,
  },
  pin: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 38,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  pinTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  callout: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 180,
    maxWidth: 240,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calloutNome: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calloutLocal: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calloutDist: {
    ...typography.tiny,
    color: colors.accent,
    marginTop: 4,
  },
});
