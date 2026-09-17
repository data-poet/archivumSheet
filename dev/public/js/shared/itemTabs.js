// One outer <details> per item (collapsed by default) revealing a Detalhes/Personalizar/
// Encantamentos(/Ajustes) tab strip, replacing what used to be 3-4 separate top-level <details>.
import { t } from "../localization/pt-BR/index.js";
import { getActiveTab, setActiveTab } from "../store/tabState.js";
import { buildDetailContent } from "./renderUtils.js";

// Wraps buildDetailContent's output for use as a tab panel — "" (not a wrapper around nothing)
// when there's no content, so the "details" tab drops out like any other empty tab.
export function statsTabContent(fields) {
  const content = buildDetailContent(fields);
  return content ? `<div class="item-detail-grid">${content}</div>` : "";
}

// tabs: array of { key, label, content }. Tabs with empty content are dropped so e.g. an item
// with no custom fields and no enchantments doesn't render a blank "Personalizar" panel.
function _tabsMarkup(instanceId, tabs) {
  const live = tabs.filter((tab) => tab.content);
  if (live.length === 0) return "";

  const stateKey = `item:${instanceId}`;
  const saved = getActiveTab(stateKey);
  const activeKey = live.some((tab) => tab.key === saved) ? saved : live[0].key;
  if (activeKey !== saved) setActiveTab(stateKey, activeKey);

  const strip = live
    .map(
      (tab) => `
        <button type="button" class="tab-btn item-tab-btn${tab.key === activeKey ? " is-active" : ""}" data-tab="${tab.key}">${tab.label}</button>`,
    )
    .join("");

  const panels = live
    .map(
      (tab) => `
      <div class="tab-panel item-tab-panel${tab.key === activeKey ? " is-active" : ""}" data-tab="${tab.key}">${tab.content}</div>`,
    )
    .join("");

  return `
    <details data-detail-kind="tabs">
      <summary>${t("common.details")}</summary>
      <div class="tab-strip item-tab-strip" data-instance-id="${instanceId}">${strip}
      </div>
      ${panels}
    </details>`;
}

export function equippedItemTabs(instanceId, tabs) {
  const markup = _tabsMarkup(instanceId, tabs);
  if (!markup) return "";

  return `
    <div class="equipped-detail item-detail-tabs">
      ${markup}
    </div>`;
}

export function itemTabsDetailRow(colspan, instanceId, tabs) {
  const markup = _tabsMarkup(instanceId, tabs);
  if (!markup) return "";

  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        ${markup}
      </td>
    </tr>`;
}

// Delegated (not per-element) since these blocks are destroyed/recreated by setHTML on every
// re-render — a one-time querySelectorAll+addEventListener like components/tabs.js's initTabs()
// wouldn't survive that.
export function handleItemTabClick(e) {
  const btn = e.target.closest(".item-tab-btn");
  if (!btn) return false;

  const strip = btn.closest(".item-tab-strip");
  const details = btn.closest("details");
  if (!strip || !details) return false;

  const tabKey = btn.dataset.tab;
  const instanceId = strip.dataset.instanceId;

  strip
    .querySelectorAll(".item-tab-btn")
    .forEach((b) => b.classList.toggle("is-active", b === btn));
  details
    .querySelectorAll(":scope > .item-tab-panel")
    .forEach((p) => p.classList.toggle("is-active", p.dataset.tab === tabKey));

  setActiveTab(`item:${instanceId}`, tabKey);
  return true;
}
