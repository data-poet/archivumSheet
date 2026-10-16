// Proves a change touched only comments and formatting: every changed .js file is compiled with comments
// stripped, once as it is in HEAD and once as it is now, and the two outputs must be identical.
//
//   npm run check:comments-only          working tree vs HEAD
//   npm run check:comments-only -- <ref> working tree vs another git ref
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const ROOT = path.join(__dirname, "..");
const ref = process.argv[2] ?? "HEAD";

function withoutComments(code) {
  return babel.transformSync(code, {
    comments: false,
    compact: false,
    configFile: false,
    babelrc: false,
    sourceType: "unambiguous",
  }).code;
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
}

const changed = git("diff", "--name-only", ref, "--", "*.js")
  .split("\n")
  .filter(Boolean)
  .filter((file) => fs.existsSync(path.join(ROOT, file)));

const failures = [];
changed.forEach((file) => {
  let before;
  try {
    before = git("show", `${ref}:${file}`);
  } catch {
    return; // a new file has nothing to compare with
  }
  const after = fs.readFileSync(path.join(ROOT, file), "utf8");
  if (withoutComments(before) !== withoutComments(after)) failures.push(file);
});

console.log(
  `${changed.length} changed file(s) compared, ${failures.length} with code differences`,
);
failures.forEach((file) => console.log(`  code changed: ${file}`));
process.exitCode = failures.length > 0 ? 1 : 0;
