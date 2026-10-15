// Official 4e (B347–348): rolls at or below `success` are critical successes, at or above `failure` critical failures.
function criticalRanges(nh) {
  const success = nh >= 16 ? 6 : nh >= 15 ? 5 : 4;
  const failure = Math.min(nh <= 15 ? 17 : 18, Math.max(nh + 10, 5));
  return { success, failure };
}

module.exports = {
  criticalRanges,
};
