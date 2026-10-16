// The only test-side file that knows how datasets identify their rows. Tests ask for a row by what it
// is (a name, or an effect and target) and get whatever id it has now, so renumbering a dataset never
// touches a test. A spec that matches zero or several rows throws: edit the spec here when a row is
// renamed. Ids that production code owns (helpers/ids.js) come from there, not from a lookup.
const { loadDataset } = require("helpers/datasets.js");
const { REFLEXOS_EM_COMBATE_ID, ESCUDO_SKILL_ID } = require("helpers/ids.js");

const ID_COLUMN = {
  ACCESSORIES: "accessory_id",
  ADVANTAGES: "advantage_id",
  ADVENTURE_GEAR: "adventure_gear_id",
  ALCHEMY: "consumable_id",
  AMMO: "ammo_id",
  AMMO_CONTAINERS: "container_id",
  ARMORS: "armor_id",
  CRAFTING_MATERIALS: "material_id",
  DISADVANTAGES: "disadvantage_id",
  ENCHANTMENTS: "enchantment_id",
  FIREARMS: "weapon_id",
  GRIMOIRE: "spell_id",
  MAGIC_GEAR: "magic_gear_id",
  MELEE_WEAPONS: "weapon_id",
  META_RACES: "meta_race_id",
  RACES: "race_id",
  RANGED_WEAPONS: "weapon_id",
  SHIELDS: "shield_id",
  SKILLS: "skill_id",
};

function idOf(dataset, where) {
  const rows = loadDataset(dataset).filter((row) =>
    Object.entries(where).every(([column, value]) => row[column] === value),
  );
  if (rows.length !== 1) {
    throw new Error(
      `[dataRefs] ${dataset} ${JSON.stringify(where)} matched ${rows.length} rows — update tests/helpers/dataRefs.js`,
    );
  }
  return rows[0][ID_COLUMN[dataset]];
}

// Entries resolve on first access, so a row that was renamed or deleted fails only the tests that use it.
function lazy(entries) {
  const group = {};
  Object.entries(entries).forEach(([key, spec]) => {
    let resolved;
    Object.defineProperty(group, key, {
      enumerable: true,
      get() {
        if (resolved === undefined) {
          resolved = typeof spec === "function" ? spec() : spec;
        }
        return resolved;
      },
    });
  });
  return group;
}

const ACCESSORY = lazy({
  anel: () => idOf("ACCESSORIES", { accessory_name: "Anel" }),
  colar: () => idOf("ACCESSORIES", { accessory_name: "Colar" }),
  coroa: () => idOf("ACCESSORIES", { accessory_name: "Coroa" }),
});

const ADVANTAGE = lazy({
  atraente: () => idOf("ADVANTAGES", { advantage_name: "ATRAENTE" }),
  eleganteBonito: () =>
    idOf("ADVANTAGES", { advantage_name: "ELEGANTE/BONITO" }),
  hipoalgia: () => idOf("ADVANTAGES", { advantage_name: "HIPOALGIA" }),
  inabalavel: () => idOf("ADVANTAGES", { advantage_name: "INABALÁVEL" }),
  indomavel: () => idOf("ADVANTAGES", { advantage_name: "INDOMÁVEL" }),
  memoriaEideticaTotal: () =>
    idOf("ADVANTAGES", {
      advantage_name: "MEMORIA EIDÉTICA TOTAL",
    }),
  muitoBonito: () => idOf("ADVANTAGES", { advantage_name: "MUITO BONITO" }),
  naoComeOuBebe: () =>
    idOf("ADVANTAGES", { advantage_name: "NÃO COME OU BEBE" }),
  naoDorme: () => idOf("ADVANTAGES", { advantage_name: "NÃO DORME" }),
  naoRespira: () => idOf("ADVANTAGES", { advantage_name: "NÃO RESPIRA" }),
  prontidao1: () => idOf("ADVANTAGES", { advantage_name: "PRONTIDÃO +1" }),
  reflexosEmCombate: REFLEXOS_EM_COMBATE_ID,
  resistenciaNaturalAFogo: () =>
    idOf("ADVANTAGES", {
      advantage_name: "RESISTÊNCIA NATURAL A FOGO",
    }),
  suportePressorico3: () =>
    idOf("ADVANTAGES", {
      advantage_name: "SUPORTE PRESSÓRICO 3",
    }),
  toleranciaAFerimentosHomogeneo: () =>
    idOf("ADVANTAGES", {
      advantage_name: "TOLERÂNCIA À FERIMENTOS | HOMOGÊNEO",
    }),
  toleranciaAFerimentosSemSangue: () =>
    idOf("ADVANTAGES", {
      advantage_name: "TOLERÂNCIA À FERIMENTOS | SEM SANGUE",
    }),
  visaoNoturna: () => idOf("ADVANTAGES", { advantage_name: "VISÃO NOTURNA" }),
});

