// Loaded once at bootstrap: armor, shield, melee, ranged and firearms all resolve materials.

import { state } from "../../../state.js";
import { fetchMaterials } from "../../../api.js";

const data = state.data;

export async function loadMaterials() {
  data.materials = await fetchMaterials();
}
