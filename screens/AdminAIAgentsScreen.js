import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import SurfaceCard from '../components/ui/SurfaceCard';
import TopBar from '../components/ui/TopBar';
import { ui } from '../lib/ui';
import { readPublicFlag } from '../lib/runtime-mode';
import { getApiUrl } from '../lib/config';
import { getAuthHeaders } from '../services/account-service';
import { getAdminAIAgentsViewModel } from './admin-ai-agents-view-model';

export default function AdminAIAgentsScreen({ onBack }) {
  const enabled = useMemo(() => readPublicFlag('ENABLE_ADMIN_AI_PANEL'), []);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  const callAgentsApi = async (body = { action: 'list' }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl('/api/v1/ai/agents'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `ai_agents_${response.status}`);
    }
    return data.data;
  };

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;
    setLoading(true);
    Promise.all([
      callAgentsApi({ action: 'list' }),
      callAgentsApi({ action: 'history', limit: 10 }).catch(() => ({ executions: [] })),
      callAgentsApi({ action: 'suggestions', status: 'pending', limit: 10 }).catch(() => ({ suggestions: [] })),
    ])
      .then(([listPayload, historyPayload, suggestionsPayload]) => setPayload({
        ...listPayload,
        executions: historyPayload.executions || [],
        suggestions: suggestionsPayload.suggestions || [],
      }))
      .catch((apiError) => setError(apiError.message))
      .finally(() => setLoading(false));
  }, [enabled]);

  const runSafeAudit = async () => {
    setRunning(true);
    setError('');
    callAgentsApi({
      action: 'runAllSafe',
      dryRun: true,
      input: {
        QARegressionAgent: { checks: { lint: true, typecheck: true, tests: true, build: true } },
      },
    })
      .then(async (runPayload) => {
        const suggestionsPayload = await callAgentsApi({ action: 'suggestions', status: 'pending', limit: 10 }).catch(() => ({ suggestions: [] }));
        setPayload((current) => ({ ...(current || {}), ...runPayload, suggestions: suggestionsPayload.suggestions || [] }));
      })
      .catch((apiError) => setError(apiError.message))
      .finally(() => setRunning(false));
  };

  const viewModel = getAdminAIAgentsViewModel(payload, enabled);
  const results = viewModel.results;

  return (
    <View style={styles.wrapper}>
      <TopBar locationLabel="Admin" />
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>{"<"} Volver</Text>
      </Pressable>

      <SurfaceCard style={styles.headerCard}>
        <Text selectable style={styles.title}>Agentes IA</Text>
        <Text selectable style={styles.subtitle}>
          {enabled
            ? 'Panel habilitado. Las ejecuciones servidor usan dry-run por defecto y requieren rol admin.'
            : 'Panel bloqueado. Defini ENABLE_ADMIN_AI_PANEL=true solo en entornos controlados.'}
        </Text>
      </SurfaceCard>

      {enabled ? (
        <SurfaceCard style={styles.statusCard}>
          <Text selectable style={styles.actionTitle}>Estado</Text>
          <Text selectable style={styles.infoText}>IA: {String(viewModel.flags.aiAgents ?? false)} | Panel: {String(viewModel.flags.adminPanel ?? enabled)}</Text>
          <Text selectable style={styles.infoText}>Autonomia: {viewModel.runtime.autonomyLevel || 'LEVEL_0_READ_ONLY'} | Provider: {viewModel.runtime.provider || 'mock'}</Text>
          <Text selectable style={styles.infoText}>Dry-run: default true | Persistencia: {viewModel.memory.persistent ? 'Supabase' : 'fallback local'}</Text>
        </SurfaceCard>
      ) : null}

      {enabled ? (
        <SurfaceCard style={styles.actionCard}>
          <View style={styles.actionRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={styles.actionTitle}>Auditoria segura</Text>
              <Text selectable style={styles.agentMeta}>Ejecuta agentes seguros en dry-run desde servidor.</Text>
            </View>
            <Pressable accessibilityRole="button" disabled={running || loading} onPress={runSafeAudit} style={styles.runBtn}>
              {running ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.runBtnText}>Run</Text>}
            </Pressable>
          </View>
          {loading ? <ActivityIndicator color={ui.colors.primaryInk} /> : null}
          {error ? <Text selectable style={styles.errorText}>{error}</Text> : null}
        </SurfaceCard>
      ) : null}

      <View style={styles.grid}>
        {viewModel.agents.map((agent) => (
          <SurfaceCard key={agent.name} style={styles.agentCard}>
            <Text selectable style={styles.agentName}>{agent.name}</Text>
            <Text selectable style={styles.agentMeta}>{agent.permissionLevel} | riesgo {agent.risk}</Text>
            {agent.description ? <Text selectable style={styles.agentMeta}>{agent.description}</Text> : null}
          </SurfaceCard>
        ))}
      </View>

      {results.length ? (
        <SurfaceCard style={styles.infoCard}>
          <Text selectable style={styles.actionTitle}>Ultima ejecucion</Text>
          <Text selectable style={styles.infoText}>
            {results.length} agentes ejecutados. Bloqueados: {results.filter((result) => result.status === 'blocked').length}.
          </Text>
        </SurfaceCard>
      ) : null}

      {viewModel.suggestions.length ? (
        <SurfaceCard style={styles.infoCard}>
          <Text selectable style={styles.actionTitle}>Sugerencias pendientes</Text>
          <Text selectable style={styles.infoText}>{viewModel.suggestions.length} sugerencias esperando revision humana.</Text>
        </SurfaceCard>
      ) : null}

      {Platform.OS === 'web' ? (
        <SurfaceCard style={styles.infoCard}>
          <Text selectable style={styles.infoText}>
            API: POST /api/v1/ai/agents con action=list, run o runAllSafe. En produccion queda bloqueada sin aprobacion y variables correctas.
          </Text>
        </SurfaceCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  backBtn: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: ui.colors.surface,
  },
  backText: { color: ui.colors.text, fontWeight: '900' },
  headerCard: { gap: 8 },
  title: { ...ui.type.headline, color: ui.colors.text },
  subtitle: { ...ui.type.bodySm, color: '#667085' },
  grid: { gap: 10 },
  agentCard: { gap: 4 },
  agentName: { color: ui.colors.text, fontSize: 16, fontWeight: '900' },
  agentMeta: { color: '#667085', fontSize: 13, fontWeight: '700' },
  actionCard: { gap: 10 },
  statusCard: { gap: 6 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionTitle: { color: ui.colors.text, fontSize: 15, fontWeight: '900' },
  runBtn: {
    minHeight: 42,
    minWidth: 72,
    borderRadius: ui.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.colors.primaryInk,
    paddingHorizontal: 14,
  },
  runBtnText: { color: '#FFFFFF', fontWeight: '900' },
  errorText: { color: ui.colors.danger, fontSize: 13, fontWeight: '800' },
  infoCard: { backgroundColor: '#EEF4FF', borderColor: '#C7D7FE' },
  infoText: { color: '#1F2A37', fontSize: 13, lineHeight: 19 },
});
