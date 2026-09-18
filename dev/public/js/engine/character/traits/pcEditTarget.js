// Where the active character's attribute edits land. See shared/editTarget.js for why
// this is a registered destination rather than a page check.

import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";

export const PC_EDIT_TARGET = {
  // The PC's primary modifiers are stored in the edit view's #<attr>_mod inputs, which
  // compute/attributes.js reads at build time — so writing state here means writing that
  // input and letting its own listener rebuild. A sheet without those inputs (an ally)
  // needs a different target, which is the whole reason this indirection exists.
  setPrimaryModifier(attr, value) {
    const input = document.getElementById(`${attr}_mod`);
    if (!input) return;

    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  },

  ensureSecondary(name) {
    const { secondary } = state.selected;
    if (!secondary[name]) secondary[name] = { bought: 0, modifier: 0 };
  },

  setSecondary(name, field, value) {
    this.ensureSecondary(name);
    state.selected.secondary[name][field] = value;
    triggerAutoRun();
  },
};
