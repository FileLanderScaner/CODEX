import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ActivityFeed from '../components/ActivityFeed';
import MetricCard from '../components/MetricCard';
import { getProfile, signOut } from '../services/auth-service';
import { addTransaction, loadFinanceData } from '../services/finance-service';

const currencyFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'USD',
});

export default function DashboardScreen({ user, onSignOut, onOpenPremium }) {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [loadedProfile, finance] = await Promise.all([
          getProfile(user.id, user.email),
          loadFinanceData(user.id),
        ]);
        setProfile(loadedProfile);
        setTransactions(finance.transactions);
        setGoals(finance.goals);
      } catch (loadError) {
        setError(loadError.message || 'No pudimos cargar tus datos.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const metrics = useMemo(() => {
    const income = transactions
      .filter((item) => Number(item.amount) > 0)
      .reduce((total, item) => total + Number(item.amount), 0);
    const expenses = transactions
      .filter((item) => Number(item.amount) < 0)
      .reduce((total, item) => total + Math.abs(Number(item.amount)), 0);
    const balance = income - expenses;
    const mainGoal = goals[0] ?? { target_amount: 1100, current_amount: Math.max(balance, 0) };
    const progress = Math.min(Number(mainGoal.current_amount || 0) / Number(mainGoal.target_amount || 1), 1);

    return { income, expenses, balance, mainGoal, progress };
  }, [transactions, goals]);

  const submitTransaction = async () => {
    setError('');
    setSaving(true);

    try {
      if (!label.trim() || !amount.trim()) {
        throw new Error('Agrega una descripcion y un monto.');
      }

      const saved = await addTransaction(user.id, {
        label: label.trim(),
        amount: Number(amount.replace(',', '.')),
        category: category.trim() || 'General',
      });
      setTransactions((current) => [saved, ...current]);
      setLabel('');
      setAmount('');
      setCategory('');
    } catch (saveError) {
      setError(saveError.message || 'No pudimos guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text selectable style={styles.muted}>Cargando tu panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.kicker}>{profile?.plan === 'premium' ? 'Premium activo' : 'Plan gratuito'}</Text>
          <Text selectable style={styles.title}>Hola, {user.email}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={handleSignOut} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text selectable style={styles.summaryTitle}>Meta principal</Text>
        <Text selectable style={styles.summaryAmount}>{currencyFormatter.format(Number(metrics.mainGoal.current_amount || 0))}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: metrics.progress }]} />
          <View style={{ flex: 1 - metrics.progress }} />
        </View>
        <Text selectable style={styles.summaryNote}>
          Objetivo: {currencyFormatter.format(Number(metrics.mainGoal.target_amount || 0))}
        </Text>
      </View>

      <View style={styles.metrics}>
        <MetricCard label="Ingresos" value={currencyFormatter.format(metrics.income)} tone="good" />
        <MetricCard label="Gastos" value={currencyFormatter.format(metrics.expenses)} tone="bad" />
        <MetricCard label="Balance" value={currencyFormatter.format(metrics.balance)} tone={metrics.balance >= 0 ? 'good' : 'bad'} />
      </View>

      {profile?.plan !== 'premium' ? (
        <Pressable accessibilityRole="button" onPress={onOpenPremium} style={styles.upgradeBanner}>
          <Text selectable style={styles.upgradeTitle}>Desbloquear Premium</Text>
          <Text selectable style={styles.upgradeText}>Reportes avanzados, metas ilimitadas y exportacion.</Text>
        </Pressable>
      ) : null}

      <View style={styles.form}>
        <Text selectable style={styles.sectionTitle}>Nuevo movimiento</Text>
        <TextInput placeholder="Descripcion" value={label} onChangeText={setLabel} style={styles.input} />
        <View style={styles.formRow}>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="-25 o 100"
            value={amount}
            onChangeText={setAmount}
            style={[styles.input, styles.flexInput]}
          />
          <TextInput placeholder="Categoria" value={category} onChangeText={setCategory} style={[styles.input, styles.flexInput]} />
        </View>
        {error ? <Text selectable style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={submitTransaction} disabled={saving} style={styles.primaryButton}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar</Text>}
        </Pressable>
      </View>

      <ActivityFeed activities={transactions} currencyFormatter={currencyFormatter} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  loading: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  muted: {
    color: '#667085',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: '#027A48',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#101828',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#101828',
    borderRadius: 8,
    padding: 20,
  },
  summaryTitle: {
    color: '#D0D5DD',
    fontSize: 15,
  },
  summaryAmount: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    marginTop: 16,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#344054',
  },
  progressFill: {
    borderRadius: 8,
    backgroundColor: '#12B76A',
  },
  summaryNote: {
    marginTop: 8,
    fontSize: 14,
    color: '#D0D5DD',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 16,
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  flexInput: {
    flex: 1,
    minWidth: 130,
  },
  sectionTitle: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#101828',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#101828',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#344054',
    fontWeight: '800',
  },
  upgradeBanner: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  upgradeTitle: {
    color: '#05603A',
    fontSize: 16,
    fontWeight: '800',
  },
  upgradeText: {
    color: '#067647',
    fontSize: 14,
  },
  error: {
    color: '#B42318',
    fontSize: 13,
  },
});
