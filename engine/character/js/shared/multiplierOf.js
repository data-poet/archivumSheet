// Not `Number(x) || 1`: a literal 0 (immune to this element) is a real value that `||` would erase.
function multiplierOf(raw) {
  if (raw === undefined || raw === null || raw === "") return 1;
  const n = Number(raw);
  return Number.isNaN(n) ? 1 : n;
}

module.exports = { multiplierOf };
