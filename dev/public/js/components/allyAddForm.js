// Cascading type -> (optional) subtype -> name pickers for adding a repo ally to the
// roster. Built from the same index the roster selector uses, so both stay in sync
// without a second fetch.

import { t } from "../localization/pt-BR/index.js";
import { addRosterEntry } from "../store/allies.js";
import { escapeHtml } from "../shared/renderUtils.js";

let _index = [];
let _onAdd = () => {};

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

function _typeSelect() {
  return document.getElementById("ally-add-type");
}
function _subtypeSelect() {
  return document.getElementById("ally-add-subtype");
}
function _nameSelect() {
  return document.getElementById("ally-add-name");
}

function _optionsHtml(values, labelFor) {
  return values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(labelFor(v))}</option>`).join("");
}

function _typeLabel(type) {
  return t(`allies.typeNames.${type}`, type);
}

function _subtypeLabel(subtype) {
  return t(`allies.subtypeNames.${subtype}`, subtype);
}

function _renderSubtypeAndName() {
  const type = _typeSelect()?.value;
  const subtypeSelect = _subtypeSelect();
  const nameSelect = _nameSelect();
  if (!subtypeSelect || !nameSelect) return;

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

  _renderNames();
}

function _renderNames() {
  const type = _typeSelect()?.value;
  const subtype = _subtypeSelect()?.value || null;
  const nameSelect = _nameSelect();
  if (!nameSelect) return;

  const names = _namesOf(_index, type, subtype);
  nameSelect.innerHTML = names
    .map((a) => `<option value="${escapeHtml(a.ally_id)}">${escapeHtml(a.name)}</option>`)
    .join("");
}

function _renderTypes() {
  const typeSelect = _typeSelect();
  if (!typeSelect) return;

  typeSelect.innerHTML = _optionsHtml(_typesOf(_index), _typeLabel);
  _renderSubtypeAndName();
}

function _applyStaticLabels() {
  const setText = (id, text) => {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = text;
  };

  setText("ally-add-summary", t("allies.addToggle"));
  setText("ally-add-type-label", t("allies.typeLabel"));
  setText("ally-add-subtype-label", t("allies.subtypeLabel"));
  setText("ally-add-name-label", t("allies.nameLabel"));
  setText("ally-add-btn", t("allies.add"));
}

export function initAllyAddForm({ index = [], onAdd = () => {} } = {}) {
  _index = index;
  _onAdd = onAdd;

  _applyStaticLabels();
  _renderTypes();

  _typeSelect()?.addEventListener("change", _renderSubtypeAndName);
  _subtypeSelect()?.addEventListener("change", _renderNames);

  document.getElementById("ally-add-btn")?.addEventListener("click", () => {
    const allyId = _nameSelect()?.value;
    if (!allyId) return;

    const instanceId = addRosterEntry(allyId);
    if (instanceId) _onAdd(instanceId);
  });
}
