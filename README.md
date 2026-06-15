# archivumSheet

A web-based character sheet application for **GURPS**, built specifically for the **Archivum** campaign setting. Players fill in their character's traits, attributes, skills, spells, and equipment through a mobile-first interface; the engine computes every derived value automatically.

> **UI language:** Brazilian Portuguese (`pt-BR`). All visible strings live in a single localization file — see [Localization](#localization) for how to adapt it.

---

## What is this?

[GURPS](https://www.sjgames.com/gurps/) (Generic Universal RolePlaying System) is a tabletop RPG system by Steve Jackson Games. It uses a point-buy character creation model where attributes, advantages, disadvantages, skills, and spells all have costs that must be tracked carefully.

**Archivum** is a specific GURPS campaign setting. This tool was designed around its rules, data tables, and world — races, equipment lists, alchemy consumables, and the magic grimoire all reflect Archivum's content.

archivumSheet removes the need for paper character sheets or generic spreadsheets. It enforces the rules automatically, tracks carry weight and encumbrance, computes combat stats for every weapon, and lets a player switch between multiple saved characters with one tap.

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

## Project Structure

```
archivumSheet/
│
├── data/                         # Static game data as CSV files
│
├── engine/                       # Server-side computation layer
│   ├── buildSheet.js             # Main entry point — orchestrates everything
│   ├── character/                # Attributes, traits, skills, costs
│   ├── inventory/                # Per-item-type computation (armor, weapons, etc.)
│   └── magic/                    # Spell resolution and costs
│
├── dev/
│   ├── server.js                 # Express server: static files + API routes
│   └── public/
│       ├── index.html            # Single HTML page
│       ├── css/style.css         # All styles
│       └── js/
│           ├── main.js           # App entry point (window.onload)
│           ├── state.js          # Central state object
│           ├── api.js            # fetch() wrappers for the backend
│           ├── ui.js             # Top-level render orchestration
│           ├── engine/           # Client-side engine runner (calls API)
│           ├── events/           # All DOM event bindings
│           ├── ui/               # Section-level renderers
│           ├── inventory/        # Data loaders for each inventory type
│           ├── traits/           # Data loaders for traits, skills, spells
│           ├── character/        # Race loader and selectors
│           ├── store/            # Persistence, tab state, view mode state
│           ├── shared/           # Utilities shared across domains
│           └── localization/
│               └── pt-BR.js      # All visible strings
│
├── helpers/
│   └── dataUtils.js              # CSV loader utility (used by the server)
│
├── tests/                        # Jest test suite (mirrors engine/ structure)
│
├── jest.config.js
├── package.json
└── vercel.json
```

---

## Architecture

### The Central Principle

> **The engine is the single source of truth for all computed values.**

The UI never recomputes anything the engine owns. It collects raw user input, sends it to the engine, and renders what comes back. This is the most important constraint in the codebase.

### Data Flow

```
User interaction (DOM events)
        │
        ▼
state.selected  ←── raw user input only
        │
        ▼
POST /api/sheet/build  (engine call)
        │
        ▼
buildSheet()  ←── all computation happens here, server-side
        │
        ▼
state.sheet  ←── computed output, read-only from the UI's perspective
        │
        ▼
Renderers update the DOM
```

### State (`state.js`)

The global `state` object has three distinct sections:

**`state.data`** — raw data fetched from the API on startup (advantages list, skills list, equipment tables, races, etc.). Read-only after load.

**`state.selected`** — raw user input only. No computed values ever live here. This is what gets sent to the engine and what gets persisted to `localStorage`.

**`state.sheet`** — the last computed output from `buildSheet()`. Renderers read from here. Never written to directly by the UI.

```js
// Good — storing raw user input
state.selected.skills["SKILL-001"] = { base_value: 12, modifier: 0 };

// Bad — storing a computed value in selected
state.selected.skills["SKILL-001"].final = 14; // ❌ engine owns this
```

### The Engine (`engine/`)

The engine runs **server-side** (Node.js). The client calls it via `POST /api/sheet/build`. It receives a plain JSON payload and returns a fully computed sheet — no database calls, no side effects.

`buildSheet()` orchestrates two major sub-systems:

1. **`buildCharacter()`** — computes primary attributes (applying race modifiers), resolves trait effects (advantages and disadvantages that modify stats), computes secondary attributes (HP, Basic Speed, etc.), resolves skills and their costs, and computes base damage.

2. **`buildInventory()`** — for each inventory category, resolves item stats against the character's ST, computes total carry weight, determines encumbrance level, and computes combat values (damage, block values, range penalties, etc.).

After both, `buildSheet()` also handles shield block values and weapon damage computations that require cross-referencing the character's ST with equipped items.

Each inventory domain inside `engine/inventory/js/` follows the same internal structure: `constants` → `validation` → `resolver` → main `build*` function. New inventory types should mirror this pattern exactly.

### The API (`dev/server.js`)

A thin Express layer. It does two things:

**Data endpoints (GET)** — serve each CSV as JSON. The client fetches these once on startup to populate dropdowns.

```
GET /api/advantages
GET /api/disadvantages
GET /api/skills
GET /api/spells
GET /api/races
GET /api/materials
GET /api/armors
GET /api/shields
GET /api/melee_weapons
GET /api/ranged_weapons
GET /api/ammo
GET /api/ammo_containers
GET /api/alchemy
GET /api/survival_gear
```

**Computation endpoints (POST):**

```
POST /api/character/build   — partial build (attributes + traits only)
POST /api/sheet/build       — full sheet build (everything)
```

The frontend primarily uses `/api/sheet/build` via `runEngine()`.

### The UI Layer (`dev/public/js/`)

The UI layer is organized strictly by responsibility:

**`engine/index.js`** — `runEngine()`. The only place that calls `buildSheet()`. Assembles the full payload from `state.selected`, sends the API request, then dispatches results to all renderers. It does **not** call `renderLists()` — list DOM is only rebuilt by explicit inventory mutations to prevent dropdowns from being destroyed mid-interaction.

**`events/index.js`** — owns all `addEventListener` / `on()` wiring. Individual `*Events.js` files are pure handlers that receive the event and call the appropriate state mutation + engine trigger.

**`ui/`** — section-level renderers. Each file is responsible for one area of the DOM: `attributes.js`, `damage.js`, `inventory.js`, `resume.js`, etc.

**`ui/lists/`** — one render file per inventory/trait domain (`renderArmor.js`, `renderSkills.js`, etc.). These read from `state.selected` and `state.sheet` to build list rows.

**`store/`** — four focused modules:
- `characters.js` — multi-character persistence via `localStorage`
- `persistence.js` — import/export JSON logic and toast notifications
- `tabState.js` — which tab is active per section
- `sectionCollapseState.js` — which sections are collapsed
- `viewModeState.js` — whether the read-only resume view is active
- `instanceId.js` — generates unique IDs for inventory items

**`shared/`** — utilities used across multiple domains: `dom.js`, `constants.js`, `openState.js` (preserves expand/collapse state across re-renders), `equipmentSelectors.js`, `equipmentStats.js`, `durabilityUtils.js`, `inventoryRenderUtils.js`.

### Localization

Every visible string in the app lives in `dev/public/js/localization/pt-BR.js` as a `LABELS` export. No hardcoded Portuguese (or any other language) strings exist in JS or HTML files. The `t()` helper and `setText()` / `initAppShell()` patterns consume it.

To add a new language: duplicate the file (e.g. `en-US.js`) and update the import in `index.html`.

---

## Data Files (`data/`)

Each CSV is a flat table of game content. `helpers/dataUtils.js` parses them with `csv-parse` (using `bom: true` for UTF-8 BOM compatibility).

| File | Contents |
|---|---|
| `db_traits_advantages.csv` | Advantages catalog with point costs |
| `db_traits_disadvantages.csv` | Disadvantages catalog with point costs |
| `db_skills.csv` | Skills with base attribute, category, and difficulty |
| `db_magic_grimoire.csv` | Spells with school, prerequisites, and costs |
| `db_yrth_races.csv` | Races with attribute modifiers and innate traits |
| `db_equipment_armors.csv` | Armor pieces with DR, weight, price per body slot |
| `db_equipment_shields.csv` | Shields with DB, weight, price |
| `db_equipment_melee_weapons.csv` | Melee weapons with damage, reach, skill IDs |
| `db_equipment_ranged_weapons.csv` | Ranged weapons with damage, range, RoF, skill IDs |
| `db_equipment_ammo.csv` | Ammunition types |
| `db_equipment_ammo_containers.csv` | Quivers and pouches |
| `db_alchemy_consumables.csv` | Alchemical consumables with weight and price |
| `db_itens_adventure_gear.csv` | Survival and adventure gear |
| `db_crafting_materials.csv` | Materials (used for equipment tier modifiers) |

---

## Features

### Character

- Player name, character name, sex, age, weight
- Race selection (with optional sub-race) — applies attribute modifiers and innate advantages/disadvantages automatically

### Attributes

**Primary** (ST, DX, IQ, HT): user sets a base value; race modifiers and a freeform modifier column are added by the engine to produce the final value.

**Secondary** (HP, Basic Speed, Basic Move, Perception, Will, FP, and others): engine derives these from primary attributes. Users can buy them up or apply modifiers on top.

**Base Damage** (Thrust and Swing): computed from ST per GURPS tables. Users can apply a modifier; the engine produces the final dice expression.

### Traits

Advantages and disadvantages are selected from the Archivum catalog. The engine resolves any that have mechanical effects (e.g. an advantage that raises a secondary attribute, or a disadvantage that caps movement). Point costs are tracked and summed.

### Skills

Skills are selected by category, then configured with a base value and an optional modifier. The engine computes the final skill level and its point cost. Skills tagged as trained with a master (`isTrainedWithMaster`) follow a different cost formula — this flag is only valid for combat and magic skill categories.

### Magic

Spells are selected by school. Each spell has a base level and optional modifier. The engine computes final spell levels and costs. The grimoire section is separate from skills in both data and rendering.

### Equipment

Each equipment type supports multiple storage buckets: **equipped**, **backpack**, **stash**, and **camp**. Only equipped items contribute to carry weight and affect combat stats.

- **Armor** — per body slot; supports material and tier selection. Engine computes total DR per location.
- **Shields** — one equipped slot. Engine computes block value based on relevant skills.
- **Melee weapons** — multiple equipped slots. Engine computes damage (thrust or swing + modifier) based on ST and the weapon's damage type.
- **Ranged weapons** — multiple equipped slots. Engine computes damage and applies ST-based range where relevant.
- **Ammunition** — ammo containers (quivers, pouches) and loose ammo tracked separately, both with storage buckets.

### Inventory

- **Alchemy** — consumables with quantity, tier, and storage location.
- **Survival gear** — adventure gear items with quantity and storage.
- **Coin purse** — coin denominations tracked separately from equipment weight.
- **Custom items** — fully freeform: name, weight, price, quantity, description, storage bucket. No backing database entry required.

### Resume / View Mode

A compact read-only summary of the entire character — primary attributes as visual boxes, HP/FP/Mana bars, secondary attribute snapshot, point totals, trait lists, skill table, grimoire, and full equipment + weight breakdown. Activated by the 📃 button in the top bar. On mobile this replaces the main view; on desktop it overlays it.

### Multi-Character & Persistence

Up to N characters can be saved simultaneously, all in `localStorage` under the key `archivum_characters`. A character selector in the top bar (popover on mobile, same on desktop) switches the active character. Each character stores the full `state.selected` payload, which is also the import/export format.

Import and export use JSON. Export dumps the current character; import replaces the active character slot.

---

## Testing

```bash
npm test          # run all tests once
npm run test:watch  # watch mode
```

**48 test files** covering the entire engine layer. Tests live in `tests/` and mirror the `engine/` directory structure exactly. The UI layer has no tests by design — it is a thin renderer with no logic of its own.

Test helpers in `tests/helpers/` provide reusable assertion utilities:
- `assertShape.js` — checks that an output object has the expected keys
- `assertBasePlusModifier.js` — verifies base + modifier + computed final patterns
- `assertNumericMap.js` — validates numeric value maps
- `assertSelectedOnly.js` — ensures no computed values have leaked into a `selected`-shaped object

---

## Key Patterns & Conventions

These are not preferences — they are load-bearing constraints that keep the codebase consistent. All contributions must follow them.

**Engine is always source of truth.** `state.selected` stores only raw user input. `state.sheet` stores engine output. Nothing in the UI recomputes what the engine owns.

**Follow existing patterns before inventing new ones.** Adding a new inventory type? Read `engine/inventory/js/ammo/` first, then mirror it: `constants` → `validation` → `resolver` → main function → wire into `buildInventory` → dev state → API endpoint → events → render → localization.

**All strings go through `pt-BR.js`.** Zero hardcoded text in JS or HTML.

**`Math.floor` rounding** everywhere computed numeric values are produced.

**Single-responsibility files.** Loaders, selectors, event handlers, and renderers are separate files per domain. If a file is doing more than one of those things, split it.

**Delegated event pattern.** `events/index.js` owns all wiring. Individual `*Events.js` files are pure handlers — they do not call `addEventListener` themselves.

**Open-state preservation.** When lists are re-rendered, any detail rows or expanded panels that were open before must be open after. `shared/openState.js` handles this. Never rebuild a list in a way that discards expand/collapse state.

**Deferred render pattern.** Modifier input fields use a debounce before triggering `runEngine()`. This prevents the DOM from being rebuilt while a user is mid-keystroke.

**Conventional Commits.** All commit messages follow the format: `type(scope): imperative lowercase description`. Body is optional but structured when present.

---

## Contributing

1. Read the relevant engine module(s) before proposing changes.
2. Ask clarifying questions first — do not make assumptions during implementation.
3. Deliver in layers: engine + tests first, UI second.
4. Never put computed values in `state.selected`.
5. Never put visible strings directly in JS or HTML.
6. Run `npm test` before opening a PR — all 48 test files must pass.
