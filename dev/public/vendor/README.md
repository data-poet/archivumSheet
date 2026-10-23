# vendor/

Third-party code the sheet page loads directly, outside npm — this app has no bundler, and
`dev/public/` is served as-is, so a browser `import` can't reach `node_modules/`. Each library gets
its own folder: the untouched upstream file(s), its licence, and a `VERSION` file pinning the exact
release vendored.

A matching `devDependency` in `package.json` keeps the same version installable for tests (the real
library, not a fake, where its behaviour — e.g. focus handling — is what's under test); a parity
test (`tests/dev/shared/morph.test.js`) fails if the two ever disagree.

The reference page (`reference.html`) instead loads `marked` and `minisearch` from a CDN — that
split is deliberate, not an inconsistency: the sheet is what people play with, including possibly
offline, so it gets same-origin vendored files; the reference page is read-only reading material,
where a CDN's cache is a net win. KaTeX is the exception: spell data (e.g. Zoomancia, Aeromancia
scaling) embeds LaTeX formulas, so the sheet needs it too and vendors it; the reference page keeps
loading it from the CDN since its existing setup already works.

## idiomorph

0BSD. Vendored file is `idiomorph.esm.js`, unminified (upstream ships no minified ES module build,
only a minified UMD global) — `shared/morph.js` is the only importer.

## katex

MIT. Vendored files are `katex.esm.js` and `auto-render.esm.js` (upstream's unminified ES module
builds; `auto-render.esm.js`'s import is rewritten from `../katex.mjs` to `./katex.esm.js` since
both now live flat in this folder), plus `katex.min.css` and `fonts/*.woff2` (woff2-only — every
browser this sheet targets supports it, so the ttf/woff fallbacks the CSS references are skipped).
`engine/magic/spells/render.js` is the only importer.
