import { state } from "../state.js";
import { fetchRules } from "../api.js";

// The numbers live in helpers/rules.js; the browser reads them from /api/rules at bootstrap.
export async function loadRules() {
  state.data.rules = await fetchRules();
}

// An attribute without its own entry follows the default, as it does in the engine's resolveSecondary.
export function secondaryMaxBought(key) {
  const { SECONDARY_PURCHASE, DEFAULT_SECONDARY_PURCHASE } = state.data.rules;
  return (SECONDARY_PURCHASE[key] ?? DEFAULT_SECONDARY_PURCHASE).maxBought ?? 0;
}

export function isUnbuyableSecondary(key) {
  return secondaryMaxBought(key) === 0;
}
