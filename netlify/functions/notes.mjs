import { createNote, getNoteById, listNotes, updateNote, deleteNote } from "../lib/data.mjs";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { headers: CORS });
  }

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/api\/notes\/?/, "").split("/").filter(Boolean);
  const noteId = segments[0] || null;

  try {
    // GET /api/notes — list all
    // GET /api/notes/:id — get one
    if (req.method === "GET") {
      if (noteId) {
        const note = await getNoteById(noteId);
        if (!note) return json({ error: "Note not found" }, 404);
        return json(note);
      }
      const notes = await listNotes();
      return json({ notes });
    }

    // POST /api/notes — create
    if (req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const { userId, title, mood } = body;
      if (!userId || !title || !title.trim()) {
        return json({ error: "userId and title are required" }, 400);
      }
      const note = await createNote({
        userId,
        title: title.trim(),
        body: (body.body || "").trim(),
        mood: mood || "good",
      });
      return json(note, 201);
    }

    // PUT /api/notes/:id — update
    if (req.method === "PUT") {
      if (!noteId) return json({ error: "Note ID required" }, 400);
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const updates = {};
      if (body.title !== undefined) updates.title = body.title.trim();
      if (body.body !== undefined) updates.body = body.body.trim();
      if (body.mood !== undefined) updates.mood = body.mood;
      const note = await updateNote(noteId, updates);
      if (!note) return json({ error: "Note not found" }, 404);
      return json(note);
    }

    // DELETE /api/notes/:id — delete
    if (req.method === "DELETE") {
      if (!noteId) return json({ error: "Note ID required" }, 400);
      const existing = await getNoteById(noteId);
      if (!existing) return json({ error: "Note not found" }, 404);
      await deleteNote(noteId);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("Notes API error:", err);
    return json({ error: "Internal server error" }, 500);
  }
};

export const config = {
  path: "/api/notes/*",
};
