// Desktop pairs two sections per row (resume.css); when one half has nothing to show (its
// content container renders itself `hidden` — no firearms equipped, no advantages, ...) this
// drops that half out of the grid and lets its row-mate take the full row instead of sitting
// at half width next to a blank cell. Independent of groupNav's own `hidden` (tab membership),
// so the two never fight over the same attribute.
const ROW_PAIRS = [
  ["resume-section-melee", "resume-section-supplies"],
  ["resume-section-ranged", "resume-section-firearms"],
  ["resume-section-armor", "resume-section-shield"],
  ["resume-section-magic", "resume-section-skills"],
  ["resume-section-advantages", "resume-section-disadvantages"],
];

function isEmpty(section) {
  return section.querySelector(".resume-full-col")?.hidden ?? false;
}

export function balanceResumeRows(root = document) {
  ROW_PAIRS.forEach(([aId, bId]) => {
    const a = root.querySelector(`#${aId}`);
    const b = root.querySelector(`#${bId}`);
    if (!a || !b) return;

    const emptyA = isEmpty(a);
    const emptyB = isEmpty(b);

    a.classList.toggle("resume-section-empty", emptyA);
    b.classList.toggle("resume-section-empty", emptyB);
    a.classList.toggle("resume-span-full", !emptyA && emptyB);
    b.classList.toggle("resume-span-full", !emptyB && emptyA);
  });
}
