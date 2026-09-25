// Structural config (key/href/match) is mixed with labels on purpose, as with `nav` and
// `reference.sections` — adding a page is an entry here plus its .html file.
//
// `match` lists every pathname that should mark the entry as current; the sheet needs
// two because the static server answers "/" with index.html.
export const PAGES = {
  ariaLabel: "Selecionar página",
  triggerAria: "Trocar de página",
  items: [
    {
      key: "sheet",
      label: "Ficha",
      href: "/",
      match: ["/", "/index.html"],
    },
    {
      key: "reference",
      label: "Referência",
      href: "/reference.html",
      match: ["/reference.html"],
    },
  ],
};
