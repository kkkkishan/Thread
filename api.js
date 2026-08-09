import { supabase } from './supabaseClient.js';

export async function fetchNotes() {
  const response = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
  if (response.error) throw response.error;
  return response.data;
}

export async function createNote(note) {
  const response = await supabase.from('notes').insert([note]).single();
  if (response.error) throw response.error;
  return response.data;
}

export async function updateNoteById(id, updates) {
  const response = await supabase.from('notes').update(updates).eq('id', id).single();
  if (response.error) throw response.error;
  return response.data;
}

export async function deleteNoteById(id) {
  const response = await supabase.from('notes').delete().eq('id', id).single();
  if (response.error) throw response.error;
  return response.data;
}

export async function fetchUserProfile() {
  const user = supabase.auth.user();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    user_metadata: user.user_metadata,
  };
}
