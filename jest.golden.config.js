// Not part of `npm test`: the golden dumps run through scripts/golden.js against a frozen copy of data/.
module.exports = {
  testEnvironment: "node",
  modulePaths: ["<rootDir>"],
  testMatch: ["<rootDir>/tests/golden/**/*.test.js"],
  transform: { "^.+\\.js$": "babel-jest" },
};
