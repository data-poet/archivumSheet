// A repo-ally file with no character_name (e.g. elementals/earth's size-tiered files) is
// identified by its trailing _NN instead — see ALLIES_FEATURE.md. Shared by the add-form
// selector (picks a tier instead of a name) and the fork step (bakes the label into the new
// local ally, since the catalog id itself doesn't survive forking).

import { t } from "../localization/pt-BR/index.js";

export function tierOf(allyId) {
  return allyId?.match(/_(\d+)$/)?.[1] ?? null;
}

export function tierLabel(allyId) {
  const tier = tierOf(allyId);
  if (!tier) return allyId ?? "";
  return t(`allies.tierNames.${tier}`, `${t("allies.tierLabel")} ${tier}`);
}
