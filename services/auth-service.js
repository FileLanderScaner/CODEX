import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const LOCAL_USER_KEY = '@ahorroya:local-user';

export async function getCurrentUser() {
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    return data.session?.user ?? null;
  }

  const stored = await AsyncStorage.getItem(LOCAL_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function signInWithEmail(email, password) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    return data.user;
  }

  const user = {
    id: 'local-user',
    email,
    app_metadata: {},
    user_metadata: { plan: 'free' },
  };
  await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  return user;
}

export async function signUpWithEmail(email, password) {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('Cuenta creada. Revisa tu email para confirmar el acceso antes de entrar.');
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        plan: 'free',
      });
      if (profileError) {
        throw profileError;
      }
    }

    return data.user;
  }

  return signInWithEmail(email, password);
}

export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return;
  }

  await AsyncStorage.removeItem(LOCAL_USER_KEY);
}

export async function getProfile(userId, email) {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }

    const profile = { id: userId, email, plan: 'free' };
    await supabase.from('profiles').upsert(profile);
    return profile;
  }

  return { id: userId || 'local-user', email, plan: 'free' };
}
