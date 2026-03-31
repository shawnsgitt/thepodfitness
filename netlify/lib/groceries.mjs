import { getStore } from "@netlify/blobs";

const STORE_NAME = "grocery-list";

function getGroceryStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Add a grocery item.
 * @param {{ name: string, category: string }} data
 */
export async function addGroceryItem({ name, category }) {
  const store = getGroceryStore();
  const id = generateId();
  const item = {
    id,
    name,
    category: category || "Other",
    checked: false,
    createdAt: new Date().toISOString(),
  };
  await store.setJSON(`item/${id}`, item);
  return item;
}

/**
 * Get a grocery item by ID.
 */
export async function getGroceryItem(id) {
  const store = getGroceryStore();
  return await store.get(`item/${id}`, { type: "json" });
}

/**
 * List all grocery items, sorted by category then name.
 */
export async function listGroceryItems() {
  const store = getGroceryStore();
  const { blobs } = await store.list({ prefix: "item/" });
  const items = [];
  for (const blob of blobs) {
    const item = await store.get(blob.key, { type: "json" });
    if (item) items.push(item);
  }
  items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return items;
}

/**
 * Toggle checked status of a grocery item.
 */
export async function toggleGroceryItem(id) {
  const store = getGroceryStore();
  const item = await store.get(`item/${id}`, { type: "json" });
  if (!item) return null;
  item.checked = !item.checked;
  await store.setJSON(`item/${id}`, item);
  return item;
}

/**
 * Delete a grocery item.
 */
export async function deleteGroceryItem(id) {
  const store = getGroceryStore();
  await store.delete(`item/${id}`);
}

/**
 * Save the meal plan.
 */
export async function saveMealPlan(plan) {
  const store = getGroceryStore();
  await store.setJSON("meal-plan", plan);
}

/**
 * Get the meal plan.
 */
export async function getMealPlan() {
  const store = getGroceryStore();
  return await store.get("meal-plan", { type: "json" });
}

/**
 * Bulk add grocery items (skips duplicates by name).
 */
export async function bulkAddGroceries(items) {
  const existing = await listGroceryItems();
  const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
  const added = [];
  for (const item of items) {
    if (!existingNames.has(item.name.toLowerCase())) {
      const result = await addGroceryItem(item);
      added.push(result);
    }
  }
  return added;
}
