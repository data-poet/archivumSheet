// Sparse patch over a catalog ally — never a snapshot, so a catalog rebalance still propagates
// to every character fielding that ally (decision #3 in ALLIES_FEATURE.md). Touches only
// character.primary.*/character.secondary.*, matching the resume's editable whitelist
// (decision #4) — nothing else about a repo ally can be overridden.

function _mergeAttr(base, patch) {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return patch;
  return { ...base, ...patch };
}

function _mergeSection(base = {}, overrides) {
  if (!overrides) return base;

  const merged = { ...base };
  Object.entries(overrides).forEach(([key, value]) => {
    merged[key] = _mergeAttr(base[key], value);
  });
  return merged;
}

export function applyOverlay(catalogAlly, overrides) {
  if (!catalogAlly) return catalogAlly;
  if (!overrides || Object.keys(overrides).length === 0) return catalogAlly;

  return {
    ...catalogAlly,
    character: {
      ...catalogAlly.character,
      primary: _mergeSection(catalogAlly.character?.primary, overrides.primary),
      secondary: _mergeSection(catalogAlly.character?.secondary, overrides.secondary),
    },
  };
}
