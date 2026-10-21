import { buildPcPayload } from "dev/public/js/shared/pcPayload.js";

const DEFAULT_IMAGE = {
  uploaded: false,
  data: "",
  background: "",
  color: { r: "", g: "", b: "" },
  orientation: "",
  position: { x: "", y: "" },
  size: { width: "", height: "" },
  scale: "",
};

describe("buildPcPayload", () => {
  test("defaults every field for a blank info object", () => {
    expect(buildPcPayload({})).toEqual({
      player_name: "",
      character_name: "",
      character_sex: "",
      character_age: null,
      character_weight: null,
      starting_points: null,
      experience_points: null,
      ability_points: null,
      magic_points: null,
      tier_label: "",
      image: DEFAULT_IMAGE,
    });
  });

  test("defaults the same way when called with nothing at all", () => {
    expect(buildPcPayload()).toEqual(buildPcPayload({}));
  });

  test("carries through every set field", () => {
    const info = {
      player_name: "Player One",
      character_name: "Aria",
      character_sex: "F",
      character_age: 27,
      character_weight: 60,
      starting_points: 150,
      experience_points: 20,
      ability_points: 5,
      magic_points: 10,
      tier_label: "Alfa",
      image: { uploaded: true, data: "abc" },
    };

    expect(buildPcPayload(info)).toEqual(info);
  });

  test("zero is a real value, not a missing one, for age and weight", () => {
    const payload = buildPcPayload({ character_age: 0, character_weight: 0 });

    expect(payload.character_age).toBe(0);
    expect(payload.character_weight).toBe(0);
  });
});
