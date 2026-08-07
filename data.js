import { loadNotes, saveNotes } from './storage.js';

function makeId() {
  return `note-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function timestamp() {
  return Date.now();
}

export function createNote({ title = '', content = '', tags = [], connections = [] } = {}) {
  const now = timestamp();
  return {
    id: makeId(),
    title,
    content,
    tags: [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))],
    connections: Array.from(new Set(connections)),
    createdAt: now,
    updatedAt: now,
  };
}

const samples = [
  createNote({
    title: 'Photosynthesis',
    content: 'Plants convert sunlight into energy using chlorophyll. This process powers ecosystems and links to cellular respiration.',
    tags: ['biology', 'plants', 'energy'],
  }),
  createNote({
    title: 'Cellular Respiration',
    content: 'Cells break down glucose to create ATP. This is how living organisms release stored energy.',
    tags: ['biology', 'energy', 'cells'],
  }),
  createNote({
    title: 'Project Plan',
    content: 'Outline objectives, milestones, and follow-up reflections. Connect research notes to conclusions to build stronger insights.',
    tags: ['planning', 'workflow', 'mindmap'],
  }),
];

export function initializeNotes() {
  const stored = loadNotes();
  if (stored?.length) {
    return stored;
  }

  samples[0].connections = [samples[1].id];
  samples[1].connections = [samples[0].id];
  samples[2].connections = [samples[0].id];

  saveNotes(samples);
  return samples;
}

export function updateNote(notes, id, updates) {
  return notes.map((note) => {
    if (note.id !== id) return note;
    return {
      ...note,
      ...updates,
      tags: updates.tags ? Array.from(new Set(updates.tags.filter(Boolean))) : note.tags,
      updatedAt: timestamp(),
    };
  });
}

export function deleteNote(notes, id) {
  const filtered = notes.filter((note) => note.id !== id);
  return filtered.map((note) => ({
    ...note,
    connections: note.connections.filter((connectedId) => connectedId !== id),
  }));
}

export function addTag(notes, id, tag) {
  const normalized = tag.trim();
  if (!normalized) return notes;
  return notes.map((note) => {
    if (note.id !== id) return note;
    const tags = Array.from(new Set([...note.tags, normalized]));
    return { ...note, tags, updatedAt: timestamp() };
  });
}

export function removeTag(notes, id, tag) {
  return notes.map((note) => {
    if (note.id !== id) return note;
    return {
      ...note,
      tags: note.tags.filter((current) => current !== tag),
      updatedAt: timestamp(),
    };
  });
}

export function connectNotes(notes, sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return notes;

  return notes.map((note) => {
    if (note.id === sourceId) {
      return {
        ...note,
        connections: Array.from(new Set([...note.connections, targetId])),
        updatedAt: timestamp(),
      };
    }
    if (note.id === targetId) {
      return {
        ...note,
        connections: Array.from(new Set([...note.connections, sourceId])),
        updatedAt: timestamp(),
      };
    }
    return note;
  });
}

export function disconnectNotes(notes, sourceId, targetId) {
  return notes.map((note) => {
    if (note.id !== sourceId && note.id !== targetId) return note;
    return {
      ...note,
      connections: note.connections.filter((connection) => connection !== (note.id === sourceId ? targetId : sourceId)),
      updatedAt: timestamp(),
    };
  });
}

export function persistNotes(notes) {
  saveNotes(notes);
  return notes;
}
