import {
  listGroceryItems,
  addGroceryItem,
  toggleGroceryItem,
  deleteGroceryItem,
  bulkAddGroceries,
  getMealPlan,
  saveMealPlan,
} from "../lib/groceries.mjs";

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
  const path = url.pathname.replace(/^\/api\/groceries\/?/, "");
  const segments = path.split("/").filter(Boolean);

  try {
    // GET /api/groceries/ — list all items
    // GET /api/groceries/meal-plan — get meal plan
    if (req.method === "GET") {
      if (segments[0] === "meal-plan") {
        const plan = await getMealPlan();
        return json({ plan: plan || null });
      }
      const items = await listGroceryItems();
      return json({ items });
    }

    // POST /api/groceries/ — add single item
    // POST /api/groceries/bulk — bulk add items
    // POST /api/groceries/meal-plan — save meal plan
    if (req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (segments[0] === "bulk") {
        if (!Array.isArray(body.items)) {
          return json({ error: "items array required" }, 400);
        }
        const added = await bulkAddGroceries(body.items);
        const all = await listGroceryItems();
        return json({ added: added.length, items: all }, 201);
      }

      if (segments[0] === "meal-plan") {
        if (!body.plan) {
          return json({ error: "plan required" }, 400);
        }
        await saveMealPlan(body.plan);
        return json({ success: true }, 201);
      }

      const { name, category } = body;
      if (!name || !name.trim()) {
        return json({ error: "name is required" }, 400);
      }
      const item = await addGroceryItem({
        name: name.trim(),
        category: category || "Other",
      });
      return json(item, 201);
    }

    // PUT /api/groceries/:id/toggle — toggle checked
    if (req.method === "PUT") {
      const id = segments[0];
      if (!id) return json({ error: "Item ID required" }, 400);
      const item = await toggleGroceryItem(id);
      if (!item) return json({ error: "Item not found" }, 404);
      return json(item);
    }

    // DELETE /api/groceries/:id — delete item
    if (req.method === "DELETE") {
      const id = segments[0];
      if (!id) return json({ error: "Item ID required" }, 400);
      await deleteGroceryItem(id);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("Groceries API error:", err);
    return json({ error: "Internal server error" }, 500);
  }
};

export const config = {
  path: "/api/groceries/*",
};
