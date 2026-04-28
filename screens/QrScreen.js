import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import SurfaceCard from '../components/ui/SurfaceCard';
import { ui } from '../lib/ui';

export default function QrScreen({ text, onBack }) {
  const payload = useMemo(() => String(text || '').trim(), [text]);
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!payload) {
      setDataUrl('');
      return () => {};
    }

    if (Platform.OS !== 'web') {
      setDataUrl('');
      return () => {};
    }

    import('qrcode')
      .then((mod) => mod.toDataURL(payload, { margin: 1, width: 260 }))
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [payload]);

  const copy = async () => {
    if (!payload) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(payload);
      Alert.alert('Copiado', 'Texto copiado.');
      return;
    }
    Alert.alert('Copiar', payload);
  };

  return (
    <View style={{ gap: 14 }}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{"<"} Volver</Text>
      </Pressable>

      <SurfaceCard style={{ gap: 12 }}>
        <Text selectable style={styles.title}>QR para compartir</Text>
        <Text selectable style={styles.subtitle}>Escanea o copia el texto para invitar a alguien.</Text>

        {dataUrl ? (
          // Use a plain <img> to avoid adding native deps.
          <View style={styles.imgWrap}>
            <img alt="QR" src={dataUrl} style={{ width: 260, height: 260, borderRadius: 16, background: '#fff' }} />
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text selectable style={styles.placeholderText}>Generando QR...</Text>
          </View>
        )}

        <SurfaceCard style={styles.payloadBox} elevated={false}>
          <Text selectable style={styles.payload} numberOfLines={6}>{payload || 'Sin texto para codificar.'}</Text>
        </SurfaceCard>

        <Pressable accessibilityRole="button" onPress={copy} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Copiar texto</Text>
        </Pressable>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    backgroundColor: ui.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  title: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  subtitle: {
    color: '#667085',
    fontWeight: '600',
  },
  imgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    height: 260,
    borderRadius: 16,
    backgroundColor: ui.colors.surfaceLow,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#667085',
    fontWeight: '800',
  },
  payloadBox: {
    backgroundColor: ui.colors.surfaceLow,
    borderColor: ui.colors.outline,
  },
  payload: {
    color: ui.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});

