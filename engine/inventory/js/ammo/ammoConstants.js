const { VALID_STORED_AT } = require("../shared/storageLocations");

const VALID_CONTAINER_STORED_AT = ["equipped", ...VALID_STORED_AT];

const VALID_LOOSE_STORED_AT = VALID_STORED_AT;

module.exports = {
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
};
