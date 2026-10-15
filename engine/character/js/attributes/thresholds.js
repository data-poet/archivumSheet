// Archivum death thresholds use natural HT (base + race, meta-race included) instead of 4e's HP multiples.
function naturalHT(HT = {}) {
  return (HT.base_value ?? 10) + (HT.race_modifier ?? 0);
}

function hpState(current, natural, ht) {
  if (current <= -10 * ht) return "destroyed";
  if (current <= -5 * ht) return "dead";
  if (current <= -ht) return "dying";
  if (current <= 0) return "collapsing";
  if (current < natural / 3) return "reeling";
  return "ok";
}

function fpState(current, natural) {
  if (current <= -natural) return "unconscious";
  if (current <= 0) return "collapsing";
  if (current < natural / 3) return "exhausted";
  return "ok";
}

function computeThresholds({ HT, HP, FP }) {
  const ht = naturalHT(HT);
  const naturalHP = HP.final_base_value;
  const naturalFP = FP.final_base_value;
  const deathChecks =
    HP.value <= -ht ? Math.min(Math.floor(-HP.value / ht), 10) : 0;

  return {
    ht,
    hp: {
      major_wound_over: naturalHP / 2,
      head_stun_over: naturalHP / 3,
      reeling_below: naturalHP / 3,
      death_checks_from: -ht,
      death_check_step: ht,
      death_at: -5 * ht,
      destroyed_at: -10 * ht,
      death_check_values: [1, 2, 3, 4].map((n) => -n * ht),
      state: hpState(HP.value, naturalHP, ht),
      death_checks: deathChecks,
      next_death_check: deathChecks < 4 ? -(deathChecks + 1) * ht : null,
    },
    fp: {
      exhausted_below: naturalFP / 3,
      unconscious_at: -naturalFP,
      state: fpState(FP.value, naturalFP),
    },
  };
}

module.exports = {
  computeThresholds,
};
