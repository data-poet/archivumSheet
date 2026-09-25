// "Add ally" box embedded in the character editor. Forking a repo-catalog ally straight into a
// full local kind:"ally" character, linked under whoever is currently being edited, is what makes
// it immediately editable — see store/allies/characterLinking.js's forkAndLinkAllyToCharacter.
// Hidden while editing an ally itself: allies can't have their own roster (decision #24), same
// rule allyLinkControl.js's counterpart gate and pageSelector.js's nav-hiding already enforce.

import { t } from "../../localization/pt-BR/index.js";
import { listAllies } from "../../allies/catalog.js";
import { tierOf, tierLabel } from "../../allies/tier.js";
import {
  getActiveKind,
  getActiveCharacterId,
  saveActiveCharacter,
  loadCharacter,
} from "../../store/characters.js";
import { forkAndLinkAllyToCharacter } from "../../store/allies/characterLinking.js";
import { ENTRY_KINDS } from "../../shared/constants.js";
import { showToast } from "../../shared/toast.js";
import { escapeHtml } from "../../shared/renderUtils.js";

let _index = [];

function getMount() {
  return document.getElementById("ally-add-control");
}

function _typesOf(index) {
  return [...new Set(index.map((a) => a.type))].sort();
}

function _subtypesOf(index, type) {
  return [
    ...new Set(
      index.filter((a) => a.type === type && a.subtype).map((a) => a.subtype),
    ),
  ].sort();
}

function _namesOf(index, type, subtype) {
  return index
    .filter((a) => a.type === type && (a.subtype ?? null) === (subtype ?? null))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function _typeLabel(type) {
  return t(`allies.typeNames.${type}`, type);
}

function _subtypeLabel(subtype) {
  return t(`allies.subtypeNames.${subtype}`, subtype);
}

// A group with no character_name at all (e.g. elementals/earth's size-tiered files) is
// identified by its trailing _NN instead — a name selector would just show a column of
// blanks. A group where every file carries a real name (e.g. a future mounts/horses) keeps
// the ordinary name selector. Groups aren't expected to mix the two within one subtype.
function _isUnnamedGroup(entries) {
  return entries.length > 0 && entries.every((a) => !a.name);
}

function _optionsHtml(values, labelFor) {
  return values
    .map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(labelFor(v))}</option>`)
    .join("");
}

function _markup() {
  return `
    <div class="box" id="ally-add-box">
      <details id="ally-add-details">
        <summary id="ally-add-summary">${escapeHtml(t("allies.addToggle"))}</summary>
        <div class="ally-add-form" id="ally-add-form">
          <div class="ally-add-field">
            <label for="ally-add-type" id="ally-add-type-label">${escapeHtml(t("allies.typeLabel"))}</label>
            <select id="ally-add-type"></select>
          </div>
          <div class="ally-add-field">
            <label for="ally-add-subtype" id="ally-add-subtype-label">${escapeHtml(t("allies.subtypeLabel"))}</label>
            <select id="ally-add-subtype"></select>
          </div>
          <div class="ally-add-field">
            <label for="ally-add-name" id="ally-add-name-label">${escapeHtml(t("allies.nameLabel"))}</label>
            <select id="ally-add-name"></select>
          </div>
          <button type="button" id="ally-add-btn">${escapeHtml(t("allies.add"))}</button>
        </div>
      </details>
    </div>
  `;
}

function _renderNames(mount) {
  const type = mount.querySelector("#ally-add-type")?.value;
  const subtype = mount.querySelector("#ally-add-subtype")?.value || null;
  const nameSelect = mount.querySelector("#ally-add-name");
  const nameLabel = mount.querySelector("#ally-add-name-label");
  if (!nameSelect) return;

  const entries = _namesOf(_index, type, subtype);
  const byTier = _isUnnamedGroup(entries);

  if (nameLabel) {
    nameLabel.textContent = t(byTier ? "allies.tierLabel" : "allies.nameLabel");
  }

  const ordered = byTier
    ? [...entries].sort(
        (a, b) => Number(tierOf(a.ally_id) ?? 0) - Number(tierOf(b.ally_id) ?? 0),
      )
    : entries;

  nameSelect.innerHTML = ordered
    .map(
      (a) =>
        `<option value="${escapeHtml(a.ally_id)}">${escapeHtml(byTier ? tierLabel(a) : a.name)}</option>`,
    )
    .join("");
}

function _renderSubtypeAndName(mount) {
  const type = mount.querySelector("#ally-add-type")?.value;
  const subtypeSelect = mount.querySelector("#ally-add-subtype");
  if (!subtypeSelect) return;

  const subtypes = _subtypesOf(_index, type);
  const subtypeWrap = subtypeSelect.closest(".ally-add-field");

  if (subtypes.length === 0) {
    if (subtypeWrap) subtypeWrap.hidden = true;
    subtypeSelect.innerHTML = "";
  } else {
    if (subtypeWrap) subtypeWrap.hidden = false;
    subtypeSelect.innerHTML =
      `<option value="">${escapeHtml(t("allies.subtypeNone"))}</option>` +
      _optionsHtml(subtypes, _subtypeLabel);
  }

  _renderNames(mount);
}

function _renderTypes(mount) {
  const typeSelect = mount.querySelector("#ally-add-type");
  if (!typeSelect) return;

  typeSelect.innerHTML = _optionsHtml(_typesOf(_index), _typeLabel);
  _renderSubtypeAndName(mount);
}

async function _handleAdd(mount) {
  const allyId = mount.querySelector("#ally-add-name")?.value;
  if (!allyId) return;

  saveActiveCharacter();
  const ownerId = getActiveCharacterId();
  const newId = await forkAndLinkAllyToCharacter(allyId, ownerId);
  if (!newId) {
    showToast(t("allies.addError"), "error");
    return;
  }

  loadCharacter(newId);
  // Catalog audience (shared/availability.js) is only computed once, at bootstrap — a reload
  // is the only way the newly active ally's kind can re-filter races/etc, same as every other
  // active-character switch in characterSelector.js.
  window.location.reload();
}

export function renderAllyAddControl() {
  const mount = getMount();
  if (!mount) return;

  if (getActiveKind() === ENTRY_KINDS.ALLY) {
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = _markup();
  _renderTypes(mount);

  mount.querySelector("#ally-add-type")?.addEventListener("change", () => {
    _renderSubtypeAndName(mount);
  });
  mount.querySelector("#ally-add-subtype")?.addEventListener("change", () => {
    _renderNames(mount);
  });
  mount.querySelector("#ally-add-btn")?.addEventListener("click", () => {
    _handleAdd(mount);
  });
}

export async function initAllyAddControl() {
  _index = await listAllies();
  renderAllyAddControl();
}