const AMMO = lazy({
  bolaDeFerro: () => idOf("AMMO", { ammo_name: "Bola de Ferro" }),
});

const ARMOR = lazy({
  botasReforcadas: () =>
    idOf("ARMORS", {
      armor_name: "Botas Reforçadas",
      armor_piece_location: "Pés",
      armor_tier: "Comum",
    }),
  bracadeiras: () =>
    idOf("ARMORS", {
      armor_name: "Braçadeiras",
      armor_piece_location: "Braços",
      armor_tier: "Comum",
    }),
  capuz: () =>
    idOf("ARMORS", {
      armor_name: "Capuz",
      armor_piece_location: "Cabeça",
      armor_tier: "Comum",
    }),
  cotaDeMalha: () =>
    idOf("ARMORS", {
      armor_name: "Cota de Malha",
      armor_piece_location: "Tronco",
      armor_tier: "Comum",
    }),
  gibao: () =>
    idOf("ARMORS", {
      armor_name: "Gibão",
      armor_piece_location: "Tronco",
      armor_tier: "Comum",
    }),
  grevasDeMalha: () =>
    idOf("ARMORS", {
      armor_name: "Grevas de Malha",
      armor_piece_location: "Pernas",
      armor_tier: "Comum",
    }),
  manoplasDeMalha: () =>
    idOf("ARMORS", {
      armor_name: "Manoplas de Malha",
      armor_piece_location: "Mãos",
      armor_tier: "Comum",
    }),
});

const CONTAINER = lazy({
  estojoDeCintura: () =>
    idOf("AMMO_CONTAINERS", {
      container_name: "Estojo de Cintura",
      container_capacity: "18",
    }),
});

const DISADVANTAGE = lazy({
  aparenciaDesagradavel: () =>
    idOf("DISADVANTAGES", {
      disadvantage_name: "APARÊNCIA DESAGRADÁVEL",
    }),
  compulsaoPesada: () =>
    idOf("DISADVANTAGES", {
      disadvantage_name: "COMPULSÃO PESADA",
    }),
  epilepsia: () => idOf("DISADVANTAGES", { disadvantage_name: "EPILEPSIA" }),
  feio: () => idOf("DISADVANTAGES", { disadvantage_name: "FEIO" }),
  fragilNaoNatural: () =>
    idOf("DISADVANTAGES", {
      disadvantage_name: "FRÁGIL | NÃO NATURAL",
    }),
  furia: () => idOf("DISADVANTAGES", { disadvantage_name: "FÚRIA" }),
  hediondo: () => idOf("DISADVANTAGES", { disadvantage_name: "HEDIONDO" }),
  monstruoso: () => idOf("DISADVANTAGES", { disadvantage_name: "MONSTRUOSO" }),
  reprogramavel: () =>
    idOf("DISADVANTAGES", { disadvantage_name: "REPROGRAMÁVEL" }),
  semRecuperacaoTotal: () =>
    idOf("DISADVANTAGES", {
      disadvantage_name: "SEM RECUPERAÇÃO | TOTAL",
    }),
  vunerabilidadeNaturalAFogo: () =>
    idOf("DISADVANTAGES", {
      disadvantage_name: "VUNERABILIDADE NATURAL A FOGO",
    }),
});

