// Skjerm: råvare-indeks — søk opp en råvare og se hvor den brukes.
import { esc } from "../lib/dom.js";
import { appHeader } from "./nav.js";

// Bygg indeks: råvarenavn -> liste med steder den brukes (rett/oppskrift).
export function buildRavareIndex(seed) {
  const map = {};
  const add = (rawName, kind, id, title) => {
    const name = (rawName || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!map[key]) map[key] = { name, uses: [] };
    if (!map[key].uses.some((u) => u.kind === kind && u.id === id))
      map[key].uses.push({ kind, id, title });
  };
  (seed.dishes || []).forEach((d) =>
    (d.comp || d.ing || []).forEach((c) => add(c.n || c.name, "dish", d.id, d.name))
  );
  (seed.recipes || []).forEach((r) =>
    (r.ing || []).forEach((i) => add(i.name || i.n, "recipe", r.id, r.title))
  );
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, "no"));
}

function ravareRow(x) {
  const uses = x.uses
    .map(
      (u) =>
        `<a class="rav-use${u.kind === "recipe" ? " rav-use-rec" : ""}" href="#/${
          u.kind === "recipe" ? "recipe" : "dish"
        }/${esc(u.id)}">${esc(u.title)}</a>`
    )
    .join("");
  return `
    <li class="rav-row">
      <div class="rav-name">${esc(x.name)}<span class="rav-count">${x.uses.length}</span></div>
      <div class="rav-uses">${uses}</div>
    </li>`;
}

// Resultatlista (filtrert på søketekst). Skilt ut så input beholder fokus.
export function renderRavareResults(index, state) {
  const q = (state.rq || "").trim().toLowerCase();
  const list = q ? index.filter((x) => x.name.toLowerCase().includes(q)) : index;
  const count = `<p class="rescount">${list.length} av ${index.length} råvarer</p>`;
  if (!list.length) {
    return `${count}<p class="empty">Ingen råvare matcher søket.</p>`;
  }
  return `${count}<ul class="rav-list">${list.map(ravareRow).join("")}</ul>`;
}

// Rammen rundt indeksen: topplinje + søkefelt + tom resultatboks.
export function renderRavareShell() {
  return `
    ${appHeader("ravarer")}
    <div class="subbar">
      <div class="subbar-in">
        <input
          id="ravSearch"
          class="search"
          type="search"
          placeholder="Søk etter råvare…"
          autocomplete="off"
        />
      </div>
    </div>
    <main class="wrap"><div id="ravResults"></div></main>`;
}
