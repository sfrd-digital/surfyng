// CreatePostScreen — modal para postar sessão: praia, estrelas, texto e fotos
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Image, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { createPost } from '../../src/api/posts';
import { listBeaches } from '../../src/api/beaches';
import { colors, spacing, typography, radius } from '../../src/theme';
import type { Praia } from '../../src/types';

// ─── Seletor de estrelas ──────────────────────────────────────────────────────

const LABELS = ['', 'Terrível', 'Fraca', 'Regular', 'Boa', 'Épica!'];
const EMOJIS = ['', '😢', '😕', '😐', '😄', '🤙'];

function SeletorEstrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <View style={estrelaStyles.container}>
      <View style={estrelaStyles.row}>
        {[1, 2, 3, 4, 5].map(i => (
          <Pressable key={i} onPress={() => onChange(i)} style={estrelaStyles.estrela}>
            <Ionicons
              name={i <= valor ? 'star' : 'star-outline'}
              size={38}
              color={i <= valor ? '#FBBF24' : colors.border}
            />
          </Pressable>
        ))}
      </View>
      {valor > 0 && (
        <Text style={estrelaStyles.label}>{EMOJIS[valor]} {LABELS[valor]}</Text>
      )}
    </View>
  );
}

const estrelaStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { ...typography.h3, color: colors.textSecondary },
});

// ─── Modal de busca de praia ──────────────────────────────────────────────────

