const {
  PRIMARY_DEFAULT_VALUE,
  LOW_RESERVE,
  HP_THRESHOLDS,
} = require("../../../../helpers/rules");

const FIRST_DEATH_CHECK = HP_THRESHOLDS.deathCheckMultiples[0];
const DEATH_CHECK_COUNT = HP_THRESHOLDS.deathCheckMultiples.length;

// Archivum death thresholds use natural HT (base + race, meta-race included) instead of 4e's HP multiples.
function naturalHT(HT = {}) {
  return (HT.base_value ?? PRIMARY_DEFAULT_VALUE) + (HT.race_modifier ?? 0);
}

function hpState(current, natural, ht) {
  if (current <= -HP_THRESHOLDS.destroyedMultiple * ht) return "destroyed";
  if (current <= -HP_THRESHOLDS.deathMultiple * ht) return "dead";
  if (current <= -FIRST_DEATH_CHECK * ht) return "dying";
  if (current <= 0) return "collapsing";
  if (current < natural / LOW_RESERVE.belowDivisor) return "reeling";
  return "ok";
}

function fpState(current, natural) {
  if (current <= -natural) return "unconscious";
  if (current <= 0) return "collapsing";
  if (current < natural / LOW_RESERVE.belowDivisor) return "exhausted";
  return "ok";
}

function computeThresholds({ HT, HP, FP }) {
  const ht = naturalHT(HT);
  const naturalHP = HP.final_base_value;
  const naturalFP = FP.final_base_value;
  const deathChecks =
    HP.value <= -FIRST_DEATH_CHECK * ht
      ? Math.min(Math.floor(-HP.value / ht), HP_THRESHOLDS.destroyedMultiple)
      : 0;

  return {
    ht,
    hp: {
      major_wound_over: naturalHP / HP_THRESHOLDS.majorWoundDivisor,
      head_stun_over: naturalHP / HP_THRESHOLDS.headStunDivisor,
      reeling_below: naturalHP / LOW_RESERVE.belowDivisor,
      death_checks_from: -FIRST_DEATH_CHECK * ht,
      death_check_step: ht,
      death_at: -HP_THRESHOLDS.deathMultiple * ht,
      destroyed_at: -HP_THRESHOLDS.destroyedMultiple * ht,
      death_check_values: HP_THRESHOLDS.deathCheckMultiples.map((n) => -n * ht),
      state: hpState(HP.value, naturalHP, ht),
      death_checks: deathChecks,
      next_death_check:
        deathChecks < DEATH_CHECK_COUNT ? -(deathChecks + 1) * ht : null,
    },
    fp: {
      exhausted_below: naturalFP / LOW_RESERVE.belowDivisor,
      unconscious_at: -naturalFP,
      state: fpState(FP.value, naturalFP),
    },
  };
}

module.exports = {
  computeThresholds,
};
