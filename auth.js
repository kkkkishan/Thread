import { supabase } from './supabaseClient.js';

const authState = {
  user: null,
  loading: true,
};

export async function initializeAuth(onChange) {
  authState.user = supabase.auth.user();
  authState.loading = false;
  onChange(authState);

  supabase.auth.onAuthStateChange((event, session) => {
    authState.user = session?.user || null;
    authState.loading = false;
    onChange(authState, { event });
  });
}

export async function signUpWithEmail(email, password) {
  const { user, error } = await supabase.auth.signUp({ email, password });
  return { user, error };
}

export async function signInWithEmail(email, password) {
  const { user, error } = await supabase.auth.signIn({ email, password });
  return { user, error };
}

export async function signInWithProvider(provider) {
  const { error } = await supabase.auth.signIn({ provider }, { redirectTo: window.location.origin });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.api.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { error };
}

export function getUser() {
  return authState.user;
}
