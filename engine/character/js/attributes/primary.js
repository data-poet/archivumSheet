const {
  PRIMARY_COST,
  PRIMARY_DEFAULT_VALUE,
} = require("../../../../helpers/rules");

function buildAttribute(input = {}, costPerLevel) {
  const base_value = input.base_value ?? input.value ?? PRIMARY_DEFAULT_VALUE;
  const race_modifier = input.race_modifier ?? 0;
  const modifier = input.modifier ?? 0;
  const enchantment_modifier = input.enchantment_modifier ?? 0;

  const value = base_value + race_modifier + modifier + enchantment_modifier;

  const difference = base_value - PRIMARY_DEFAULT_VALUE;
  const cost = difference * costPerLevel;

  return {
    attribute: {
      base_value,
      race_modifier,
      modifier,
      enchantment_modifier,
      has_enchantment_modifier: input.has_enchantment_modifier ?? false,
      value,
      points: cost,
    },
    points: cost,
  };
}

function buildPrimaryAttributes({ ST = {}, DX = {}, IQ = {}, HT = {} }) {
  const st = buildAttribute(ST, PRIMARY_COST.ST);
  const dx = buildAttribute(DX, PRIMARY_COST.DX);
  const iq = buildAttribute(IQ, PRIMARY_COST.IQ);
  const ht = buildAttribute(HT, PRIMARY_COST.HT);

  return {
    primary_attributes: {
      ST: st.attribute,
      DX: dx.attribute,
      IQ: iq.attribute,
      HT: ht.attribute,
    },
    character_points: {
      ST: st.points,
      DX: dx.points,
      IQ: iq.points,
      HT: ht.points,
    },
  };
}

module.exports = {
  buildPrimaryAttributes,
};