const ENCHANTMENT = lazy({
  addAdvantage: () =>
    idOf("ENCHANTMENTS", { enchantment_effect_type: "advantage" }),
  addWeight: () =>
    idOf("ENCHANTMENTS", { enchantment_effect_type: "add_weight" }),
  fortifyBAL: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_damage",
      enchantment_target: "BAL",
    }),
  fortifyDamageResistance: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_damage_resistance",
    }),
  fortifyFireResistance: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_resistance",
      enchantment_target: "Fire",
    }),
  fortifyHT: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_attribute",
      enchantment_target: "HT",
    }),
  fortifyIQ: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_attribute",
      enchantment_target: "IQ",
    }),
  fortifyMana: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_attribute",
      enchantment_target: "Mana",
    }),
  fortifyST: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "fortify_attribute",
      enchantment_target: "ST",
    }),
  weakenST: () =>
    idOf("ENCHANTMENTS", {
      enchantment_effect_type: "weaken_attribute",
      enchantment_target: "ST",
    }),
});

const FIREARM = lazy({
  pistolaFlintlock: () =>
    idOf("FIREARMS", {
      weapon_name: "Pistola Flintlock",
      weapon_tier: "Comum",
    }),
});

const GEAR = lazy({
  basicoPessoal: () =>
    idOf("ADVENTURE_GEAR", {
      adventure_gear_name: "Básico Pessoal",
    }),
});

const MAGIC_GEAR = lazy({
  alaude: () => idOf("MAGIC_GEAR", { magic_gear_name: "Alaúde" }),
  bastao: () => idOf("MAGIC_GEAR", { magic_gear_name: "Bastão" }),
  cajado: () => idOf("MAGIC_GEAR", { magic_gear_name: "Cajado" }),
  grimorio: () => idOf("MAGIC_GEAR", { magic_gear_name: "Grimório" }),
  varinha: () => idOf("MAGIC_GEAR", { magic_gear_name: "Varinha" }),
});

const MATERIAL = lazy({
  aco: () =>
    idOf("CRAFTING_MATERIALS", {
      material_name: "Aço",
      material_tier: "Incomum",
    }),
  ferro: () =>
    idOf("CRAFTING_MATERIALS", {
      material_name: "Ferro",
      material_tier: "Comum",
    }),
});

const MELEE = lazy({
  foiceCurta: () =>
    idOf("MELEE_WEAPONS", {
      weapon_name: "Foice Curta",
      weapon_tier: "Comum",
    }),
  machadinha: () =>
    idOf("MELEE_WEAPONS", {
      weapon_name: "Machadinha",
      weapon_tier: "Comum",
    }),
  machadoMilitar: () =>
    idOf("MELEE_WEAPONS", {
      weapon_name: "Machado Militar",
      weapon_tier: "Comum",
    }),
});

const META_RACE = lazy({
  esqueleto: () =>
    idOf("META_RACES", {
      meta_race_name: "Morto-Vivo",
      meta_race_sub_name: "Esqueleto",
    }),
  zumbi: () =>
    idOf("META_RACES", {
      meta_race_name: "Morto-Vivo",
      meta_race_sub_name: "Zumbi",
    }),
});

const POTION = lazy({
  pocaoDeVida: () =>
    idOf("ALCHEMY", {
      consumable_name: "Poção de Vida",
      consumable_tier: "Comum",
    }),
});

const RACE = lazy({
  dracontoVermelho: () =>
    idOf("RACES", {
      race_name: "Draconato",
      race_sub_name: "Draconto Vermelho",
    }),
  elementalDeTerra: () =>
    idOf("RACES", {
      race_name: "Elemental",
      race_sub_name: "Elemental de Terra",
    }),
});

const RANGED = lazy({
  arcoCurto: () =>
    idOf("RANGED_WEAPONS", {
      weapon_name: "Arco Curto",
      weapon_tier: "Comum",
    }),
  facaDeArremessoBoa: () =>
    idOf("RANGED_WEAPONS", {
      weapon_name: "Faca de Arremesso",
      weapon_tier: "Boa",
    }),
  machadinha: () =>
    idOf("RANGED_WEAPONS", {
      weapon_name: "Machadinha",
      weapon_tier: "Comum",
    }),
});

