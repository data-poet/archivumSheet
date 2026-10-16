# Scripts

Everything here is run through `npm run <name>`; each script is plain Node and can also be run directly with `node scripts/<file>.js`. Keep this file in step with the scripts: when a script gains a flag or a new one is added, update its section.

Contents: [`data:import`](#dataimport-the-one-to-run-after-every-spreadsheet-export) · [`check:data`](#checkdata) · [`data:format`](#dataformat) · [`data:remap`](#dataremap) · [`data:keys`](#datakeys) · [`check:comments-only`](#checkcomments-only) · [`test:renumber`](#testrenumber) · [`golden:*` and `coverage:*`](#golden-dumps-and-coverage-for-refactors) · [`test:data`](#testdata) · [known issues file](#the-known-issues-file)

---

## `data:import`: the one to run after every spreadsheet export

**Use it when:** you exported CSVs from Google Sheets and want them in the repo.

```bash
# 1. export each sheet as CSV and overwrite the file in data/ with the same name (db_skills.csv, ...)
# 2. then:
npm run data:import -- --dry-run   # optional: print what would change, write nothing
npm run data:import                # apply everything, then run check:data
git diff                           # review; undo everything with: git checkout -- data
```

It runs these steps in order, on every dataset in `data/`:

| Step      | What it does                                                                                                                                                                                                                                                                                    | Same as                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1. format | LF line endings, final newline. Line breaks inside quoted cells are left alone                                                                                                                                                                                                                  | `npm run data:format`  |
| 2. keys   | Gives every row its `<prefix>_key`. A key already in the file is kept; otherwise the row is matched to its committed version (same id and name, then same name and tier/type, then identical rows in order) and takes that key; a row that matches nothing gets a new key derived from its name | `scripts/carryKeys.js` |
| 3. remap  | If a dataset's ids changed since the last commit (renumbered, reordered), repoints every id that points at it: weapon skills, race and meta-race innate traits, `skill_defaults`                                                                                                                | `npm run data:remap`   |
| 4. check  | Validates everything and prints the report                                                                                                                                                                                                                                                      | `npm run check:data`   |

**Read the report.** What to look at:

- `keys: ... N new, M gone` per dataset. **new** rows got a derived key: fine for rows you added; for a row you only _renamed and renumbered in the same export_ it means the match failed, the old key is listed under **gone**, and anything that pointed at it is now dangling. Fix by editing the new key in the CSV to the old one (the **gone** line shows it), then run `npm run data:import` again.
- `remap: ... still points at X, whose row is gone`: a reference to a row that no longer exists. Either restore the row or edit the reference.
- `skipped, it was edited too`: a dataset that points at a renumbered one was also edited in this export, so the tool assumed you already used the new ids and left it alone. If it still has the old ids: `npm run data:remap -- <DATASET> --force`.
- The `check:data` section at the end: any **ERROR** must be fixed before committing.

**What it assumes:**

- The committed version of each file (`git HEAD`) is the reference for keys and old ids. Commit after each import you accept, so the next export is compared with it.
- Keys are the stable identity of a row. Never change a key by hand unless you mean to (see [keys](#datakeys)).
- Run it with a clean `data/` (nothing uncommitted from an earlier, unreviewed import).

**Limits:** two or more rows with the same name and tier/type (the five `Shuriken | Obra-Prima` rows, the duplicated skill) are matched to the committed ones in file order. If you reorder such rows their keys swap, which is harmless for identical rows but shows in the diff.

---

## `check:data`

**Use it when:** after any CSV edit, and before committing data. `npm test` runs it too.

```bash
npm run check:data               # errors, known issues, warnings
npm run check:data -- --verbose  # also: columns no code reads, and the derived dual-use pairs
```

Exit code 1 when there is an error that is not in the [known issues file](#the-known-issues-file). Warnings never fail.

What it checks:

| Kind               | Examples                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Errors             | repeated or empty header names; ids not shaped `PREFIX-NNN`; repeated ids; missing, non-slug or repeated keys; a key the code depends on that no row has (`rule-key`), or a tier beyond the registered ones (`rule-tier`); references to ids that do not exist; values outside what the engine knows (damage types, tiers, armor slots, enchantment effect types, ...); a skill whose attribute/difficulty has no cost table; a decimal comma (`1,5`) in a numeric column; the code reading a `row.<column>` no dataset has |
| Warnings           | CRLF line endings or no final newline (fix with `data:format`); weapons without a skill; two rows with the same name and tier; race trait names that disagree with their ids (the id is the truth)                                                                                                                                                                                                                                                                                                                          |
| Info (`--verbose`) | columns nothing reads, number of derived dual-use pairs                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

How to read a line: `DATASET  id-or-key  check-name: message`. The check name tells you what rule failed.

---

## `data:format`

**Use it when:** you want only the line-ending cleanup (`data:import` already does it).

```bash
npm run data:format              # rewrite the files that need it
npm run data:format -- --check   # only list them; exit 1 if any needs it
```

Google Sheets exports CRLF record endings and no final newline. This converts record endings to LF and adds the final newline. Safe to run repeatedly.

---

## `data:remap`

**Use it when:** you renumbered or reordered a dataset that others point at (skills, advantages, disadvantages) and want the references updated. `data:import` does this automatically; run it by hand when you edited the CSV directly.

```bash
npm run data:remap -- SKILLS                         # dry run
npm run data:remap -- SKILLS --write                 # rewrite the referencing CSVs
npm run data:remap -- SKILLS ADVANTAGES DISADVANTAGES --write
npm run data:remap -- SKILLS --write --force         # also remap files that differ from HEAD
```

How it works: it reads the committed version of the dataset (`git show HEAD:...`), matches rows to the working file by `_key`, and rewrites every cell that held an old id. The reference columns are listed in `helpers/datasetReferences.js` (`weapon_skill_id`, race and meta-race innate trait ids, `skill_defaults`); add a line there when a new column holds ids.

It needs the key column in both versions. A dataset that was also edited is skipped unless you pass `--force`, because its cells probably already use the new ids.

---

## `data:keys`

**Use it when:** adding the key column to a dataset for the first time, or filling keys for new rows by hand. Day to day `data:import` does this for you.

```bash
npm run data:keys                    # dry run: keys and collisions per dataset
npm run data:keys -- --write         # add the column after the id column (skips datasets that have it)
npm run data:keys -- --fill-missing  # fill only empty key cells (new rows), from their names
```

A key is a lowercase slug (`reflexos-em-combate`, `machadinha-comum`) unique within its dataset. It is assigned once and does **not** change when the name is corrected or the id renumbered: tests and code refer to rows by key. Rules of thumb:

- Free to edit until a test, `helpers/ruleKeys.js` or `tests/helpers/dataRefs.js` uses it.
- The keys the game code depends on are listed in `helpers/ruleKeys.js` (trait tiers, Reflexos em Combate, the Broquel and Escudo skills, the broquel shields, the magic return enchantment). `check:data` fails if one disappears.
- A weapon is dual-use (melee and ranged mirror each other) when its `weapon_key` exists in both weapon tables.
- Keys that the tool had to number (`...-2`) are listed as "needs a better key": give them a real one by hand.

---

## `check:comments-only`

**Use it when:** you edited comments (or formatting) and want proof that no code changed.

```bash
npm run check:comments-only          # working tree vs HEAD
npm run check:comments-only -- <ref> # working tree vs another git ref
```

Every changed `.js` file is compiled with comments stripped, once as it is in the ref and once now; the two outputs must be identical. It prints the files whose code differs and exits 1 if there is any. New files are skipped. Pair it with `npm test` after a comment cleanup.

---

## `test:renumber`

**Use it when:** you changed code that touches ids, and to prove nothing hardcodes one.

```bash
npm run test:renumber                # shift every id by 500 in a temp copy and run the whole suite there
npm run test:renumber -- --by 250
```

It copies the repo to a temp folder, shifts every `PREFIX-NNN` in `data/` (and the frontend's default material id), runs Jest, and deletes the copy. A failure means a test or code relies on a literal id. The default shift is large on purpose: with a small one a hardcoded id can land on another row that still exists and pass by accident.

---

## Golden dumps and coverage (for refactors)

**Use them when:** you are about to refactor the engine or the tests and want proof that nothing changed.

```bash
npm run golden:record                  # before: freeze data/ at HEAD, dump what the engine builds from it
npm run golden:record -- --ref <ref>   # freeze another git ref instead of HEAD
npm run golden:compare                 # after: every dump must be identical

npm run coverage:record                # before deleting or merging tests: per-file coverage baseline
npm run coverage:compare               # after: fails if any file's lines or branches dropped
```

- The golden dumps cover the 19 raw datasets, the `getXDB` loader outputs, the constants served by the API, and `buildSheet` for a fixture sheet, four variants of it and the shipped ally. They are built from a **frozen copy** of the data in `.golden/`, so they stay valid while you edit the live CSVs. Re-record after an intended output change.
- `.golden/` is gitignored and local. It is created by the `record` commands.
- `coverage:compare` ignores files that did not exist at record time; re-record after a refactor that legitimately shrinks a file.

---

## `test:data`

```bash
npm run test:data    # only tests/data/: the guards that read the real CSVs (seconds)
```

Part of `npm test` as well. Run it alone for quick feedback after a CSV edit.

---

## The known issues file

`scripts/dataKnownIssues.json` lists errors `check:data` should report but not fail on, so the run is green while a defect is being fixed in the data. Each entry:

```json
{
  "check": "enum",
  "dataset": "MELEE_WEAPONS",
  "ids": ["MELEE-220"],
  "note": "why it is tolerated"
}
```

`ids` is optional (omit it to tolerate the whole check for that dataset). Remove an entry as soon as the data is fixed; the goal is an empty list. It is shifted along with the data by `test:renumber`.

---

## Where the logic lives

| File                                            | Role                                       |
| ----------------------------------------------- | ------------------------------------------ |
| `scripts/importData.js`                         | the `data:import` pipeline                 |
| `scripts/carryKeys.js`                          | key carry-over used by the import          |
| `scripts/generateKeys.js`                       | key derivation and the `data:keys` command |
| `scripts/remapReferences.js`                    | the remap logic and command                |
| `scripts/formatData.js`                         | line-ending normalization                  |
| `scripts/checkData.js`                          | the validation rules                       |
| `scripts/renumberCheck.js`, `scripts/golden.js` | refactor safety nets                       |
| `helpers/datasetReferences.js`                  | which columns hold ids of another dataset  |
| `helpers/ruleKeys.js`                           | rows the game code depends on, by key      |
| `helpers/datasetColumns.js`                     | the id and key column of each dataset      |
| `helpers/csvText.js`                            | byte-faithful CSV reading and writing      |
