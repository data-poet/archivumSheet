// The panel part comes from production (components/resume/skeleton.js) so this fixture
// can't drift from it. Only ids that genuinely live OUTSIDE the panel are declared here:
// #weight sits in the inventory section and the points table in section-character, but
// resume renderers read both. Tables are wrapped since jsdom drops bare <tbody>/<td>.
import { RESUME_PANEL_HTML } from "dev/public/js/components/resume/skeleton.js";
import { resetDOM } from "./domFixture.js";

const OUTSIDE_PANEL = `
  <input id="weight" value="0" />
  <div id="resume_bar_experience"></div>
  <table>
    <tbody id="resume_points_tbody"></tbody>
    <tfoot><tr><td id="resume_total_points_cell"></td></tr></tfoot>
  </table>
`;

export const RESUME_SKELETON = RESUME_PANEL_HTML + OUTSIDE_PANEL;

export function resetResumeDOM() {
  resetDOM(RESUME_SKELETON);
}
