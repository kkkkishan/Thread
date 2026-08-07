import { initializeNotes, updateNote, deleteNote, addTag, removeTag, connectNotes, disconnectNotes, persistNotes, createNote } from './data.js';
import { renderGraph } from './graph.js';
import { loadTheme, saveTheme } from './storage.js';

const state = {
  notes: [],
  activeNoteId: null,
  searchQuery: '',
  sortMode: 'updated',
  autoSaveTimeout: null,
};

const dom = {
  noteList: document.getElementById('note-list'),
  newNoteBtn: document.getElementById('new-note-btn'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  saveNoteBtn: document.getElementById('save-note-btn'),
  deleteNoteBtn: document.getElementById('delete-note-btn'),
  noteTitle: document.getElementById('note-title'),
  noteContent: document.getElementById('note-content'),
  noteEditor: document.getElementById('note-editor'),
  emptyState: document.getElementById('empty-state'),
  noteTitleLabel: document.getElementById('note-title-label'),
  createdDate: document.getElementById('created-date'),
  updatedDate: document.getElementById('updated-date'),
  tagInput: document.getElementById('tag-input'),
  addTagBtn: document.getElementById('add-tag-btn'),
  tagList: document.getElementById('tag-list'),
  addConnectionBtn: document.getElementById('add-connection-btn'),
  linkedNotes: document.getElementById('linked-notes'),
  confirmModal: document.getElementById('confirm-modal'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  graphSvg: document.getElementById('graph-svg'),
  graphEmpty: document.getElementById('graph-empty'),
  themeToggle: document.getElementById('theme-toggle'),
  connectionModal: document.getElementById('connection-modal'),
  connectionSelect: document.getElementById('connection-select'),
  cancelConnectionBtn: document.getElementById('cancel-connection-btn'),
  confirmConnectionBtn: document.getElementById('confirm-connection-btn'),
};

function formatDate(epoch) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epoch));
}

function sortNotes(notes, mode) {
  const items = [...notes];
  if (mode === 'created') {
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }
  if (mode === 'title') {
    return items.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

function filterNotes(notes, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return notes;
  return notes.filter((note) => {
    const values = [note.title, note.content, ...note.tags].join(' ').toLowerCase();
    return values.includes(normalized);
  });
}

function getActiveNote() {
  return state.notes.find((note) => note.id === state.activeNoteId) || null;
}

function updateStorage() {
  persistNotes(state.notes);
}

function selectNote(id) {
  state.activeNoteId = id;
  renderEditor();
  renderSidebar();
  renderGraph();
}

function renderSidebar() {
  const notes = sortNotes(filterNotes(state.notes, state.searchQuery), state.sortMode);
  dom.noteList.innerHTML = '';

  if (!notes.length) {
    const placeholder = document.createElement('div');
    placeholder.className = 'empty-state';
    placeholder.innerHTML = '<h3>No notes yet</h3><p>Create your first note to begin building a thread of ideas.</p>';
    dom.noteList.appendChild(placeholder);
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `note-card${note.id === state.activeNoteId ? ' active' : ''}`;
    card.addEventListener('click', () => selectNote(note.id));

    const title = document.createElement('h3');
    title.textContent = note.title || 'Untitled note';

    const preview = document.createElement('p');
    preview.textContent = note.content.slice(0, 80) || 'Open to edit your content.';

    const tagRow = document.createElement('div');
    tagRow.className = 'preview-tags';
    note.tags.slice(0, 3).forEach((tag) => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = tag;
      tagRow.appendChild(pill);
    });

    card.appendChild(title);
    card.appendChild(preview);
    card.appendChild(tagRow);
    dom.noteList.appendChild(card);
  });
}

function renderEditor() {
  const note = getActiveNote();
  if (!note) {
    dom.noteEditor.classList.add('hidden');
    dom.emptyState.classList.remove('hidden');
    dom.noteTitleLabel.textContent = 'Select a note or create one';
    return;
  }

  dom.noteEditor.classList.remove('hidden');
  dom.emptyState.classList.add('hidden');
  dom.noteTitleLabel.textContent = note.title || 'Untitled note';
  dom.noteTitle.value = note.title;
  dom.noteContent.value = note.content;
  dom.createdDate.textContent = formatDate(note.createdAt);
  dom.updatedDate.textContent = formatDate(note.updatedAt);
  renderTagList(note);
  renderLinkedNotes(note);
}

function renderTagList(note) {
  dom.tagList.innerHTML = '';
  if (!note.tags.length) {
    const placeholder = document.createElement('span');
    placeholder.className = 'hint-text';
    placeholder.textContent = 'No tags yet. Add a tag to label this note.';
    dom.tagList.appendChild(placeholder);
    return;
  }
  note.tags.forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = tag;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = `Remove ${tag}`;
    remove.addEventListener('click', () => {
      state.notes = removeTag(state.notes, note.id, tag);
      updateStorage();
      renderEditor();
      renderSidebar();
      renderGraph();
    });

    chip.appendChild(remove);
    dom.tagList.appendChild(chip);
  });
}

