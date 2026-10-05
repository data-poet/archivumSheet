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