const SHIELD = lazy({
  escudo: () =>
    idOf("SHIELDS", { shield_name: "Escudo", shield_tier: "Comum" }),
  escudoTorre: () =>
    idOf("SHIELDS", {
      shield_name: "Escudo Torre",
      shield_tier: "Comum",
    }),
});

const SKILL = lazy({
  adestramentoDeAnimais: () =>
    idOf("SKILLS", {
      skill_name: "ADESTRAMENTO DE ANIMAIS",
    }),
  arco: () => idOf("SKILLS", { skill_name: "ARCO" }),
  arremessarFeitico: () => idOf("SKILLS", { skill_name: "ARREMESSAR FEITIÇO" }),
  arremessoDeMachado: () =>
    idOf("SKILLS", { skill_name: "ARREMESSO DE MACHADO" }),
  bastao: () => idOf("SKILLS", { skill_name: "BASTÃO" }),
  escudo: ESCUDO_SKILL_ID,
  espadasCurtas: () => idOf("SKILLS", { skill_name: "ESPADAS CURTAS" }),
  espadasLongas: () => idOf("SKILLS", { skill_name: "ESPADAS LONGAS" }),
  faca: () => idOf("SKILLS", { skill_name: "FACA" }),
  falcoaria: () => idOf("SKILLS", { skill_name: "FALCOARIA" }),
  machadoMaca: () => idOf("SKILLS", { skill_name: "MACHADO/MAÇA" }),
  sacarRapidoMachadosMaca: () =>
    idOf("SKILLS", {
      skill_name: "SACAR RAPIDO | MACHADOS/MAÇA",
    }),
});

