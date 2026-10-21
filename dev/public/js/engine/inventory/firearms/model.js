import { STORED_AT } from "../../../shared/constants.js";
import { state } from "../../../state.js";
import { fetchFirearms } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { createEquippableItemActions } from "../shared/equippableItemActions.js";

const data = state.data;
const selected = state.selected;

const {
  move: moveFirearm,
  remove: removeFirearm,
  sendToAlly: sendFirearmToAlly,
  saveCustomFields: saveFirearmCustomFields,
  addEnchantment: addFirearmEnchantment,
  updateEnchantment: updateFirearmEnchantment,
  removeEnchantment: removeFirearmEnchantment,
  findByInstanceId: findFirearmByInstanceId,
} = createEquippableItemActions("firearms", "weapon");

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadFirearms() {
  data.firearms = await fetchFirearms();

  loadFirearmSelectors();
}

export function loadFirearmSelectors() {
  updateFirearmTypeOptions();
  updateFirearmMaterialOptions();
}

export function updateFirearmTypeOptions() {
  const select = el("firearmTypeFilter");
  if (!select) return;

  const types = [...new Set(data.firearms.map((w) => w.weapon_type))].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("traits.typeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateFirearmNameOptions();
}

export function updateFirearmNameOptions() {
  const typeSelect = el("firearmTypeFilter");
  const nameSelect = el("firearmNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.firearms.filter((w) => w.weapon_type === typeFilter)
    : data.firearms;

  const names = [...new Set(filtered.map((w) => w.weapon_name))];
  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
  updateFirearmTierOptions();
}

export function updateFirearmTierOptions() {
  const nameSelect = el("firearmNameSelect");
  const tierSelect = el("firearmTierSelect");
  if (!nameSelect || !tierSelect) return;

  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.firearms
        .filter((w) => w.weapon_name === name)
        .map((w) => w.weapon_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((tier) => ({ value: tier, label: tier })),
  );
}

export function updateFirearmMaterialOptions() {
  const materialSelect = el("firearmMaterialSelect");
  if (!materialSelect) return;

  populateSelect(
    materialSelect,
    data.materials.map((m) => ({
      value: m.material_name,
      label: m.material_name,
    })),
  );
}

export function equipFirearm(instanceId, weaponId, materialId = null) {
  const instance = findFirearmByInstanceId(instanceId);
  if (!instance) return;

  instance.weapon_id = weaponId;
  instance.material_id = materialId;
  instance.is_equipped = true;
  instance.storedAt = null;

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

function _newFirearmInstance(weaponId, materialId, isEquipped, storedAt) {
  return {
    id: generateInstanceId(),
    weapon_id: weaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    gdp_modifier: 0,
    tr_modifier: 0,
    prec_modifier: 0,
    magazine_size_modifier: 0,
    rounds_loaded: 0,
    is_equipped: isEquipped,
    storedAt,
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  };
}

export function addEquippedFirearm(weaponId, materialId = null) {
  if (!weaponId) return;

  selected.firearms.push(_newFirearmInstance(weaponId, materialId, true, null));

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function addStoredFirearm(
  weaponId,
  materialId = null,
  storedAt = STORED_AT.BACKPACK,
) {
  if (!weaponId) return;

  selected.firearms.push(
    _newFirearmInstance(weaponId, materialId, false, storedAt),
  );

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export {
  moveFirearm,
  removeFirearm,
  sendFirearmToAlly,
  findFirearmByInstanceId,
};

export function computeFinalMagazineSize(instance, weaponData) {
  const base = Number(weaponData?.weapon_magazine_size || 0);
  const modifier = Number(instance.magazine_size_modifier || 0);
  return Math.max(0, base + modifier);
}

// Firearms are in no dual-use pair, so there is no counterpart to sync.
export {
  saveFirearmCustomFields,
  addFirearmEnchantment,
  updateFirearmEnchantment,
  removeFirearmEnchantment,
};
