import { getStore } from "@netlify/blobs";

const ADMIN_PIN = process.env.ADMIN_PIN || "5678";

function calcScore({ sessions, streak, totalSets, avgRating, consistency, completionRate }) {
  const sessionPts = (sessions || 0) * 10;
  const streakPts = (streak || 0) * 15;
  const setPts = (totalSets || 0) * 1;
  const consistencyPts = Math.round(((completionRate || 0) / 100) * 50);
  const raw = sessionPts + streakPts + setPts + consistencyPts;
  const ratingMult = avgRating ? Math.max(0.6, avgRating / 5) : 0.8;
  return Math.round(raw * ratingMult);
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export default async (req) => {
  const store = getStore({ name: "leaderboard", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "user/" });
    const entries = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) entries.push(data);
    }
    entries.sort((a, b) => b.score - a.score || b.sessions - a.sessions || b.streak - a.streak);
    entries.forEach((e, i) => { e.rank = i + 1; });
    return new Response(JSON.stringify({ leaderboard: entries }), { headers: corsHeaders });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
    }

    // Admin action: verify PIN and perform admin operations
    if (body.adminAction) {
      // Allow self-delete without admin PIN
      if (body.adminAction === "deleteUser" && body.pin === "__self__" && body.userId) {
        await store.delete(`user/${body.userId}`);
        return new Response(JSON.stringify({ success: true, deleted: body.userId }), { headers: corsHeaders });
      }

      if (body.pin !== ADMIN_PIN) {
        return new Response(JSON.stringify({ error: "Invalid admin PIN" }), { status: 403, headers: corsHeaders });
      }

      if (body.adminAction === "deleteUser") {
        if (!body.userId) {
          return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: corsHeaders });
        }
        await store.delete(`user/${body.userId}`);
        return new Response(JSON.stringify({ success: true, deleted: body.userId }), { headers: corsHeaders });
      }

      if (body.adminAction === "deleteAll") {
        const { blobs } = await store.list({ prefix: "user/" });
        for (const blob of blobs) {
          await store.delete(blob.key);
        }
        return new Response(JSON.stringify({ success: true, deleted: blobs.length }), { headers: corsHeaders });
      }

      if (body.adminAction === "verify") {
        return new Response(JSON.stringify({ success: true, verified: true }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Unknown admin action" }), { status: 400, headers: corsHeaders });
    }

    const { userId, name, avatar, sessions, streak, totalSets, avgRating, consistency, completionRate, targetDays, gender, lastSession } = body;
    if (!userId || !name) {
      return new Response(JSON.stringify({ error: "userId and name required" }), { status: 400, headers: corsHeaders });
    }

    const score = calcScore({ sessions, streak, totalSets, avgRating, consistency, completionRate });

    const entry = {
      userId,
      name,
      avatar: avatar || "🦾",
      sessions: sessions || 0,
      streak: streak || 0,
      totalSets: totalSets || 0,
      avgRating: avgRating || 0,
      consistency: consistency || 0,
      completionRate: completionRate || 0,
      targetDays: targetDays || 0,
      gender: gender || "",
      score,
      lastSession: lastSession || null,
      updatedAt: new Date().toISOString(),
    };

    await store.setJSON(`user/${userId}`, entry);

    return new Response(JSON.stringify({ success: true, entry }), { headers: corsHeaders });
  }

  if (req.method === "OPTIONS") {
    return new Response("", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/leaderboard",
};
