// ─────────────────────────────────────────────────────────────────────────────
// CRAFTING MATERIALS  (ES module — dev/public layer)
//
// Loaded once at bootstrap rather than per equipment type. Armor, shield, melee,
// ranged and firearms all resolve materials, and each used to await its own
// fetchMaterials() inside its load*() — five identical requests for one catalog.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from "../../../state.js";
import { fetchMaterials } from "../../../api.js";

const data = state.data;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadMaterials() {
  data.materials = await fetchMaterials();
}
