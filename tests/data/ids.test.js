const { loadDataset, DATASETS } = require("helpers/datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("helpers/datasetColumns.js");
const {
  resolveRuleKeys,
  TIER_GROUPS,
  LENIENT_TRAIT_KEYS,
} = require("helpers/ruleKeys.js");
const ids = require("helpers/ids.js");
const { runChecks } = require("scripts/checkData.js");
const { CONDITION_RULES } = require("helpers/rules.js");
const { withEditedData } = require("tests/helpers/tempData");

// helpers/ids.js looks its ids up by stable key, so a renumbered dataset changes nothing there. These
// tests pin which key each rule is attached to and that every one of them still exists in the data.
const keysById = {};
function keyOf(dataset, id) {
  keysById[dataset] ??= new Map(
    loadDataset(dataset).map((r) => [
      r[ID_COLUMN[dataset]],
      r[KEY_COLUMN[dataset]],
    ]),
  );
  return keysById[dataset].get(id);
}

describe("every key the code depends on exists", () => {
  test("nothing is unresolved or unregistered", () => {
    expect(ids.UNRESOLVED_RULE_KEYS).toEqual([]);
  });
});

describe("tier groups", () => {
  test.each(Object.entries(TIER_GROUPS))(
    "%s registers tiers 1 to N of its key prefix",
    (name, { dataset, prefix, tiers }) => {
      const registered = ids[name];
      expect(Object.keys(registered)).toHaveLength(tiers);
      Object.entries(registered).forEach(([id, tier]) => {
        expect(keyOf(dataset, id)).toBe(`${prefix}-${tier}`);
      });
    },
  );

  test("the groups keep their expected sizes", () => {
    expect(
      Object.fromEntries(
        Object.entries(TIER_GROUPS).map(([name, group]) => [name, group.tiers]),
      ),
    ).toEqual({
      WILL_BONUS_TIERS: 5,
      WILL_PENALTY_TIERS: 5,
      HEARING_BONUS_TIERS: 5,
      SMELL_BONUS_TIERS: 5,
      VISION_BONUS_TIERS: 5,
      FULL_SENSE_BONUS_TIERS: 5,
      MAGIC_APTITUDE_TIERS: 3,
    });
  });
});

describe("single ids", () => {
  test.each([
    ["REFLEXOS_EM_COMBATE_ID", "ADVANTAGES", "reflexos-em-combate"],
    ["BROQUEL_SKILL_ID", "SKILLS", "broquel"],
    ["ESCUDO_SKILL_ID", "SKILLS", "escudo"],
    ["MAGIC_RETURN_ENCHANTMENT_ID", "ENCHANTMENTS", "retorno-magico"],
  ])("%s is the row keyed %s", (name, dataset, expectedKey) => {
    expect(keyOf(dataset, ids[name])).toBe(expectedKey);
  });

  test("the magic-return enchantment is still a special effect", () => {
    const row = loadDataset("ENCHANTMENTS").find(
      (r) => r.enchantment_id === ids.MAGIC_RETURN_ENCHANTMENT_ID,
    );
    expect(row.enchantment_effect_type).toBe("special_effect");
  });
});

describe("BROQUEL_SHIELD_IDS", () => {
  test("is exactly the shields whose key is a broquel", () => {
    const broquels = loadDataset("SHIELDS")
      .filter((row) => row.shield_key.startsWith("broquel-"))
      .map((row) => row.shield_id);
    expect(broquels.length).toBeGreaterThan(0);
    expect([...ids.BROQUEL_SHIELD_IDS].sort()).toEqual(broquels.sort());
  });
});

describe("DUAL_USE_WEAPON_PAIRS", () => {
  test("every pair is the same weapon key in both tables", () => {
    expect(ids.DUAL_USE_WEAPON_PAIRS.length).toBeGreaterThan(0);
    ids.DUAL_USE_WEAPON_PAIRS.forEach(([meleeId, rangedId]) => {
      expect(keyOf("MELEE_WEAPONS", meleeId)).toBe(
        keyOf("RANGED_WEAPONS", rangedId),
      );
    });
  });

  test("covers every weapon key present in both tables", () => {
    const rangedKeys = new Set(
      loadDataset("RANGED_WEAPONS").map((row) => row.weapon_key),
    );
    const shared = loadDataset("MELEE_WEAPONS")
      .filter((row) => rangedKeys.has(row.weapon_key))
      .map((row) => row.weapon_id);
    expect(ids.DUAL_USE_WEAPON_PAIRS.map(([meleeId]) => meleeId)).toEqual(
      shared,
    );
  });
});

describe.each(Object.keys(LENIENT_TRAIT_KEYS))(
  "lenient trait keys: %s",
  (group) => {
    const entries = LENIENT_TRAIT_KEYS[group];
    const idsOfGroup = ids.LENIENT_TRAIT_IDS[group];
    // The trait tables are being rebuilt: the edit-based tests need one registered row that exists, and skip otherwise.
    const live = entries.find(([, key]) => key in idsOfGroup);
    const whenLive = live ? test : test.skip;

    test("every registered key is either resolved or pending", () => {
      const accounted = [
        ...Object.keys(idsOfGroup),
        ...ids.PENDING_LENIENT_KEYS[group],
      ].sort();
      expect(accounted).toEqual(entries.map(([, key]) => key).sort());
    });

    test("a resolved id belongs to the row with that key", () => {
      const datasetOf = Object.fromEntries(
        entries.map(([dataset, key]) => [key, dataset]),
      );
      Object.entries(idsOfGroup).forEach(([key, id]) => {
        expect(keyOf(datasetOf[key], id)).toBe(key);
      });
    });

    whenLive("a key with no row is pending, not missing", () => {
      const [dataset, key] = live;
      const { lenient, missing } = withEditedData(
        DATASETS[dataset],
        (rows) => {
          rows.find((r) => r[KEY_COLUMN[dataset]] === key)[
            KEY_COLUMN[dataset]
          ] = `${key}-antigo`;
          return rows;
        },
        () => resolveRuleKeys(),
      );
      expect(lenient[group].pending).toContain(key);
      expect(missing.map((m) => m.key)).not.toContain(key);
    });

    whenLive(
      "a row added later with that key is picked up with no code change",
      () => {
        const [dataset, key] = live;
        const resolvedLater = withEditedData(
          DATASETS[dataset],
          (rows) => {
            const row = rows.find((r) => r[KEY_COLUMN[dataset]] === key);
            const original = { ...row };
            row[KEY_COLUMN[dataset]] = `${key}-antigo`;
            return [
              ...rows,
              { ...original, [ID_COLUMN[dataset]]: "TESTE-999" },
            ];
          },
          () => resolveRuleKeys().lenient[group],
        );
        expect(resolvedLater.ids[key]).toBe("TESTE-999");
        expect(resolvedLater.pending).not.toContain(key);
      },
    );
  },
);

describe("lenient trait groups", () => {
  test("a new group is one registry entry, resolved and reported with no other change", () => {
    const [{ advantage_key: existing }] = loadDataset("ADVANTAGES");
    LENIENT_TRAIT_KEYS.demo = [
      ["ADVANTAGES", existing],
      ["ADVANTAGES", "ainda-nao-existe"],
    ];
    try {
      const { lenient } = resolveRuleKeys();
      expect(Object.keys(lenient.demo.ids)).toEqual([existing]);
      expect(lenient.demo.pending).toEqual(["ainda-nao-existe"]);

      expect(runChecks().info).toContainEqual(
        expect.objectContaining({
          check: "demo-pending",
          dataset: "ADVANTAGES",
          id: "ainda-nao-existe",
        }),
      );
    } finally {
      delete LENIENT_TRAIT_KEYS.demo;
    }
  });

  test("a camelCase group is reported with a hyphenated check name", () => {
    LENIENT_TRAIT_KEYS.someGroup = [["ADVANTAGES", "ainda-nao-existe"]];
    try {
      expect(runChecks().info).toContainEqual(
        expect.objectContaining({
          check: "some-group-pending",
          message: expect.stringContaining("some group trait"),
        }),
      );
    } finally {
      delete LENIENT_TRAIT_KEYS.someGroup;
    }
  });

  test("the pain factor table and the pain-threshold registry name the same traits", () => {
    expect(Object.keys(CONDITION_RULES.painScale).sort()).toEqual(
      LENIENT_TRAIT_KEYS.painThreshold.map(([, key]) => key).sort(),
    );
  });
});

describe("resolveRuleKeys reacts to edits of the data", () => {
  test("a renamed key the code depends on is reported as missing", () => {
    const { missing } = withEditedData(
      "db_traits_advantages.csv",
      (rows) => {
        rows.find(
          (r) => r.advantage_key === "reflexos-em-combate",
        ).advantage_key = "reflexos";
        return rows;
      },
      () => resolveRuleKeys(),
    );
    expect(missing).toContainEqual({
      dataset: "ADVANTAGES",
      key: "reflexos-em-combate",
    });
  });

  test("a tier beyond the registered ones is reported as unregistered", () => {
    const { unregistered } = withEditedData(
      "db_traits_advantages.csv",
      (rows) => {
        const copy = { ...rows.find((r) => r.advantage_key === "prontidao-5") };
        copy.advantage_id = "ADV-999";
        copy.advantage_key = "prontidao-6";
        return [...rows, copy];
      },
      () => resolveRuleKeys(),
    );
    expect(unregistered).toContainEqual({
      dataset: "ADVANTAGES",
      key: "prontidao-6",
    });
  });

  test("a weapon whose key now exists in both tables becomes a dual-use pair", () => {
    const { dualUsePairs } = withEditedData(
      "db_equipment_ranged_weapons.csv",
      (rows) => {
        const copy = { ...rows[0] };
        copy.weapon_id = "RANGED-999";
        copy.weapon_key = "foice-curta-comum";
        return [...rows, copy];
      },
      () => resolveRuleKeys(),
    );
    expect(dualUsePairs).toHaveLength(ids.DUAL_USE_WEAPON_PAIRS.length + 1);
  });

  test("renumbering every id changes no key the code resolves", () => {
    const shifted = withEditedData(
      "db_traits_advantages.csv",
      (rows) =>
        rows.map((row) => ({
          ...row,
          advantage_id: `ADV-${String(Number(row.advantage_id.slice(4)) + 500).padStart(3, "0")}`,
        })),
      () => resolveRuleKeys().tierGroups.WILL_BONUS_TIERS,
    );
    expect(Object.keys(shifted).every((id) => Number(id.slice(4)) >= 500)).toBe(
      true,
    );
    expect(Object.values(shifted).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
