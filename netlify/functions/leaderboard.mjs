import { getStore } from "@netlify/blobs";

function calcScore({ sessions, streak, totalSets, avgRating, consistency, completionRate }) {
  // Points breakdown:
  // - 10 pts per session completed
  // - 15 pts per week of streak
  // - 1 pt per completed set
  // - Consistency bonus: up to 50 pts based on completion rate
  // - Rating multiplier: avg rating / 5 (0.6 to 1.0 range, min 0.6)
  const sessionPts = (sessions || 0) * 10;
  const streakPts = (streak || 0) * 15;
  const setPts = (totalSets || 0) * 1;
  const consistencyPts = Math.round(((completionRate || 0) / 100) * 50);
  const raw = sessionPts + streakPts + setPts + consistencyPts;
  const ratingMult = avgRating ? Math.max(0.6, avgRating / 5) : 0.8;
  return Math.round(raw * ratingMult);
}

export default async (req) => {
  const store = getStore({ name: "leaderboard", consistency: "strong" });

  if (req.method === "GET") {
    // Return all leaderboard entries
    const { blobs } = await store.list({ prefix: "user/" });
    const entries = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) entries.push(data);
    }
    // Sort by score descending, then by sessions, then by streak
    entries.sort((a, b) => b.score - a.score || b.sessions - a.sessions || b.streak - a.streak);
    // Assign ranks
    entries.forEach((e, i) => { e.rank = i + 1; });
    return new Response(JSON.stringify({ leaderboard: entries }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { userId, name, avatar, sessions, streak, totalSets, avgRating, consistency, completionRate, targetDays, gender, lastSession } = body;
    if (!userId || !name) {
      return new Response(JSON.stringify({ error: "userId and name required" }), { status: 400 });
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

    return new Response(JSON.stringify({ success: true, entry }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
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