function ModalBuscaPraia({
  visivel, onFechar, onSelecionar,
}: {
  visivel: boolean;
  onFechar: () => void;
  onSelecionar: (p: Praia) => void;
}) {
  const [busca, setBusca] = useState('');

  const { data: listData, isLoading } = useQuery({
    queryKey: ['beaches-list'],
    queryFn:  () => listBeaches({ limit: 200 }),
    staleTime: 60 * 60 * 1000,
    enabled: visivel,
  });

  const praias = (listData?.praias ?? []).filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.cidade ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.titulo}>Selecionar praia</Text>
          <Pressable onPress={onFechar}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Busca */}
        <View style={modalStyles.buscaContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={modalStyles.buscaInput}
            placeholder="Buscar por nome ou cidade..."
            placeholderTextColor={colors.textSecondary}
            value={busca}
            onChangeText={setBusca}
            autoFocus
          />
          {busca.length > 0 && (
            <Pressable onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={modalStyles.centrado}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={praias}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable style={modalStyles.item} onPress={() => { onSelecionar(item); onFechar(); }}>
                <View style={modalStyles.itemTexto}>
                  <Text style={modalStyles.itemNome}>{item.nome}</Text>
                  <Text style={modalStyles.itemLocal}>
                    {item.cidade}{item.estado ? `, ${item.estado}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={modalStyles.separador} />}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, paddingTop: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  titulo: { ...typography.h2 },
  buscaContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard,
    margin: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm,
  },
  buscaInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm,
  },
  itemTexto: { flex: 1 },
  itemNome: { ...typography.body, fontWeight: '500' },
  itemLocal: { ...typography.small, color: colors.textSecondary },
  separador: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md },
});

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function CreatePostScreen() {
  const qc = useQueryClient();

  const [rating, setRating]         = useState(0);
  const [texto, setTexto]           = useState('');
  const [praiaSelecionada, setPraia] = useState<Praia | null>(null);
  const [fotos, setFotos]           = useState<string[]>([]);
  const [modalPraia, setModalPraia] = useState(false);

  const mutCreate = useMutation({
    mutationFn: () => createPost({
      beach_id: praiaSelecionada!.id,
      rating,
      text:     texto.trim() || undefined,
      photos:   fotos.length > 0 ? fotos : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      router.back();
    },
    onError: () => Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.'),
  });

  const podeSalvar = rating > 0 && praiaSelecionada !== null;

  const adicionarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar fotos.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4 - fotos.length,
    });
    if (!resultado.canceled) {
      setFotos(prev => [...prev, ...resultado.assets.map(a => a.uri)].slice(0, 4));
    }
  }, [fotos.length]);

  const tirarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar fotos.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!resultado.canceled) {
      setFotos(prev => [...prev, resultado.assets[0].uri].slice(0, 4));
    }
  }, []);

  const removerFoto = useCallback((uri: string) => {
    setFotos(prev => prev.filter(f => f !== uri));
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable style={styles.fecharBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.titulo}>Nova sessão</Text>
          <Pressable
            style={[styles.publicarBtn, !podeSalvar && styles.publicarBtnDesabilitado]}
            onPress={() => mutCreate.mutate()}
            disabled={!podeSalvar || mutCreate.isPending}
          >
            {mutCreate.isPending
              ? <ActivityIndicator size="small" color={colors.bg} />
              : <Text style={styles.publicarTexto}>Publicar</Text>
            }
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Seleção de praia */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Praia *</Text>
            <Pressable style={styles.campoSelect} onPress={() => setModalPraia(true)}>
              <Ionicons name="location-outline" size={18} color={colors.accent} />
              <Text style={[styles.campoSelectTexto, !praiaSelecionada && styles.placeholder]}>
                {praiaSelecionada
                  ? `${praiaSelecionada.nome}${praiaSelecionada.cidade ? ` · ${praiaSelecionada.cidade}` : ''}`
                  : 'Selecionar praia'
                }
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Rating — 5 estrelas */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Como foi a sessão? *</Text>
            <SeletorEstrelas valor={rating} onChange={setRating} />
          </View>

          {/* Fotos */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Fotos (até 4)</Text>
            <View style={styles.fotosRow}>
              {fotos.map(uri => (
                <View key={uri} style={styles.fotoWrap}>
                  <Image source={{ uri }} style={styles.fotoThumb} resizeMode="cover" />
                  <Pressable style={styles.fotoRemover} onPress={() => removerFoto(uri)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
              {fotos.length < 4 && (
                <View style={styles.fotoBotoesContainer}>
                  <Pressable style={styles.fotoBotao} onPress={adicionarFoto}>
                    <Ionicons name="images-outline" size={24} color={colors.accent} />
                    <Text style={styles.fotoBotaoTexto}>Galeria</Text>
                  </Pressable>
                  <Pressable style={styles.fotoBotao} onPress={tirarFoto}>
                    <Ionicons name="camera-outline" size={24} color={colors.accent} />
                    <Text style={styles.fotoBotaoTexto}>Câmera</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Texto */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Descreva a sessão (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Ondas, condições, dicas para outros surfistas..."
              placeholderTextColor={colors.textSecondary}
              value={texto}
              onChangeText={setTexto}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{texto.length}/500</Text>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>

      {/* Modal de seleção de praia */}
      <ModalBuscaPraia
        visivel={modalPraia}
        onFechar={() => setModalPraia(false)}
        onSelecionar={setPraia}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  fecharBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  titulo: { ...typography.h3 },
  publicarBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, minWidth: 80, alignItems: 'center',
  },
  publicarBtnDesabilitado: { opacity: 0.4 },
  publicarTexto: { ...typography.body, color: colors.bg, fontWeight: '700' },
  form: { padding: spacing.md, gap: spacing.xl },
  campo: { gap: spacing.sm },
  campoLabel: { ...typography.small, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  campoSelect: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  campoSelectTexto: { ...typography.body, flex: 1 },
  placeholder: { color: colors.textSecondary },

  // Fotos
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fotoWrap: { position: 'relative' },
  fotoThumb: { width: 80, height: 80, borderRadius: radius.md },
  fotoRemover: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.bg, borderRadius: 10,
  },
  fotoBotoesContainer: { flexDirection: 'row', gap: spacing.sm },
  fotoBotao: {
    width: 80, height: 80, borderRadius: radius.md,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  fotoBotaoTexto: { ...typography.tiny, color: colors.accent },

  // Input de texto
  input: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, ...typography.body, color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  charCount: { ...typography.tiny, color: colors.textSecondary, textAlign: 'right' },
});
