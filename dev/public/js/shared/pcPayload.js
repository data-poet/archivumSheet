// The pc shape the engine request and the persisted sheet both need, built straight from
// state.selected.character so persistence never has to wait on (or trust the staleness of)
// the engine's own echo of the last request it was sent.
export function buildPcPayload(info = {}) {
  return {
    player_name: info.player_name || "",
    character_name: info.character_name || "",
    character_sex: info.character_sex || "",
    character_age: info.character_age ?? null,
    character_weight: info.character_weight ?? null,
    starting_points: info.starting_points ?? null,
    experience_points: info.experience_points ?? null,
    ability_points: info.ability_points ?? null,
    magic_points: info.magic_points ?? null,
    // Mirrors store/characters.js's _applyData — see that whitelist entry's comment.
    tier_label: info.tier_label ?? "",
    image: info.image ?? {
      uploaded: false,
      data: "",
      background: "",
      color: { r: "", g: "", b: "" },
      orientation: "",
      position: { x: "", y: "" },
      size: { width: "", height: "" },
      scale: "",
    },
  };
}
