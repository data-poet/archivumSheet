// Every icon the app draws, by name. Values are HTML, so a custom icon is a one-line swap here,
// e.g. '<img class="icon" src="/images/icons/combat.svg" alt="">' or an inline <svg>.
// Layouts reference these names (js/layout/sheetLayout.js, js/reference/referenceLayout.js);
// a guard test fails if a name is missing or an emoji is hardcoded elsewhere.
export const ICONS = {
  // Sheet groups
  character: "🧙",
  abilities: "✨",
  equipment: "🛡️",
  inventory: "🎒",
  misc: "⚙️",

  // Sheet sections
  profile: "👤",
  attributes: "💪",
  survival: "⛑️",
  traits: "🧬",
  skills: "🎯",
  magic: "🔮",
  defense: "🛡️",
  weapons: "⚔️",
  melee: "🗡️",
  firearms: "🔫",
  armor: "🥋",
  shield: "🛡️",
  advantages: "👍",
  disadvantages: "👎",
  "magic-gear": "💍",
  consumables: "🧪",
  coins: "🪙",
  "custom-items": "📦",
  allies: "🤝",
  output: "🧾",

  // Reference groups
  system: "🎲",
  combat: "⚔️",
  tables: "📜",
  house: "🏠",

  // Reference sections
  "base-damage": "🗡️",
  carry: "🎒",
  resistances: "🔥",
  reactions: "🤝",
  conditions: "🩸",
  "combat-rules": "⚔️",
  maneuvers: "🤺",
  criticals: "🎯",
  panic: "😱",
  homebrew: "📖",
  "success-rolls": "⚖️",
  hazards: "☠️",
  "damage-types": "💥",
  ranged: "🏹",
  arcana: "✨",
  casting: "🔮",
  spells: "🪄",
  "mana-zones": "🌀",

  // Reference callouts (> [!TYPE])
  "callout-note": "ℹ️",
  "callout-tip": "💡",
  "callout-important": "❗",
  "callout-warning": "⚠️",
  "callout-caution": "🛑",
  "callout-house": "🏠",

  // Controls
  "theme-light": "☀️",
  "theme-dark": "🌙",
  "view-mode-view": "📃",
  "view-mode-edit": "📝",
  search: "🔍",
  help: "?",
  add: "+",
  "remove-character": "−",
  remove: "✕",
  import: "⬆️",
  export: "⬇️",
  replace: "🔄",
  "radio-on": "⦿",
  "radio-off": "○",
  "drag-handle": "⠿",
  "chevron-down": "⌄",
  "coins-carried": "💰",
  // Rendered inside <option>, which can only hold text: keep this one a character, not markup.
  "storage-option": "↪",

  // Toasts
  "toast-success": "✓",
  "toast-error": "✕",
  "toast-info": "ℹ",
};

export function icon(name) {
  return ICONS[name] ?? "";
}