function renderLinkedNotes(note) {
  dom.linkedNotes.innerHTML = '';
  if (!note.connections.length) {
    dom.linkedNotes.innerHTML = '<p class="hint-text">No linked notes yet. Add a connection to build the graph.</p>';
    return;
  }

  note.connections.forEach((targetId) => {
    const targetNote = state.notes.find((item) => item.id === targetId);
    if (!targetNote) return;
    const row = document.createElement('div');
    row.className = 'linked-note';

    const title = document.createElement('strong');
    title.textContent = targetNote.title || 'Untitled note';

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';

    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = 'Open';
    open.className = 'secondary-button';
    open.addEventListener('click', () => selectNote(targetNote.id));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      state.notes = disconnectNotes(state.notes, note.id, targetNote.id);
      updateStorage();
      renderEditor();
      renderGraph();
      renderSidebar();
    });

    controls.appendChild(open);
    controls.appendChild(remove);
    row.appendChild(title);
    row.appendChild(controls);
    dom.linkedNotes.appendChild(row);
  });
}

function renderGraph() {
  const anyConnections = state.notes.some((note) => note.connections.length > 0);
  if (!anyConnections) {
    dom.graphEmpty.classList.remove('hidden');
  } else {
    dom.graphEmpty.classList.add('hidden');
  }

  renderGraph(dom.graphSvg, state.notes, state.activeNoteId, selectNote);
}

function showModal(modal) {
  modal.classList.remove('hidden');
}

function hideModal(modal) {
  modal.classList.add('hidden');
}

function startAutoSave() {
  if (state.autoSaveTimeout) {
    window.clearTimeout(state.autoSaveTimeout);
  }
  state.autoSaveTimeout = window.setTimeout(() => {
    persistActiveNote();
  }, 800);
}

function persistActiveNote() {
  const note = getActiveNote();
  if (!note) return;
  const title = dom.noteTitle.value;
  const content = dom.noteContent.value;
  state.notes = updateNote(state.notes, note.id, { title, content });
  updateStorage();
  renderSidebar();
  renderEditor();
  renderGraph();
}

function createNewNote() {
  const note = createNote({ title: 'New note', content: '', tags: [] });
  state.notes = [note, ...state.notes];
  state.activeNoteId = note.id;
  updateStorage();
  render();
  dom.noteTitle.focus();
}

function attachEvents() {
  dom.newNoteBtn.addEventListener('click', createNewNote);
  dom.saveNoteBtn.addEventListener('click', persistActiveNote);
  dom.deleteNoteBtn.addEventListener('click', () => showModal(dom.confirmModal));
  dom.cancelDeleteBtn.addEventListener('click', () => hideModal(dom.confirmModal));
  dom.confirmDeleteBtn.addEventListener('click', () => {
    if (!state.activeNoteId) return;
    state.notes = deleteNote(state.notes, state.activeNoteId);
    state.activeNoteId = state.notes[0]?.id || null;
    updateStorage();
    hideModal(dom.confirmModal);
    render();
  });

  dom.searchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderSidebar();
  });

  dom.sortSelect.addEventListener('change', (event) => {
    state.sortMode = event.target.value;
    renderSidebar();
  });

  dom.noteTitle.addEventListener('input', startAutoSave);
  dom.noteContent.addEventListener('input', startAutoSave);
  dom.tagInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addNewTag();
    }
  });
  dom.addTagBtn.addEventListener('click', addNewTag);
  dom.addConnectionBtn.addEventListener('click', openConnectionModal);
  dom.cancelConnectionBtn.addEventListener('click', () => hideModal(dom.connectionModal));
  dom.confirmConnectionBtn.addEventListener('click', () => {
    const targetId = dom.connectionSelect.value;
    if (!targetId || !state.activeNoteId) return;
    state.notes = connectNotes(state.notes, state.activeNoteId, targetId);
    updateStorage();
    hideModal(dom.connectionModal);
    renderEditor();
    renderGraph();
    renderSidebar();
  });

  dom.themeToggle.addEventListener('click', toggleTheme);
}

function addNewTag() {
  const note = getActiveNote();
  if (!note) return;
  const tag = dom.tagInput.value.trim();
  if (!tag) return;
  state.notes = addTag(state.notes, note.id, tag);
  dom.tagInput.value = '';
  updateStorage();
  renderEditor();
  renderSidebar();
}

function openConnectionModal() {
  const note = getActiveNote();
  if (!note) return;
  dom.connectionSelect.innerHTML = '';
  const choices = state.notes.filter((item) => item.id !== note.id && !note.connections.includes(item.id));
  if (!choices.length) {
    dom.connectionSelect.innerHTML = '<option value="">No eligible notes</option>';
  } else {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose a note';
    dom.connectionSelect.appendChild(placeholder);
    choices.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.title || 'Untitled';
      dom.connectionSelect.appendChild(option);
    });
  }
  showModal(dom.connectionModal);
}

function applyTheme(themeName) {
  const htmlElement = document.documentElement;
  if (themeName === 'dark') {
    htmlElement.classList.add('dark-theme');
    dom.themeToggle.textContent = '☀️';
  } else if (themeName === 'light') {
    htmlElement.classList.remove('dark-theme');
    dom.themeToggle.textContent = '🌙';
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    htmlElement.classList.toggle('dark-theme', prefersDark);
    dom.themeToggle.textContent = prefersDark ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const current = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

function loadInitialTheme() {
  const stored = loadTheme();
  applyTheme(stored === 'system' ? 'system' : stored);
}

function render() {
  renderSidebar();
  renderEditor();
  renderGraph();
}

export function initializeApp() {
  state.notes = initializeNotes();
  state.activeNoteId = state.notes[0]?.id || null;
  attachEvents();
  loadInitialTheme();
  render();
}
