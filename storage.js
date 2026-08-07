const STORAGE_KEY = 'thread-notes-v1';
const THEME_KEY = 'thread-theme-v1';

export function loadNotes() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse saved notes', error);
    return null;
  }
}

export function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'system';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
