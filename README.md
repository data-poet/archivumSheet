# archivumSheet

A web-based character sheet for **GURPS**, built for the **Archivum** campaign setting. Players fill in traits, attributes, skills, spells, and equipment through a mobile-first interface; the engine computes every derived value automatically.

> **UI language:** Brazilian Portuguese (`pt-BR`). All visible strings live in `dev/public/js/localization/pt-BR/` — duplicate that folder to add another language.

---

## What is this?

[GURPS](https://www.sjgames.com/gurps/) is a point-buy tabletop RPG system by Steve Jackson Games — attributes, advantages, disadvantages, skills, and spells all cost points that must be tracked carefully. **Archivum** is a specific campaign setting; this tool's data tables (races, equipment, alchemy, grimoire, magic enchantments) reflect its content specifically.

archivumSheet replaces paper sheets and generic spreadsheets: it enforces the rules, tracks carry weight and encumbrance, computes combat stats per weapon, resolves magic enchantments applied to equipment, and lets a player switch between multiple saved characters with one tap.

---

## Getting Started

**Requirements:** Node.js v20+ (see `.nvmrc`)

```bash
git clone https://github.com/data-poet/archivumSheet.git
cd archivumSheet
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

```bash
npm test          # run the full test suite once
npm run test:watch
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express 5 |
| Frontend | Vanilla JavaScript (ES modules, no framework) |
| Styling | Plain CSS |
| Tests | Jest v30+ |
| Data | CSV files (parsed via `csv-parse`) |
| Deployment | Vercel (`vercel.json` included) |

---

## Architecture

> **The engine is the single source of truth for all computed values.** The UI never recomputes anything the engine owns — it collects raw input, sends it to the engine, and renders what comes back.

```
DOM event → state.selected (raw input) → POST /api/sheet/build
          → buildSheet() computes everything server-side
          → state.sheet (computed, read-only) → renderers
```

- **`engine/`** — server-side computation, called via `POST /api/sheet/build` and `/api/character/build`. `buildSheet()` orchestrates `buildCharacter()` (attributes, traits, skills, base damage) and `buildInventory()` (per-category item resolution, carry weight, encumbrance, combat stats). Each inventory category under `engine/inventory/js/<category>/` follows the same shape: `constants` → `validation` → `resolver` → main `build*` function — mirror this when adding a new one.
- **`dev/server.js`** — thin Express layer: GET endpoints serve each CSV as JSON (dropdown data), POST endpoints run the engine.
- **`dev/public/js/`** — UI layer, organized by responsibility: `state.js` (the 3-part global state below), `engine/` (client-side callers of the API), `events/` (all DOM wiring, delegated through `events/index.js`), `components/` + `ui/` (renderers), `store/` (persistence, tab/view-mode state), `compute/` (client-side attribute preview before an engine round-trip), `localization/pt-BR/` (every visible string).

**State (`state.js`)** has three sections:
- `state.data` — raw catalog data fetched once on load (read-only).
- `state.selected` — raw user input only, ever. This is what's sent to the engine and persisted.
- `state.sheet` — the engine's last computed output. Renderers read from here; nothing else writes to it.

---

## Data Files (`data/`)

Flat CSV tables, parsed by `helpers/dataUtils.js`. Covers: traits (advantages/disadvantages), skills, the magic grimoire, magic enchantments, races, armor, shields, melee/ranged/firearms weapons, ammo + containers, alchemy consumables, adventure gear, accessories, magic gear (wands/staves/instruments), and crafting materials (equipment tier modifiers).

---

## Features

- **Character** — name, race (+ sub-race), applies race attribute modifiers and innate traits automatically.
- **Attributes** — primary (ST/DX/IQ/HT) and secondary (HP, Basic Speed, Move, Perception, Will, FP, ...) with race/point/freeform modifiers resolved by the engine; base damage (thrust/swing) derived from ST.
- **Traits, Skills, Magic** — advantages/disadvantages, skills, and spells selected from the Archivum catalog; the engine resolves mechanical effects, point costs, and final levels.
- **Equipment** — armor, shields, melee/ranged/firearms weapons, ammo (containers + loose), accessories, and magic gear, each with **equipped / backpack / stash / camp** storage buckets. Only equipped (and backpack, for weight) items count toward carry weight and combat stats.
- **Magic enchantments** — applied to individual equipment instances; the engine resolves pricing, stacking/collision rules against a character's own purchased skills/spells, and dual-use weapon (melee ⇄ ranged) category syncing.
- **Inventory** — alchemy consumables, survival gear, coin purse (denominations tracked separately from weight), and fully freeform custom items.
- **Resume / View Mode** — a compact read-only summary of the whole character; replaces the main view on mobile, overlays it on desktop.
- **Multi-character & persistence** — any number of characters saved to `localStorage`; JSON import/export uses the same `state.selected` shape.

---

## Key Conventions

Load-bearing constraints, not preferences — all contributions must follow them.

- **Engine owns computed values.** `state.selected` never holds a computed field.
- **Mirror existing patterns.** Adding an inventory type? Copy `engine/inventory/js/ammo/`'s structure exactly.
- **All strings go through `localization/pt-BR/`.** No hardcoded text in JS/HTML.
- **Delegated events.** All `addEventListener` calls live in `events/index.js`; other files are pure handlers.
- **Open-state preservation.** Re-rendering a list must not collapse rows the user had expanded (`shared/openState.js`).
- **Debounced engine calls.** Modifier inputs debounce before triggering a rebuild, so the DOM doesn't rebuild mid-keystroke.
- **Comments explain WHY, not WHAT** — see `CLAUDE.md`.
- **Conventional commits**, one-liners, never AI co-authored — see `CLAUDE.md`.

---

## Testing

Jest tests live in `tests/`, mirroring `engine/`'s structure exactly. The UI layer has no tests by design — it's a thin renderer with no logic of its own.

Reusable assertion helpers in `tests/helpers/`: `assertShape.js`, `assertBasePlusModifier.js`, `assertNumericMap.js`, `assertSelectedOnly.js`.

---

## Contributing

1. Read the relevant engine module(s) before proposing changes.
2. Ask clarifying questions first — don't assume during implementation.
3. Deliver in layers: engine + tests first, UI second.
4. Never put computed values in `state.selected` or hardcoded strings in JS/HTML.
5. Run `npm test` before opening a PR.
