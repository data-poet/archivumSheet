// Shields have no slots — a character can equip at most one shield at a time,
// but there is no positional slot system like armor pieces have.

const { VALID_STORED_AT } = require("../shared/storageLocations");
const {
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
} = require("../../../../helpers/ids.js");

module.exports = {
  VALID_STORED_AT,
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
};
