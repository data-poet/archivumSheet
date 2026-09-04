import {
  numStepper,
  formatRichText,
  detailRow,
  emptyRow,
  escapeHtml,
  escapeAttr,
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  isCustomFieldsEditorOpen,
  readCustomFieldsEditorValues,
  customFieldsEquippedDetail,
  customFieldsDetailRow,
  equippedDetailBlock,
  readCustomItemEditorValues,
  customItemEditRow,
} from "dev/public/js/shared/renderUtils.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function parseInto(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

// jsdom silently drops <tr>/<td> inserted via innerHTML outside a real <table>.
function parseRowInto(html) {
  const table = document.createElement("table");
  table.innerHTML = `<tbody>${html}</tbody>`;
  return table;
}

beforeEach(() => {
  resetDOM("<div></div>");
  // The editor-open tracking Set is module-level, shared across tests and equipment types.
  closeCustomFieldsEditor("ITEM-1");
  closeCustomFieldsEditor("ITEM-2");
});

describe("numStepper", () => {
  test("renders an input carrying the given class, data attributes, and value", () => {
    const html = numStepper(
      "my-qty-class",
      'data-instance-id="ITEM-1"',
      5,
      'data-step="1"',
    );
    const dom = parseInto(html);

    const input = dom.querySelector("input.my-qty-class");
    expect(input).not.toBeNull();
    expect(input.value).toBe("5");
    expect(input.dataset.instanceId).toBe("ITEM-1");
    expect(input.dataset.step).toBe("1");
    expect(input.type).toBe("text");
  });

  test("always renders both an increment and a decrement button", () => {
    const html = numStepper("qty", "", 1);
    const dom = parseInto(html);

    expect(dom.querySelector(".stepper-inc")).not.toBeNull();
    expect(dom.querySelector(".stepper-dec")).not.toBeNull();
  });
});

describe("formatRichText", () => {
  test.each([null, undefined, "", "   "])(
    "returns the em-dash placeholder for %p",
    (input) => {
      expect(formatRichText(input)).toBe("—");
    },
  );

  test("plain text with no bullet lines is wrapped in a single note paragraph", () => {
    const html = formatRichText("Uma descrição qualquer.");
    const dom = parseInto(html);

    const p = dom.querySelector("p.scaling-note");
    expect(p.textContent).toBe("Uma descrição qualquer.");
    expect(dom.querySelector("ul")).toBeNull();
  });

  test("bullet lines become a flat <ul> when there's no indentation", () => {
    const html = formatRichText("- Primeiro item\n- Segundo item");
    const dom = parseInto(html);

    const items = dom.querySelectorAll("ul.scaling-list > li");
    expect(items.length).toBe(2);
    expect(items[0].childNodes[0].textContent).toBe("Primeiro item");
    expect(items[1].childNodes[0].textContent).toBe("Segundo item");
    expect(items[0].querySelector("ul")).toBeNull();
  });

  test("indented bullet lines nest under their parent", () => {
    const html = formatRichText(
      "- Nível 1\n  - Nível 2\n    - Nível 3\n- Outro nível 1",
    );
    const dom = parseInto(html);

    const topLevelItems = dom.querySelectorAll(":scope > ul.scaling-list > li");
    expect(topLevelItems.length).toBe(2);

    const nested2 = topLevelItems[0].querySelector(
      ":scope > ul.scaling-list > li",
    );
    expect(nested2).not.toBeNull();
    const nested3 = nested2.querySelector(":scope > ul.scaling-list > li");
    expect(nested3).not.toBeNull();
    expect(nested3.textContent).toBe("Nível 3");
  });

  test("tabs are normalized to a consistent indent step alongside spaces", () => {
    // A tab and 4 spaces must land at the same depth per the module's tab-to-4-spaces rule.
    const html = formatRichText("- Topo\n\t- Filho A\n    - Filho B");
    const dom = parseInto(html);

    const topItem = dom.querySelector(":scope > ul.scaling-list > li");
    const children = topItem.querySelectorAll(":scope > ul.scaling-list > li");
    expect(children.length).toBe(2);
  });

  test("non-bullet lines mixed with bullet lines become a trailing note paragraph after the list", () => {
    const html = formatRichText(
      "- Item um\n- Item dois\nUma observação final.",
    );
    const dom = parseInto(html);

    expect(dom.querySelector("ul")).not.toBeNull();
    const note = dom.querySelector("p.scaling-note");
    expect(note).not.toBeNull();
    expect(note.textContent).toBe("Uma observação final.");
    expect(dom.children[0].tagName).toBe("UL");
    expect(dom.children[1].tagName).toBe("P");
  });

  test("blank lines in the source are dropped entirely, not rendered as empty items", () => {
    const html = formatRichText("- Item um\n\n\n- Item dois");
    const dom = parseInto(html);

    expect(dom.querySelectorAll("li").length).toBe(2);
  });
});

