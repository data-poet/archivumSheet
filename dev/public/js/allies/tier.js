// A repo-ally file with no character_name (e.g. elementals/earth's size-tiered files) is
// identified by its trailing _NN instead. Shared by the add-form selector (picks a tier
// instead of a name) and the fork step (bakes the label into the new local ally, since the
// catalog id itself doesn't survive forking).

import { t } from "../localization/pt-BR/index.js";

export function tierOf(allyId) {
  return allyId?.match(/_(\d+)$/)?.[1] ?? null;
}

// tierList picks which localized label set the number resolves against (see helpers/
// alliesCatalog.js's tierList resolution and data/allies/tierLogic.config.json) — a type
// with more tiers than "default" covers just needs its own list, not new matching logic.
export function tierLabel({ ally_id, tierList = "default" } = {}) {
  const tier = tierOf(ally_id);
  if (!tier) return ally_id ?? "";
  return t(`allies.tierLists.${tierList}.${tier}`, `${t("allies.tierLabel")} ${tier}`);
}
