// The only test-side file that knows how datasets identify their rows. Tests ask for a row by its stable
// key (the `<prefix>_key` column) and get whatever id it has now, so renumbering a dataset or correcting a
// name never touches a test. A key that matches zero or several rows throws: edit the key here, or in the
// CSV, when a row is deleted or re-keyed. Ids that production code owns (helpers/ids.js) come from there.
const { loadDataset } = require("helpers/datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("helpers/datasetColumns.js");
const { REFLEXOS_EM_COMBATE_ID, ESCUDO_SKILL_ID } = require("helpers/ids.js");

function idOfKey(dataset, key) {
  const rows = loadDataset(dataset).filter(
    (row) => row[KEY_COLUMN[dataset]] === key,
  );
  if (rows.length !== 1) {
    throw new Error(
      `[dataRefs] ${dataset} key "${key}" matched ${rows.length} rows — update tests/helpers/dataRefs.js`,
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
  anel: () => idOfKey("ACCESSORIES", "anel"),
  colar: () => idOfKey("ACCESSORIES", "colar"),
  coroa: () => idOfKey("ACCESSORIES", "coroa"),
});

const ADVANTAGE = lazy({
  atraente: () => idOfKey("ADVANTAGES", "atraente"),
  eleganteBonito: () => idOfKey("ADVANTAGES", "elegante-bonito"),
  hipoalgia: () => idOfKey("ADVANTAGES", "hipoalgia"),
  inabalavel: () => idOfKey("ADVANTAGES", "inabalavel"),
  indomavel: () => idOfKey("ADVANTAGES", "indomavel"),
  memoriaEideticaTotal: () => idOfKey("ADVANTAGES", "memoria-eidetica-total"),
  muitoBonito: () => idOfKey("ADVANTAGES", "muito-bonito"),
  naoComeOuBebe: () => idOfKey("ADVANTAGES", "nao-come-ou-bebe"),
  naoDorme: () => idOfKey("ADVANTAGES", "nao-dorme"),
  naoRespira: () => idOfKey("ADVANTAGES", "nao-respira"),
  prontidao1: () => idOfKey("ADVANTAGES", "prontidao-1"),
  reflexosEmCombate: REFLEXOS_EM_COMBATE_ID,
  resistenciaNaturalAFogo: () =>
    idOfKey("ADVANTAGES", "resistencia-natural-a-fogo"),
  suportePressorico3: () => idOfKey("ADVANTAGES", "suporte-pressorico-3"),
  toleranciaAFerimentosHomogeneo: () =>
    idOfKey("ADVANTAGES", "tolerancia-a-ferimentos-homogeneo"),
  toleranciaAFerimentosSemSangue: () =>
    idOfKey("ADVANTAGES", "tolerancia-a-ferimentos-sem-sangue"),
  visaoNoturna: () => idOfKey("ADVANTAGES", "visao-noturna"),
});

const AMMO = lazy({
  bolaDeFerro: () => idOfKey("AMMO", "bola-de-ferro"),
});

const ARMOR = lazy({
  botasReforcadas: () => idOfKey("ARMORS", "botas-reforcadas-comum"),
  bracadeiras: () => idOfKey("ARMORS", "bracadeiras-comum"),
  capuz: () => idOfKey("ARMORS", "capuz-comum"),
  cotaDeMalha: () => idOfKey("ARMORS", "cota-de-malha-comum"),
  gibao: () => idOfKey("ARMORS", "gibao-comum"),
  grevasDeMalha: () => idOfKey("ARMORS", "grevas-de-malha-comum"),
  manoplasDeMalha: () => idOfKey("ARMORS", "manoplas-de-malha-comum"),
});

const CONTAINER = lazy({
  estojoDeCintura: () => idOfKey("AMMO_CONTAINERS", "estojo-de-cintura-18"),
});

const DISADVANTAGE = lazy({
  aparenciaDesagradavel: () =>
    idOfKey("DISADVANTAGES", "aparencia-desagradavel"),
  compulsaoPesada: () => idOfKey("DISADVANTAGES", "compulsao-pesada"),
  epilepsia: () => idOfKey("DISADVANTAGES", "epilepsia"),
  feio: () => idOfKey("DISADVANTAGES", "feio"),
  fragilNaoNatural: () => idOfKey("DISADVANTAGES", "fragil-nao-natural"),
  furia: () => idOfKey("DISADVANTAGES", "furia"),
  hediondo: () => idOfKey("DISADVANTAGES", "hediondo"),
  monstruoso: () => idOfKey("DISADVANTAGES", "monstruoso"),
  reprogramavel: () => idOfKey("DISADVANTAGES", "reprogramavel"),
  semRecuperacaoTotal: () => idOfKey("DISADVANTAGES", "sem-recuperacao-total"),
  vunerabilidadeNaturalAFogo: () =>
    idOfKey("DISADVANTAGES", "vunerabilidade-natural-a-fogo"),
});

const ENCHANTMENT = lazy({
  addAdvantage: () => idOfKey("ENCHANTMENTS", "adicionar-vantagem"),
  addWeight: () => idOfKey("ENCHANTMENTS", "aumentar-peso"),
  fortifyBAL: () => idOfKey("ENCHANTMENTS", "fortificar-bal"),
  fortifyDamageResistance: () =>
    idOfKey("ENCHANTMENTS", "aumentar-resistencia-a-dano"),
  fortifyFireResistance: () =>
    idOfKey("ENCHANTMENTS", "fortificar-resistencia-a-fogo"),
  fortifyHT: () => idOfKey("ENCHANTMENTS", "fortificar-ht"),
  fortifyIQ: () => idOfKey("ENCHANTMENTS", "fortificar-iq"),
  fortifyMana: () => idOfKey("ENCHANTMENTS", "fortificar-mana"),
  fortifyST: () => idOfKey("ENCHANTMENTS", "fortificar-st"),
  weakenST: () => idOfKey("ENCHANTMENTS", "enfraquecer-st"),
});

const FIREARM = lazy({
  pistolaFlintlock: () => idOfKey("FIREARMS", "pistola-flintlock-comum"),
});

const GEAR = lazy({
  basicoPessoal: () => idOfKey("ADVENTURE_GEAR", "basico-pessoal"),
});

const MAGIC_GEAR = lazy({
  alaude: () => idOfKey("MAGIC_GEAR", "alaude"),
  bastao: () => idOfKey("MAGIC_GEAR", "bastao"),
  cajado: () => idOfKey("MAGIC_GEAR", "cajado"),
  grimorio: () => idOfKey("MAGIC_GEAR", "grimorio"),
  varinha: () => idOfKey("MAGIC_GEAR", "varinha"),
});

const MATERIAL = lazy({
  aco: () => idOfKey("CRAFTING_MATERIALS", "aco-incomum"),
  ferro: () => idOfKey("CRAFTING_MATERIALS", "ferro-comum"),
});

const MELEE = lazy({
  foiceCurta: () => idOfKey("MELEE_WEAPONS", "foice-curta-comum"),
  machadinha: () => idOfKey("MELEE_WEAPONS", "machadinha-comum"),
  machadoMilitar: () => idOfKey("MELEE_WEAPONS", "machado-militar-comum"),
});

const META_RACE = lazy({
  esqueleto: () => idOfKey("META_RACES", "morto-vivo-esqueleto"),
  zumbi: () => idOfKey("META_RACES", "morto-vivo-zumbi"),
});

const POTION = lazy({
  pocaoDeVida: () => idOfKey("ALCHEMY", "pocao-de-vida-comum"),
});

const RACE = lazy({
  dracontoVermelho: () => idOfKey("RACES", "draconato-draconto-vermelho"),
  elementalDeTerra: () => idOfKey("RACES", "elemental-de-terra"),
});

const RANGED = lazy({
  arcoCurto: () => idOfKey("RANGED_WEAPONS", "arco-curto-comum"),
  facaDeArremessoBoa: () => idOfKey("RANGED_WEAPONS", "faca-de-arremesso-boa"),
  machadinha: () => idOfKey("RANGED_WEAPONS", "machadinha-comum"),
});

const SHIELD = lazy({
  escudo: () => idOfKey("SHIELDS", "escudo-comum"),
  escudoTorre: () => idOfKey("SHIELDS", "escudo-torre-comum"),
});

const SKILL = lazy({
  adestramentoDeAnimais: () => idOfKey("SKILLS", "adestramento-de-animais"),
  corrida: () => idOfKey("SKILLS", "corrida"),
  arco: () => idOfKey("SKILLS", "arco"),
  arremessarFeitico: () => idOfKey("SKILLS", "arremessar-feitico"),
  arremessoDeMachado: () => idOfKey("SKILLS", "arremesso-de-machado"),
  bastao: () => idOfKey("SKILLS", "bastao"),
  escudo: ESCUDO_SKILL_ID,
  espadasCurtas: () => idOfKey("SKILLS", "espadas-curtas"),
  espadasLongas: () => idOfKey("SKILLS", "espadas-longas"),
  faca: () => idOfKey("SKILLS", "faca"),
  falcoaria: () => idOfKey("SKILLS", "falcoaria"),
  machadoMaca: () => idOfKey("SKILLS", "machado-maca"),
  sacarRapidoMachadosMaca: () =>
    idOfKey("SKILLS", "sacar-rapido-machados-maca"),
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
  KEY_COLUMN,
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