describe("detailRow", () => {
  test("renders a <tr class='detail-row'> with the given colspan", () => {
    const html = detailRow(4, [{ label: "Peso", value: "2 kg" }]);
    const dom = parseRowInto(html);

    const row = dom.querySelector("tr.detail-row");
    expect(row).not.toBeNull();
    expect(row.querySelector("td").getAttribute("colspan")).toBe("4");
  });

  test("a non-rich field renders as a span with label and value", () => {
    const html = detailRow(4, [{ label: "Peso", value: "2 kg" }]);
    const dom = parseRowInto(html);

    const span = dom.querySelector("span.item-detail");
    expect(span.textContent).toBe("Peso: 2 kg");
  });

  test("a rich field renders as a full-width block instead of a span", () => {
    const html = detailRow(4, [
      { label: "Descrição", value: "<b>Texto</b>", rich: true },
    ]);
    const dom = parseRowInto(html);

    expect(dom.querySelector("span.item-detail")).toBeNull();
    const block = dom.querySelector("div.item-detail-block");
    expect(block).not.toBeNull();
    expect(block.querySelector("b").textContent).toBe("Texto");
  });

  test("fields with an empty or '—' value are filtered out", () => {
    const html = detailRow(4, [
      { label: "Peso", value: "2 kg" },
      { label: "Vazio", value: "" },
      { label: "Traço", value: "—" },
      { label: "Nulo", value: null },
    ]);
    const dom = parseRowInto(html);

    expect(dom.querySelectorAll(".item-detail").length).toBe(1);
  });

  test("returns an empty string entirely when every field is filtered out", () => {
    expect(detailRow(4, [{ label: "Vazio", value: "" }])).toBe("");
  });

  test("wraps content in a closed <details> summarized by the shared 'details' label", () => {
    const html = detailRow(4, [{ label: "Peso", value: "2 kg" }]);
    const dom = parseRowInto(html);

    const details = dom.querySelector("details");
    expect(details.hasAttribute("open")).toBe(false);
    expect(details.querySelector("summary").textContent).toBe(
      t("common.details"),
    );
  });
});

describe("emptyRow", () => {
  test("renders a placeholder row spanning the given colspan", () => {
    const html = emptyRow(6);
    const dom = parseRowInto(html);

    const row = dom.querySelector("tr.empty-row");
    expect(row.querySelector("td").getAttribute("colspan")).toBe("6");
    expect(row.textContent).toBe("—");
  });
});

describe("escapeHtml", () => {
  test("escapes &, <, and > but leaves quotes untouched", () => {
    expect(escapeHtml(`<b>A & B > C "quoted"</b>`)).toBe(
      `&lt;b&gt;A &amp; B &gt; C "quoted"&lt;/b&gt;`,
    );
  });

  test("returns an empty string for null or undefined rather than the literal text", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  test("coerces non-string input (e.g. numbers) to text first", () => {
    expect(escapeHtml(42)).toBe("42");
  });
});

describe("escapeAttr", () => {
  test("escapes everything escapeHtml does, plus double quotes", () => {
    expect(escapeAttr(`say "hi" <b>`)).toBe(`say &quot;hi&quot; &lt;b&gt;`);
  });

  test("returns an empty string for null", () => {
    expect(escapeAttr(null)).toBe("");
  });
});

describe("custom-fields editor open/close tracking", () => {
  test("an id is closed by default", () => {
    expect(isCustomFieldsEditorOpen("ITEM-1")).toBe(false);
  });

  test("opening then checking reports open", () => {
    openCustomFieldsEditor("ITEM-1");
    expect(isCustomFieldsEditorOpen("ITEM-1")).toBe(true);
  });

  test("closing an open id reports closed again", () => {
    openCustomFieldsEditor("ITEM-1");
    closeCustomFieldsEditor("ITEM-1");
    expect(isCustomFieldsEditorOpen("ITEM-1")).toBe(false);
  });

  test("opening one id does not affect another id's open state", () => {
    openCustomFieldsEditor("ITEM-1");
    expect(isCustomFieldsEditorOpen("ITEM-2")).toBe(false);
  });

  test("closing an id that was never open is a safe no-op", () => {
    expect(() => closeCustomFieldsEditor("NEVER-OPENED")).not.toThrow();
    expect(isCustomFieldsEditorOpen("NEVER-OPENED")).toBe(false);
  });

  test("the tracking Set is shared across equipment types — the same id being open affects both customFieldsEquippedDetail AND customItemEditRow rendering for that id", () => {
    // The Set is keyed generically by id, not scoped per equipment type.
    openCustomFieldsEditor("SHARED-ID");

    const equippedHtml = customFieldsEquippedDetail({
      instanceId: "SHARED-ID",
      name: "",
      description: "",
      effect: "",
    });
    const rowHtml = customItemEditRow(4, {
      customItemId: "SHARED-ID",
      name: "X",
      weight: 1,
      price: 1,
      description: "",
    });

    expect(
      parseInto(equippedHtml).querySelector(".custom-fields-block--editing"),
    ).not.toBeNull();
    expect(
      parseRowInto(rowHtml).querySelector(".custom-item-edit-block--editing"),
    ).not.toBeNull();

    closeCustomFieldsEditor("SHARED-ID");
  });
});

describe("readCustomFieldsEditorValues", () => {
  test("reads name/description/effect out of the matching open editor block", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="ITEM-1">
        <input class="custom-fields-input-name" value="Nome" />
        <textarea class="custom-fields-input-description">Desc</textarea>
        <textarea class="custom-fields-input-effect">Efeito</textarea>
      </div>
    `);

    expect(readCustomFieldsEditorValues("ITEM-1")).toEqual({
      name: "Nome",
      description: "Desc",
      effect: "Efeito",
    });
  });

  test("returns null when no block matches the given instanceId", () => {
    resetDOM(`<div></div>`);

    expect(readCustomFieldsEditorValues("MISSING")).toBeNull();
  });

  test("defaults missing individual inputs to empty strings rather than throwing", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="ITEM-1"></div>
    `);

    expect(readCustomFieldsEditorValues("ITEM-1")).toEqual({
      name: "",
      description: "",
      effect: "",
    });
  });
});

