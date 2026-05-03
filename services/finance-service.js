import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase.js';

const TRANSACTIONS_KEY = '@ahorroya:transactions';
const GOALS_KEY = '@ahorroya:goals';

const DEFAULT_TRANSACTIONS = [
  { id: '1', label: 'Compra supermercado', amount: -45.8, category: 'Hogar', happened_at: '2026-04-20' },
  { id: '2', label: 'Ahorro automatico', amount: 20, category: 'Ahorro', happened_at: '2026-04-21' },
  { id: '3', label: 'Pago transporte', amount: -7.5, category: 'Movilidad', happened_at: '2026-04-23' },
  { id: '4', label: 'Ingreso extra', amount: 75, category: 'Ingresos', happened_at: '2026-04-25' },
];

const DEFAULT_GOALS = [
  { id: 'goal-1', name: 'Fondo de emergencia', target_amount: 1100, current_amount: 1240.5 },
];

export async function loadFinanceData(userId) {
  if (supabase && userId && userId !== 'local-user') {
    const [transactionsResponse, goalsResponse] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('happened_at', { ascending: false }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

    if (transactionsResponse.error) {
      throw transactionsResponse.error;
    }
    if (goalsResponse.error) {
      throw goalsResponse.error;
    }

    return {
      transactions: transactionsResponse.data ?? [],
      goals: goalsResponse.data ?? [],
    };
  }

  const [storedTransactions, storedGoals] = await Promise.all([
    AsyncStorage.getItem(TRANSACTIONS_KEY),
    AsyncStorage.getItem(GOALS_KEY),
  ]);

  if (!storedTransactions) {
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
  }
  if (!storedGoals) {
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(DEFAULT_GOALS));
  }

  return {
    transactions: storedTransactions ? JSON.parse(storedTransactions) : DEFAULT_TRANSACTIONS,
    goals: storedGoals ? JSON.parse(storedGoals) : DEFAULT_GOALS,
  };
}

export async function addTransaction(userId, transaction) {
  const payload = {
    label: transaction.label,
    amount: Number(transaction.amount),
    category: transaction.category || 'General',
    happened_at: transaction.happened_at || new Date().toISOString().slice(0, 10),
  };

  if (supabase && userId && userId !== 'local-user') {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const stored = await AsyncStorage.getItem(TRANSACTIONS_KEY);
  const transactions = stored ? JSON.parse(stored) : DEFAULT_TRANSACTIONS;
  const saved = { ...payload, id: `${Date.now()}` };
  const nextTransactions = [saved, ...transactions];
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(nextTransactions));
  return saved;
}
