// Single id generator for every inventory instance (and enchantment sub-entries).
// Real UUIDs mean imported and freshly-created ids can never collide, so there is
// no counter state to reset between sheet loads.
export function generateInstanceId() {
  return crypto.randomUUID();
}

// Walks an inventory category array and assigns an id to any entry missing one —
// used when loading/importing a sheet saved before ids existed.
export function ensureInstanceIds(entries) {
  for (const entry of entries) {
    if (!entry.id) entry.id = generateInstanceId();
  }
  return entries;
}

// Explodes legacy aggregated rows (no id, quantity > 1) into one id'd row per
// unit — used for categories that moved from a single stacked row per
// item+location to one row per unit. Rows that already have an id are assumed
// to already be in the per-unit shape and pass through untouched.
export function explodeToUnitRows(entries) {
  const result = [];
  for (const entry of entries) {
    if (entry.id) {
      result.push(entry);
      continue;
    }
    for (let i = 0; i < entry.quantity; i++) {
      result.push({ ...entry, quantity: 1, id: generateInstanceId() });
    }
  }
  return result;
}
