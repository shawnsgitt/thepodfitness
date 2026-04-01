import { getStore } from "@netlify/blobs";

/**
 * @typedef {Object} WorkoutNote
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} body
 * @property {string} mood - one of: great, good, okay, tough
 * @property {string} createdAt - ISO date string
 * @property {string} updatedAt - ISO date string
 */

const STORE_NAME = "workout-notes";

function getNotesStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Create a new workout note.
 * @param {{ userId: string, title: string, body: string, mood?: string }} data
 * @returns {Promise<WorkoutNote>}
 */
export async function createNote({ userId, title, body, mood }) {
  const store = getNotesStore();
  const id = generateId();
  const now = new Date().toISOString();
  const note = {
    id,
    userId,
    title,
    body: body || "",
    mood: mood || "good",
    createdAt: now,
    updatedAt: now,
  };
  await store.setJSON(`note/${id}`, note);
  return note;
}

/**
 * Get a single note by ID.
 * @param {string} id
 * @returns {Promise<WorkoutNote|null>}
 */
export async function getNoteById(id) {
  const store = getNotesStore();
  return await store.get(`note/${id}`, { type: "json" });
}

/**
 * List all notes, sorted by createdAt descending.
 * @returns {Promise<WorkoutNote[]>}
 */
export async function listNotes() {
  const store = getNotesStore();
  const { blobs } = await store.list({ prefix: "note/" });
  const notes = [];
  for (const blob of blobs) {
    const note = await store.get(blob.key, { type: "json" });
    if (note) notes.push(note);
  }
  notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return notes;
}

/**
 * Update an existing note.
 * @param {string} id
 * @param {{ title?: string, body?: string, mood?: string }} updates
 * @returns {Promise<WorkoutNote|null>}
 */
export async function updateNote(id, updates) {
  const store = getNotesStore();
  const existing = await store.get(`note/${id}`, { type: "json" });
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await store.setJSON(`note/${id}`, updated);
  return updated;
}

/**
 * Delete a note by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteNote(id) {
  const store = getNotesStore();
  await store.delete(`note/${id}`);
}
