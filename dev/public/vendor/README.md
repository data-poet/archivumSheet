# vendor/

Third-party code the sheet page loads directly, outside npm — this app has no bundler, and
`dev/public/` is served as-is, so a browser `import` can't reach `node_modules/`. Each library gets
its own folder: the untouched upstream file(s), its licence, and a `VERSION` file pinning the exact
release vendored.

A matching `devDependency` in `package.json` keeps the same version installable for tests (the real
library, not a fake, where its behaviour — e.g. focus handling — is what's under test); a parity
test (`tests/dev/shared/morph.test.js`) fails if the two ever disagree.

The reference page (`reference.html`) instead loads its third-party scripts from a CDN
(`marked`, `minisearch`, `katex`) — that split is deliberate, not an inconsistency: the sheet is
what people play with, including possibly offline, so it gets same-origin vendored files; the
reference page is read-only reading material, where a CDN's cache is a net win.

## idiomorph

0BSD. Vendored file is `idiomorph.esm.js`, unminified (upstream ships no minified ES module build,
only a minified UMD global) — `shared/morph.js` is the only importer.
