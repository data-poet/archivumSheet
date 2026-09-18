function sumObjectValues(obj = {}) {
  return Object.values(obj).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
}

module.exports = {
  sumObjectValues,
};
