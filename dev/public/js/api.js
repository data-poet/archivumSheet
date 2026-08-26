// ===== GENERIC HELPER =====
async function getJSON(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }

  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`POST ${url} failed: ${res.status}`);
  }

  return res.json();
}

// ===== LOADERS =====
export async function fetchAdvantages() {
  return getJSON("/api/advantages");
}

export async function fetchDisadvantages() {
  return getJSON("/api/disadvantages");
}

export async function fetchSkills() {
  return getJSON("/api/skills");
}

export async function fetchSpells() {
  return getJSON("/api/spells");
}

export async function fetchRaces() {
  return getJSON("/api/races");
}

export async function fetchMaterials() {
  return getJSON("/api/materials");
}

export async function fetchArmors() {
  return getJSON("/api/armors");
}

export async function fetchShields() {
  return getJSON("/api/shields");
}

export async function fetchMeleeWeapons() {
  return getJSON("/api/melee_weapons");
}

export async function fetchRangedWeapons() {
  return getJSON("/api/ranged_weapons");
}

export async function fetchFirearms() {
  return getJSON("/api/firearms");
}

export async function fetchAmmo() {
  return getJSON("/api/ammo");
}

export async function fetchAmmoContainers() {
  return getJSON("/api/ammo_containers");
}

export async function fetchAlchemy() {
  return getJSON("/api/alchemy");
}

export async function fetchSurvivalGear() {
  return getJSON("/api/survival_gear");
}

export async function fetchAccessories() {
  return getJSON("/api/accessories");
}

export async function fetchMagicGear() {
  return getJSON("/api/magic_gear");
}

export async function fetchEnchantments() {
  return getJSON("/api/enchantments");
}

export async function fetchEnchantmentEffectTypes() {
  return getJSON("/api/enchantments/effect-types");
}

export async function fetchDualUseWeapons() {
  return getJSON("/api/inventory/dual-use-weapons");
}

export async function fetchMagicGearEquipLimits() {
  return getJSON("/api/magic-gear/equip-limits");
}

// ===== ENGINE =====
export async function buildSheet(payload) {
  return postJSON("/api/sheet/build", payload);
}
