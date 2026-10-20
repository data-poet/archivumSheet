# Comments

Code should be self-explanatory through clear naming and structure. Comments are the exception, not the default.

- Default to no comments.
- Only add a comment when the WHY is non-obvious: a hidden constraint, a workaround for a specific bug, a subtle invariant, or behavior that would surprise a reader.
- Never explain WHAT the code does — good names already do that.
- Never reference the current task, ticket, or fix ("added for X", "fixes #123") — that belongs in the commit message, not the code.
- Keep comments as short as possible — one line, not a paragraph.
- No commented-out code, no restating the function/variable name in prose.

# Commits

- Never add a `Co-Authored-By` trailer or any other AI-attribution line — commits are authored by the user alone.
- Commit messages are one-liners, no body and always not signed.

# Architecture: where rules, ids and vocabularies live

The engine owns every computed value; the UI renders what it returns. Anything a rule change or a CSV revamp can touch has **one** home in `helpers/`, so changing it is one edit and a renumbered table needs none. Before writing a literal (a number, an id, a key, a tag, a column name), find its home:

| Module | Holds | Why |
| --- | --- | --- |
| `rules.js` (and `criticalRanges.js`) | Numeric rules the engine applies and the reference documents: costs, thresholds, `CONDITION_RULES` (status-tag table, pain factors, which rolls a penalty matches) | One edit per rule. Served to the browser by `/api/rules`, so the UI never copies a number |
| `ruleKeys.js` | The rows the code depends on, named by **stable key**: tier groups, singles, `LENIENT_TRAIT_KEYS` | Renumbering a dataset needs no code edit. A lenient group's missing row is "pending" (reported, never a crash) because the trait tables are being rebuilt |
| `ids.js` | The ids those keys resolve to, computed at load | Code never hardcodes an id. A vanished key leaves its rule inactive and `check:data` reports it |
| `taxonomy.js` | Controlled vocabularies matched against CSV columns: damage types, roll targets, status tags, recovery values | A renamed category is a one-file edit. Derive a list from a `rules.js` table when one exists |
| `datasets.js`, `datasetColumns.js`, `datasetReferences.js` | Each dataset's file, its id and key column, and the columns that hold ids of another dataset | Renaming, splitting or renumbering a CSV is a registry edit; `check:data` and `data:remap` read the same tables |
| `rowParsers.js`, `csvText.js` | How a CSV cell becomes a value; byte-faithful CSV reading and writing | `TRUE`, empty and lists mean the same everywhere; a rewrite diffs as exactly the cells that changed |

Rules of thumb:

- Refer to rows by `<prefix>_key`, never by id or name; new persisted state stores keys.
- Show a modified number as a sibling field (`effective_<field>`, `condition_modifier`); never change the original, because costs and derived stats keep using it.
- `helpers/` is CommonJS and the browser can't import it: read the value from `/api/rules`, or mirror it and pin the copy with a parity test (`tests/dev/shared/registries.test.js`). Every visible string lives in `localization/pt-BR/`.
- A CSV change must be mirrored in the Sheet, the source of the data: the next export overwrites `data/`.
- A refactor must not change behavior: `npm run golden:compare`, a before/after snapshot of the outputs it touches, and a mutation of the moved code that makes a test fail. Verify on a clean copy when unrelated work is uncommitted.
