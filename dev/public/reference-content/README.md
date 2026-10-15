# Reference content — style guide

Each `.md` here is one tab on the reference page (`reference.html`). It is rendered by marked + marked-alert, with KaTeX for math and a `[[glossary]]` extension (`js/reference/markdown.js`).
Placing a file: add it to `js/reference/referenceLayout.js` and add its label to `localization/pt-BR/reference.js`.

## File structure

- No title at the top. The tab already shows the name.
- Structure comes from `###` headings, which stay visible. Collapsibles are only for **lists of peers you look up one at a time** (maneuvers, conditions, hit locations, long tables).
- **Never nest `<details>`**, with one exception: worked examples. If an item has parts, label them in bold inside it.
- Consecutive `<details>` render as one boxed list of rows, and only one row per list stays open (added at render, no markup needed).
- **Collapse only long content** (more than about five lines). Short tabs, under about 500 words, use headings and no collapsibles. Short notes and formulas stay visible: use a callout.

```markdown
Intro opcional.

### Seção

<details>
<summary>Item | badge opcional</summary>

- **Termo:** conteúdo em markdown.

</details>

<details>
<summary>Outro item</summary>

Texto.

</details>
```

Markup rules (marked only parses markdown inside HTML blocks when they're separated by blank lines):

- Never indent `<details>`, `<summary>` or `</details>`. Keep them out of lists.
- `<summary>` holds plain text on its own line, with no `<b>`/`<strong>`; the CSS already bolds it.
- `<summary>Título | badge</summary>` shows the text after `|` as a small badge on the right. Use it for a short value worth scanning without opening: `Tronco | Redutor: 0`.
- Leave a blank line after the `<summary>` line and before each `</details>`.
- No `<br>` spacers, and no stray `---` rules.

## Inside an item

- Use paragraphs and lists. For definitions, start a list item with a bold label: `- **Termo:** texto`.
- No headings inside an item; use bold labels (`**Parte**` or `- **Termo:**`).
- Bold dice and modifiers: `**3d6**`, `**-2**`, `**+1**`.
- Put formulas in KaTeX display math:

  ```markdown
  $$
  \text{PV} = \left\lfloor \frac{HT \times 4 + ST \times 2}{2} \right\rfloor
  $$
  ```

## Examples

Worked examples always go in a collapsible titled `Exemplo` (or `Exemplos` for a list). It renders as a compact tinted box, can sit inside an item, and stays out of the item list:

```markdown
<details>
<summary>Exemplo</summary>

$$
\text{PV} = 32
$$

</details>
```

## Callouts

Use one blockquote callout per note, never emoji-prefixed quotes:

| Syntax         | Title         | Use for                                  |
| -------------- | ------------- | ---------------------------------------- |
| `> [!NOTE]`    | Nota          | Extra context                            |
| `> [!TIP]`     | Dica          | Practical advice                         |
| `> [!WARNING]` | Atenção       | Limits, exceptions, common mistakes      |
| `> [!HOUSE]`   | Regra da Mesa | Archivum house rules that differ from 4e |

```markdown
> [!HOUSE]
> Os limiares de morte usam HT, não PV.
```

## Tables

- At most 3 columns, with short cells. Wider tables scroll sideways on mobile, but they read badly there.
- Use `<br>` only inside table cells, where markdown can't hold a list. When a row needs paragraphs, use one `<details>` per row instead.
- On phones, tables with long text cells (over 80 characters) turn into one card per row, labelled by the column headers. Keep headers short and meaningful.

## Glossary terms

- Write `[[PV]]` or `[[PV|pontos de vida]]` to link a term to its definition popover. Keys live in `localization/pt-BR/glossary.js`.
- Link the first occurrence of a term in each group, not every occurrence.
- A test fails if a file uses a key the glossary doesn't have.

## Language

- Use pt-BR, with the glossary's canonical terms (Falha Crítica, PV, PF, Mana, Vontade…).
- No English in parentheses, no book page references.
- Rules are GURPS 4e plus the Archivum house rules. Where they differ, the engine (`engine/`) is the source of truth.
