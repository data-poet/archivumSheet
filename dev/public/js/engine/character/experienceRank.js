// Tiers are inclusive on both ends (e.g. 0-100), matching how the points fields are entered.
const TIERS = [
  { min: 0, max: 100, badge: "0" },
  { min: 101, max: 200, badge: "1" },
  { min: 201, max: 300, badge: "2" },
  { min: 301, max: 400, badge: "3" },
  { min: 401, max: 500, badge: "4" },
  { min: 501, max: Infinity, badge: "5+" },
];

export function getExperienceRank(xp) {
  const points = Math.max(0, Number(xp) || 0);
  const found = TIERS.findIndex((tier) => points <= tier.max);
  const index = found === -1 ? TIERS.length - 1 : found;
  const tier = TIERS[index];
  const isMaxRank = index === TIERS.length - 1;
  const tierSpan = isMaxRank ? null : tier.max - tier.min + 1;
  const progress = isMaxRank
    ? 100
    : Math.round(((points - tier.min) / tierSpan) * 100);
  const pointsToNext = isMaxRank ? 0 : tier.max - points + 1;

  return {
    index,
    badge: tier.badge,
    tierMin: tier.min,
    tierMax: tier.max,
    isMaxRank,
    progress,
    pointsToNext,
  };
}