describe("customFieldsEquippedDetail", () => {
  test("read-only mode shows an empty-state message when no custom fields are set", () => {
    const html = customFieldsEquippedDetail({
      instanceId: "ITEM-1",
      name: "",
      description: "",
      effect: "",
    });
    const dom = parseInto(html);

    expect(dom.querySelector(".custom-fields-empty")).not.toBeNull();
    expect(dom.querySelector(".custom-fields-input-name")).toBeNull();
  });

  test("read-only mode shows only the fields that are actually set", () => {
    const html = customFieldsEquippedDetail({
      instanceId: "ITEM-1",
      name: "Espada Nomeada",
      description: "",
      effect: "",
    });
    const dom = parseInto(html);

    expect(dom.querySelector(".custom-fields-empty")).toBeNull();
    expect(dom.textContent).toContain("Espada Nomeada");
  });

  test("editing mode (id open) renders the input/textarea form instead of read-only text", () => {
    openCustomFieldsEditor("ITEM-1");
    const html = customFieldsEquippedDetail({
      instanceId: "ITEM-1",
      name: "Nome Atual",
      description: "Desc Atual",
      effect: "",
    });
    const dom = parseInto(html);

    expect(dom.querySelector(".custom-fields-input-name").value).toBe(
      "Nome Atual",
    );
    expect(
      dom.querySelector(".custom-fields-save-btn").dataset.instanceId,
    ).toBe("ITEM-1");
  });

  test("HTML-unsafe custom field values are escaped, not injected raw", () => {
    const html = customFieldsEquippedDetail({
      instanceId: "ITEM-1",
      name: `<img src=x onerror=alert(1)>`,
      description: "",
      effect: "",
    });

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  test("appends extraContent inside the details expander, after the custom-fields body", () => {
    const html = customFieldsEquippedDetail(
      { instanceId: "ITEM-1", name: "", description: "", effect: "" },
      `<div class="enchantments-marker"></div>`,
    );
    const dom = parseInto(html);

    expect(dom.querySelector("details .enchantments-marker")).not.toBeNull();
  });

  test("uses a div-based .equipped-detail wrapper with data-detail-kind='customize'", () => {
    const html = customFieldsEquippedDetail({
      instanceId: "ITEM-1",
      name: "",
      description: "",
      effect: "",
    });
    const dom = parseInto(html);

    const wrapper = dom.querySelector(".equipped-detail > details");
    expect(wrapper.dataset.detailKind).toBe("customize");
  });
});

describe("customFieldsDetailRow", () => {
  test("uses a tr/td-based wrapper (mirrors detailRow) instead of a div", () => {
    const html = customFieldsDetailRow(5, {
      instanceId: "ITEM-1",
      name: "",
      description: "",
      effect: "",
    });
    const dom = parseRowInto(html);

    const row = dom.querySelector("tr.detail-row");
    expect(row).not.toBeNull();
    expect(row.querySelector("td").getAttribute("colspan")).toBe("5");
    expect(row.querySelector("details").dataset.detailKind).toBe("customize");
  });
});

describe("equippedDetailBlock", () => {
  test("renders a div-based .equipped-detail wrapper with data-detail-kind='stats'", () => {
    const html = equippedDetailBlock([{ label: "Peso", value: "2 kg" }]);
    const dom = parseInto(html);

    const details = dom.querySelector(".equipped-detail > details");
    expect(details.dataset.detailKind).toBe("stats");
    expect(details.querySelector(".item-detail").textContent).toBe(
      "Peso: 2 kg",
    );
  });

  test("returns an empty string when every field is filtered out, same as detailRow", () => {
    expect(equippedDetailBlock([{ label: "Vazio", value: "" }])).toBe("");
  });
});

describe("readCustomItemEditorValues", () => {
  test("reads name/weight/price/description as their parsed types", () => {
    resetDOM(`
      <div class="custom-item-edit-block" data-custom-item-id="CUSTOM-1">
        <input class="custom-item-input-name" value="Item" />
        <input class="custom-item-input-weight" value="1.5" />
        <input class="custom-item-input-price" value="20" />
        <textarea class="custom-item-input-description">Nota</textarea>
      </div>
    `);

    expect(readCustomItemEditorValues("CUSTOM-1")).toEqual({
      name: "Item",
      weight: 1.5,
      price: 20,
      description: "Nota",
    });
  });

  test("returns null when no block matches the given customItemId", () => {
    resetDOM(`<div></div>`);

    expect(readCustomItemEditorValues("MISSING")).toBeNull();
  });

  test("missing weight/price inputs parse to NaN rather than throwing", () => {
    resetDOM(`
      <div class="custom-item-edit-block" data-custom-item-id="CUSTOM-1">
        <input class="custom-item-input-name" value="Item" />
      </div>
    `);

    const values = readCustomItemEditorValues("CUSTOM-1");
    expect(Number.isNaN(values.weight)).toBe(true);
    expect(Number.isNaN(values.price)).toBe(true);
  });
});

describe("customItemEditRow", () => {
  const baseParams = {
    customItemId: "CUSTOM-1",
    name: "Amuleto",
    weight: 0.5,
    price: 10,
    description: "",
  };

  test("read-only mode shows price/weight and an edit button", () => {
    const html = customItemEditRow(4, baseParams);
    const dom = parseRowInto(html);

    expect(dom.querySelector(".custom-item-edit-block--editing")).toBeNull();
    expect(dom.textContent).toContain("10");
    expect(dom.textContent).toContain("0.5");
    expect(
      dom.querySelector(".custom-item-edit-btn").dataset.customItemId,
    ).toBe("CUSTOM-1");
  });

  test("read-only mode only shows the description block when a description is present", () => {
    const withDesc = parseRowInto(
      customItemEditRow(4, { ...baseParams, description: "Nota" }),
    );
    const withoutDesc = parseRowInto(customItemEditRow(4, baseParams));

    expect(withDesc.textContent).toContain("Nota");
    expect(withoutDesc.querySelector(".item-detail-block")).toBeNull();
  });

  test("editing mode (id open) renders name/weight/price/description inputs", () => {
    openCustomFieldsEditor("CUSTOM-1");
    const html = customItemEditRow(4, baseParams);
    const dom = parseRowInto(html);

    expect(dom.querySelector(".custom-item-input-name").value).toBe("Amuleto");
    expect(dom.querySelector(".custom-item-input-weight").value).toBe("0.5");
    expect(dom.querySelector(".custom-item-input-price").value).toBe("10");
    closeCustomFieldsEditor("CUSTOM-1");
  });

  test("editing mode's <details> is rendered open, unlike detailRow/equippedDetailBlock which default closed", () => {
    openCustomFieldsEditor("CUSTOM-1");
    const dom = parseRowInto(customItemEditRow(4, baseParams));

    expect(dom.querySelector("details").hasAttribute("open")).toBe(true);
    closeCustomFieldsEditor("CUSTOM-1");
  });

  test("read-only mode's <details> defaults closed", () => {
    const dom = parseRowInto(customItemEditRow(4, baseParams));

    expect(dom.querySelector("details").hasAttribute("open")).toBe(false);
  });

  test("HTML-unsafe name/description values are escaped in both read-only and editing modes", () => {
    const unsafe = { ...baseParams, description: `<script>x</script>` };

    const readOnly = customItemEditRow(4, unsafe);
    expect(readOnly).not.toContain("<script>x</script>");

    openCustomFieldsEditor("CUSTOM-1");
    const editing = customItemEditRow(4, unsafe);
    expect(editing).not.toContain("<script>x</script>");
    closeCustomFieldsEditor("CUSTOM-1");
  });
});