// Ids that sheet.full.json and older fixtures were captured with, mapped to what they are now.
const LEGACY_IDS = lazy({
  "ACCESSORY-000": () => ACCESSORY.anel,
  "ACCESSORY-001": () => ACCESSORY.colar,
  "ADV-000": () => ADVANTAGE.atraente,
  "ADV-001": () => ADVANTAGE.eleganteBonito,
  "ADV-002": () => ADVANTAGE.muitoBonito,
  "ADV-031": () => ADVANTAGE.prontidao1,
  "ADV-049": () => ADVANTAGE.hipoalgia,
  "ADV-053": () => ADVANTAGE.memoriaEideticaTotal,
  "ADV-055": () => ADVANTAGE.reflexosEmCombate,
  "ADV-086": () => ADVANTAGE.visaoNoturna,
  "ADV-104": () => ADVANTAGE.resistenciaNaturalAFogo,
  "ADV-120": () => ADVANTAGE.naoComeOuBebe,
  "ADV-121": () => ADVANTAGE.naoDorme,
  "ADV-124": () => ADVANTAGE.suportePressorico3,
  "ADV-125": () => ADVANTAGE.indomavel,
  "ADV-126": () => ADVANTAGE.inabalavel,
  "ADV-128": () => ADVANTAGE.toleranciaAFerimentosHomogeneo,
  "ADV-129": () => ADVANTAGE.toleranciaAFerimentosSemSangue,
  "ADV-136": () => ADVANTAGE.naoRespira,
  "AMMO-022": () => AMMO.bolaDeFerro,
  "ARMOR-000": () => ARMOR.capuz,
  "ARMOR-015": () => ARMOR.gibao,
  "ARMOR-020": () => ARMOR.cotaDeMalha,
  "ARMOR-035": () => ARMOR.bracadeiras,
  "ARMOR-050": () => ARMOR.manoplasDeMalha,
  "ARMOR-065": () => ARMOR.grevasDeMalha,
  "ARMOR-080": () => ARMOR.botasReforcadas,
  "CONTAINER-014": () => CONTAINER.estojoDeCintura,
  "DIS-000": () => DISADVANTAGE.aparenciaDesagradavel,
  "DIS-001": () => DISADVANTAGE.feio,
  "DIS-002": () => DISADVANTAGE.hediondo,
  "DIS-023": () => DISADVANTAGE.epilepsia,
  "DIS-053": () => DISADVANTAGE.furia,
  "DIS-058": () => DISADVANTAGE.compulsaoPesada,
  "DIS-120": () => DISADVANTAGE.vunerabilidadeNaturalAFogo,
  "DIS-141": () => DISADVANTAGE.fragilNaoNatural,
  "DIS-142": () => DISADVANTAGE.reprogramavel,
  "DIS-143": () => DISADVANTAGE.monstruoso,
  "DIS-145": () => DISADVANTAGE.semRecuperacaoTotal,
  "ENCHANTMENT-000": () => ENCHANTMENT.fortifyST,
  "ENCHANTMENT-001": () => ENCHANTMENT.weakenST,
  "ENCHANTMENT-004": () => ENCHANTMENT.fortifyIQ,
  "ENCHANTMENT-006": () => ENCHANTMENT.fortifyHT,
  "ENCHANTMENT-012": () => ENCHANTMENT.fortifyMana,
  "ENCHANTMENT-030": () => ENCHANTMENT.addAdvantage,
  "ENCHANTMENT-038": () => ENCHANTMENT.addWeight,
  "ENCHANTMENT-040": () => ENCHANTMENT.fortifyDamageResistance,
  "ENCHANTMENT-042": () => ENCHANTMENT.fortifyFireResistance,
  "ENCHANTMENT-058": () => ENCHANTMENT.fortifyBAL,
  "FIREARM-005": () => FIREARM.pistolaFlintlock,
  "GEAR-008": () => GEAR.basicoPessoal,
  "MAGIC_GEAR-001": () => MAGIC_GEAR.varinha,
  "MAGIC_GEAR-003": () => MAGIC_GEAR.cajado,
  "MAT-000": () => MATERIAL.ferro,
  "MAT-003": () => MATERIAL.aco,
  "MELEE-000": () => MELEE.foiceCurta,
  "MELEE-275": () => MELEE.machadoMilitar,
  "MELEE-280": () => MELEE.machadinha,
  "META-000": () => META_RACE.zumbi,
  "META-001": () => META_RACE.esqueleto,
  "POTION-005": () => POTION.pocaoDeVida,
  "RACE-003": () => RACE.dracontoVermelho,
  "RACE-045": () => RACE.elementalDeTerra,
  "RANGED-001": () => RANGED.facaDeArremessoBoa,
  "RANGED-005": () => RANGED.machadinha,
  "RANGED-015": () => RANGED.arcoCurto,
  "SHIELD-005": () => SHIELD.escudo,
  "SHIELD-010": () => SHIELD.escudoTorre,
  "SKILL-000": () => SKILL.adestramentoDeAnimais,
  "SKILL-001": () => SKILL.falcoaria,
  "SKILL-037": () => SKILL.machadoMaca,
  "SKILL-038": () => SKILL.arremessoDeMachado,
  "SKILL-042": () => SKILL.arco,
  "SKILL-044": () => SKILL.espadasLongas,
  "SKILL-049": () => SKILL.sacarRapidoMachadosMaca,
  "SKILL-076": () => SKILL.faca,
  "SKILL-082": () => SKILL.escudo,
  "SKILL-083": () => SKILL.espadasCurtas,
  "SKILL-095": () => SKILL.bastao,
  "SKILL-255": () => SKILL.arremessarFeitico,
});

// Rewrites every legacy id found as a whole JSON string in `value` (returns a copy).
function remapLegacyIds(value) {
  const json = JSON.stringify(value);
  const remapped = json.replace(/"([A-Z][A-Z_-]*-\d{3,4})"/g, (match, id) =>
    LEGACY_IDS[id] ? JSON.stringify(LEGACY_IDS[id]) : match,
  );
  return JSON.parse(remapped);
}

module.exports = {
  ID_COLUMN,
  ACCESSORY,
  ADVANTAGE,
  AMMO,
  ARMOR,
  CONTAINER,
  DISADVANTAGE,
  ENCHANTMENT,
  FIREARM,
  GEAR,
  MAGIC_GEAR,
  MATERIAL,
  MELEE,
  META_RACE,
  POTION,
  RACE,
  RANGED,
  SHIELD,
  SKILL,
  LEGACY_IDS,
  remapLegacyIds,
};
