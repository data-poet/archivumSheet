// Snapshots/restores open <details> state and .table-wrapper scroll position around a DOM
// re-render. withOpenState covers a single container; for full-page re-renders
// (runEngine → renderLists) use snapshotAll/restoreAll instead. Both key entries with
// detailKeyFn, which handles every managed container without per-container config.

// Without data-detail-kind, sibling blocks for the same instance (e.g. "stats" + "customize"
// panels) would collapse onto the same key, forcing all open together on next re-render.
function _withDetailKind(detailsEl, key) {
  if (!key) return null;
  const kind = detailsEl.dataset.detailKind;
  return kind ? `${key}:${kind}` : key;
}

// Single source of truth for which containers snapshotAll/restoreAll and withOpenState operate on.
const MANAGED_CONTAINER_IDS = [
  "advList",
  "disList",
  "skillList",
  "spellList",
  "armorSlots",
  "armorStorageList",
  "shieldSlot",
  "shieldStorageList",
  "meleeSlots",
  "meleeStorageList",
  "rangedSlots",
  "rangedStorageList",
  "ammoContainerList",
  "looseAmmoList",
  "alchemyList",
  "survivalGearList",
  "accessorySlots",
  "accessoryStorageList",
  "magicGearSlots",
  "magicGearStorageList",
  "customInventoryList",
  "coinPurseList",
];

function _snapshotContainer(container, keyFn) {
  const open = new Set();
  container.querySelectorAll("details[open]").forEach((d) => {
    const key = keyFn(d);
    if (key) open.add(key);
  });

  const scrollPositions = Array.from(
    container.querySelectorAll(".table-wrapper")
  ).map((w) => w.scrollLeft);

  return { open, scrollPositions };
}

function _restoreContainer(container, keyFn, { open, scrollPositions }) {
  if (open.size > 0) {
    container.querySelectorAll("details").forEach((d) => {
      const key = keyFn(d);
      if (key && open.has(key)) d.setAttribute("open", "");
    });
  }

  if (scrollPositions.some((s) => s > 0)) {
    container.querySelectorAll(".table-wrapper").forEach((w, i) => {
      if (scrollPositions[i]) w.scrollLeft = scrollPositions[i];
    });
  }
}

// renderFn is deferred by one rAF because it's called from native <select>/<input> "change"
// handlers — replacing the DOM ancestor of the still-mid-event element before some browsers
// (mobile Safari) finish closing the native option picker causes a visible flicker/scroll jump.
//
// The restore step must NOT be deferred to a second rAF: fresh <details> markup never carries
// `open`, so a later-frame restore paints the rebuilt DOM collapsed first, then open next frame
// — a visible flash. setAttribute("open")/scrollTo take effect synchronously, so restoring in
// the same task as renderFn ensures the browser only ever paints the final, correct state.
export function withOpenState(scope, renderFn) {
  const container = document.querySelector(scope);
  if (!container) {
    requestAnimationFrame(renderFn);
    return;
  }

  const snapshot = _snapshotContainer(container, detailKeyFn);
  const scrollY = window.scrollY;

  requestAnimationFrame(() => {
    renderFn();
    _restoreContainer(container, detailKeyFn, snapshot);
    if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
  });
}

export function snapshotAll() {
  const snapshots = new Map();

  MANAGED_CONTAINER_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    snapshots.set(id, _snapshotContainer(el, detailKeyFn));
  });

  return snapshots;
}

// Call synchronously right after renderLists(), not inside a later rAF — see withOpenState's
// comment for why a deferred restore causes a visible collapse-then-reopen flash.
export function restoreAll(snapshots) {
  snapshots.forEach(({ open, scrollPositions }, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    _restoreContainer(el, detailKeyFn, { open, scrollPositions });
  });
}

// Reads an attribute off the element itself or its first descendant carrying it.
function _readAttr(el, attr) {
  return (
    el.getAttribute(attr) || el.querySelector(`[${attr}]`)?.getAttribute(attr)
  );
}

const ROW_KEY_ATTRS = [
  "data-instance-id",
  "data-id",
  "data-name",
  "data-custom-item-id",
];

// data-ammo-id is checked BEFORE the plain attrs and combined with the container's
// instance id: an ammo entry is identified by (container, ammo), not by container
// alone. Keying on data-instance-id first would collapse every entry in a container
// onto one key, so opening one entry's details reopened all of them on re-render.
function _rowKey(row) {
  const ammoId = _readAttr(row, "data-ammo-id");
  if (ammoId) {
    return `${_readAttr(row, "data-instance-id") ?? ""}:${ammoId}`;
  }

  for (const attr of ROW_KEY_ATTRS) {
    const val = _readAttr(row, attr);
    if (val) return val;
  }

  return null;
}

// Single key function for every managed container — both the table-row and the
// equipped-slot div patterns, with no per-container config.
export function detailKeyFn(detailsEl) {
  // Container-level details (e.g. an ammo container, or a backpack/stash/camp storage
  // section) carry their own key directly, rather than relying on a preceding sibling
  // row — there is no row, this *is* the item.
  const ownKey =
    detailsEl.getAttribute("data-instance-id") ||
    detailsEl.getAttribute("data-storage-loc");
  if (ownKey) return _withDetailKind(detailsEl, ownKey);

  // Walk back through preceding <tr> siblings, not just the immediate one — a data row may be
  // followed by several sibling .detail-row rows (e.g. stats + customize), so the row carrying
  // the instance key may not be directly adjacent to this particular detail row.
  const row = detailsEl.closest("tr");
  if (row) {
    let prev = row.previousElementSibling;
    while (prev) {
      const key = _rowKey(prev);
      if (key) return _withDetailKind(detailsEl, key);
      if (!prev.classList.contains("detail-row")) break;
      prev = prev.previousElementSibling;
    }
  }

  // Same reasoning as above: an equipped slot may render several sibling .equipped-detail
  // blocks, so walk back through preceding siblings rather than just the immediate one.
  const block = detailsEl.closest(".equipped-detail");
  if (block) {
    let sibling = block.previousElementSibling;
    while (sibling) {
      const val =
        _readAttr(sibling, "data-instance-id") ||
        _readAttr(sibling, "data-slot");
      if (val) return _withDetailKind(detailsEl, val);
      sibling = sibling.previousElementSibling;
    }
  }

  return null;
}
