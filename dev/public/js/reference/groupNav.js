// This page's own groupNav instance: no desktop sidebar here (group bar + tab strip only), unlike
// the sheet's default singleton. main.js and deepLink.js must share this one instance, since
// activateGroup() only resolves the right layout/group after initGroupNav() has configured it.
import { createGroupNav } from "../components/groupNav.js";

export const { initGroupNav, activateGroup } = createGroupNav({
  navId: "groupnav",
  manageSidebar: false,
});
