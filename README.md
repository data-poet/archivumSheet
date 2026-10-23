# archivumSheet

A web-based character sheet for **GURPS**, built for the **Archivum** campaign setting. Players fill in traits, attributes, skills, spells, and equipment through a mobile-first interface; the engine computes every derived value automatically.

> **UI language:** Brazilian Portuguese (`pt-BR`). All visible strings live in `dev/public/js/localization/pt-BR/` — duplicate that folder to add another language.

---

## What is this?

[GURPS](https://www.sjgames.com/gurps/) is a point-buy tabletop RPG system by Steve Jackson Games — attributes, advantages, disadvantages, skills, and spells all cost points that must be tracked carefully. **Archivum** is a specific campaign setting; this tool's data tables (races, equipment, alchemy, grimoire, magic enchantments) reflect its content specifically.

archivumSheet replaces paper sheets and generic spreadsheets: it enforces the rules, tracks carry weight and encumbrance, computes combat stats per weapon, resolves magic enchantments applied to equipment, and lets a player switch between multiple saved characters with one tap.

---

## Getting Started

**Requirements:** Node.js v24+ (see `.nvmrc`)

```bash
git clone https://github.com/data-poet/archivumSheet.git
cd archivumSheet
npm install
npm run dev
```

The app runs at `http://localhost:3000`. `npm run dev` restarts the server when anything in `data/`, `engine/` or `helpers/` changes, and the datasets are re-read from disk when a CSV changes.

```bash
npm test          # run the full test suite once
npm run test:watch
npm run test:data       # only the guards that read the real CSVs (fast feedback after a data edit)
npm run data:import     # after exporting CSVs from the spreadsheet: format, keys, remap references, check (see scripts/README.md)
npm run check:data      # validate the CSVs: ids, keys, references, vocabularies, number formats
npm run data:format     # after a spreadsheet export: LF endings and a final newline
npm run data:remap -- SKILLS   # after renumbering a dataset: repoint every id reference to it (dry run; add --write)
npm run golden:record     # before a refactor: freeze data/ at HEAD and dump what the engine builds from it
npm run golden:compare    # after it: every dump must be identical, whatever the live CSVs are doing
npm run coverage:record   # per-file coverage baseline; coverage:compare fails if a file's lines or branches drop
npm run test:renumber   # re-run the suite on a copy with every dataset id shifted
```

---

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Backend    | Node.js + Express 5                           |
| Frontend   | Vanilla JavaScript (ES modules, no framework) |
| Styling    | Plain CSS                                     |
| Tests      | Jest v30+                                     |
| Data       | CSV files (parsed via `csv-parse`)            |
| Deployment | Vercel (`vercel.json` included)               |

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
- **`dev/public/js/`** — UI layer, organized by responsibility: `state.js` (the 3-part global state below), `engine/` (per-domain model, render and event handlers; its structure mirrors the server-side `engine/`), `events/index.js` (the sheet's delegated document listeners, which route to those handlers), `components/` (page-level renderers and widgets, including the resume), `ui.js` (the render entry points), `store/` (characters, persistence, theme and view state), `allies/` (the repo ally catalog), `compute/` (collects the raw input, calls the engine and drives the re-render), `layout/` (page assembly), `reference/` (the rules reference page), `shared/` (helpers used across domains), `localization/pt-BR/` (every visible string).
- **`helpers/`** — what the engine, the scripts and (through `/api/rules`, or a mirror pinned by a parity test) the UI share: numeric rules, stable-key ids, vocabularies and the dataset registry. Where each kind of constant lives, and why, is in `CLAUDE.md`.

**State (`state.js`)** has three sections:

- `state.data` — raw catalog data fetched once on load (read-only).
- `state.selected` — raw user input only, ever. This is what's sent to the engine and persisted.
- `state.sheet` — the engine's last computed output. Renderers read from here; nothing else writes to it.

---

## Data Files (`data/`)

Flat CSV tables, parsed by `helpers/dataUtils.js`. Covers: traits (advantages/disadvantages), skills, the magic grimoire, magic enchantments, races, armor, shields, melee/ranged/firearms weapons, ammo + containers, alchemy consumables, adventure gear, accessories, magic gear (wands/staves/instruments), crafting materials (equipment tier modifiers), and conditions (afflictions, stuns and shock, with the roll penalties and status tags each one carries).

Conventions every CSV follows:

- LF line endings and a trailing newline (`.gitattributes` normalizes `data/*.csv` on commit, so an editor that saves CRLF does not create diffs).
- Booleans are the strings `TRUE` and `FALSE`; an empty cell means "none".
- Empty and zero differ where it matters: `skill_parry_modifier` empty means the skill cannot parry, `0` means parry +0.
- Every dataset except the grimoire has a `<prefix>_key` column right after the id (`advantage_key`, `weapon_key`, ...): a lowercase slug unique within the dataset that identifies the row for good. Renumbering ids or correcting names never changes it; tests refer to rows by key. Add one to every new row (`node scripts/generateKeys.js --fill-missing` fills the empty ones from the name).
- List cells are comma-separated (`skill_defaults` uses `;` between entries and `:` between a skill and its penalty).

---

## Features

- **Character** — name, race (+ sub-race), applies race attribute modifiers and innate traits automatically.
- **Attributes** — primary (ST/DX/IQ/HT) and secondary (HP, Basic Speed, Move, Perception, Will, FP, ...) with race/point/freeform modifiers resolved by the engine; base damage (thrust/swing) derived from ST.
- **Traits, Skills, Magic** — advantages/disadvantages, skills, and spells selected from the Archivum catalog; the engine resolves mechanical effects, point costs, and final levels.
- **Equipment** — armor, shields, melee/ranged/firearms weapons, ammo (containers + loose), accessories, and magic gear, each with **equipped / backpack / stash / camp** storage buckets. Only equipped (and backpack, for weight) items count toward carry weight and combat stats.
- **Magic enchantments** — applied to individual equipment instances; the engine resolves pricing, stacking/collision rules against a character's own purchased skills/spells, and dual-use weapon (melee ⇄ ranged) category syncing.
- **Inventory** — alchemy consumables, survival gear, coin purse (denominations tracked separately from weight), and fully freeform custom items.
- **Resume / View Mode** — a compact summary of the whole character that doubles as the play surface (HP, ammo and durability steppers); replaces the main view on mobile, overlays it on desktop.
- **Conditions** — afflictions, Physical/Mental Stun and Shock switch on from the resume or the edit-mode _Condições_ tab; the engine applies their penalties (different conditions stack, stun counts once, immunities and the pain threshold are respected) and the sheet shows each modified number as `effective (base)`.
- **Allies** — characters can be saved as allies and linked to a PC's roster; a catalog of ready-made allies ships in `data/allies/` (portraits beside their JSON), and an ally file exports and imports like a sheet.
- **Rules reference** — `reference.html` renders the markdown rules in `dev/public/reference-content/` with search and deep links.
- **Multi-character & persistence** — any number of characters saved to `localStorage`; JSON import/export uses the same `state.selected` shape.

---

## Key Conventions

Load-bearing constraints, not preferences — all contributions must follow them.

- **Engine owns computed values.** `state.selected` never holds a computed field.
- **Mirror existing patterns.** Adding an inventory type? Copy `engine/inventory/js/ammo/`'s structure exactly.
- **No literal rules.** Numbers go in `helpers/rules.js`, references to rows are stable keys (`helpers/ruleKeys.js`, `helpers/ids.js`), vocabularies live in `helpers/taxonomy.js` — see `CLAUDE.md`.
- **All strings go through `localization/pt-BR/`.** No hardcoded text in JS/HTML.
- **Delegated events.** The sheet's list and form interactions are wired once, on `document`, in `events/index.js`; the domain `events.js` files only export handlers. Self-contained widgets (dialogs, tabs, the character selector, toasts) bind their own listeners.
- **Open-state preservation.** `morphHTML`'s identity tracking (`shared/morph.js`) patches the DOM in place, so re-rendering a list doesn't collapse rows the user had expanded or close an open `<details>`.
- **Autorun trigger classes.** Modifier inputs trigger the engine through `compute/autorun.js`'s `AUTORUN_KIND` (immediate, burst, typing), each with its own trailing delay, so the DOM doesn't rebuild mid-keystroke.
- **Comments explain WHY, not WHAT** — see `CLAUDE.md`.
- **Conventional commits**, one-liners, never AI co-authored — see `CLAUDE.md`.

---

## Testing

Jest runs three projects (`jest.config.js`), and `tests/` is split to match:

- `tests/engine/` mirrors `engine/` (Node). The engine is pure computation, so most of the suite is here.
- `tests/data/` holds the guards that read the real CSVs (ids, keys, references, vocabularies); `npm run test:data` runs only these.
- `tests/dev/` mirrors `dev/public/js/` (jsdom): renderers, event handlers, stores and the reference page. The UI layer has logic worth testing (open-state preservation, steppers, persistence), so it is covered, with `tests/dev/helpers/` holding the DOM, state and fetch fixtures.

`tests/golden/` is not part of `npm test`: it backs `golden:record` and `golden:compare` (see `scripts/README.md`).

Shared helpers in `tests/helpers/`: the assertion helpers (`assertShape.js`, `assertBasePlusModifier.js`, `assertNumericMap.js`, `assertSelectedOnly.js`), `dataRefs.js` and `tempData.js` (edit a copy of the data for one test).

Neither tests nor code hardcode a dataset id. `tests/helpers/dataRefs.js` finds each row by its stable key, lazily, and `helpers/ids.js` resolves the ids the engine needs from keys (the list of keys the code depends on is in `helpers/ruleKeys.js`; dual-use weapons are the weapon keys present in both the melee and ranged tables). To renumber or reorder a dataset, edit the CSV, keep the keys on their rows, then run `npm run check:data`, `npm test` and `npm run test:renumber`; no code or test file should need to change. A key the code depends on that no row has fails `check:data` and `tests/data/ids.test.js`; a test ref that matches no row (or several) fails with a message pointing at the spec to update.

---

## Credits

- Icons by [game-icons.net](https://game-icons.net) (Lorc, Delapouite, Carl Olsen, Sbed, Willdabeast, Skoll & contributors), licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Per-icon attribution: `dev/public/vendor/game-icons/VERSION`.
- Fonts: [IBM Plex Sans / IBM Plex Mono](https://www.ibm.com/plex/), licensed [SIL OFL 1.1](https://scripts.sil.org/OFL), self-hosted under `dev/public/vendor/ibm-plex/`.

---

## Contributing

1. Read the relevant engine module(s) before proposing changes.
2. Ask clarifying questions first — don't assume during implementation.
3. Deliver in layers: engine + tests first, UI second.
4. Never put computed values in `state.selected` or hardcoded strings in JS/HTML.
5. Run `npm test` before opening a PR.
