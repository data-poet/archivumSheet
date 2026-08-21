// Syntax-only transform so Jest can parse the ES modules under dev/public/js.
// No downleveling target is set beyond "current Node" — jsdom runs the code,
// so there's no need to transpile for older browsers. dev/public/js source
// files are never touched by this; Babel only transforms the copy Jest sees
// at test time, so the browser still gets untouched, unbundled ES modules.
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};
