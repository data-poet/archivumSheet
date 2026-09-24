// Where the allies page's attribute edits land. Mirrors PC_EDIT_TARGET's interface (see
// shared/editTarget.js and engine/character/traits/pcEditTarget.js) so the shared resume
// stepper markup/handler work unmodified on both pages.
//
// A repo ally's edits go through the sparse overlay (patchOverride) so a later catalog
// rebalance still applies; a forked/local ally has no overlay, so its
// character.primary/secondary are mutated directly.

import { loadStore, saveStore } from "../store/characterStoreCore.js";
import { isRepoAlly } from "./catalog.js";
import { getActiveAllyInstanceId, getRoster, patchOverride } from "../store/allies/allies.js";

function _activeRosterEntry() {
  const instanceId = getActiveAllyInstanceId();
  return getRoster().find((e) => e._instanceId === instanceId) ?? null;
}

function _mutateLocalAlly(ally_id, mutate) {
  const store = loadStore();
  const entry = store?.list.find((c) => c.id === ally_id);
  if (!entry) return;

  if (!entry.data.character) entry.data.character = {};
  mutate(entry.data.character);
  saveStore(store);
}

function _ensureSecondary(character, name) {
  if (!character.secondary) character.secondary = {};
  if (!character.secondary[name]) {
    character.secondary[name] = { bought: 0, modifier: 0 };
  }
}

export function createAllyEditTarget(onChange) {
  return {
    setPrimaryModifier(attr, value) {
      const roster = _activeRosterEntry();
      if (!roster) return;

      if (isRepoAlly(roster.ally_id)) {
        patchOverride(roster._instanceId, `primary.${attr}.modifier`, value);
      } else {
        _mutateLocalAlly(roster.ally_id, (character) => {
          if (!character.primary) character.primary = {};
          character.primary[attr] = {
            ...(character.primary[attr] ?? {}),
            modifier: value,
          };
        });
      }
      onChange();
    },

    ensureSecondary(name) {
      const roster = _activeRosterEntry();
      if (!roster || isRepoAlly(roster.ally_id)) return;
      _mutateLocalAlly(roster.ally_id, (character) => _ensureSecondary(character, name));
    },

    setSecondary(name, field, value) {
      const roster = _activeRosterEntry();
      if (!roster) return;

      if (isRepoAlly(roster.ally_id)) {
        patchOverride(roster._instanceId, `secondary.${name}.${field}`, value);
      } else {
        _mutateLocalAlly(roster.ally_id, (character) => {
          _ensureSecondary(character, name);
          character.secondary[name][field] = value;
        });
      }
      onChange();
    },
  };
}
