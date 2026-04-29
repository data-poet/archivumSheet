const ATTRIBUTE_COST = {
  ST: 10,
  DX: 20,
  IQ: 20,
  HT: 10,
};

const DEFAULT_VALUE = 10;

/**
 * Calculates a single attribute
 */
function buildAttribute({ base_value = 10, modifier = 0 }, costPerLevel) {
  const value = base_value + modifier;

  const difference = base_value - DEFAULT_VALUE;
  const cost = difference * costPerLevel;

  return {
    attribute: {
      base_value,
      modifier,
      value,
    },
    points: cost,
  };
}

/**
 * Builds all primary attributes
 */
function buildPrimaryAttributes({ ST = {}, DX = {}, IQ = {}, HT = {} }) {
  const st = buildAttribute(ST, ATTRIBUTE_COST.ST);
  const dx = buildAttribute(DX, ATTRIBUTE_COST.DX);
  const iq = buildAttribute(IQ, ATTRIBUTE_COST.IQ);
  const ht = buildAttribute(HT, ATTRIBUTE_COST.HT);

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
