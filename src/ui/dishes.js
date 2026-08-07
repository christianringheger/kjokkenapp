// Skjerm: liste over alle retter, gruppert på kategori, med søk og filter.
import {
  CATEGORIES,
  CATEGORY_NAME,
  TAG_NAME,
  ALLERGEN_NAME,
} from "../data/labels.js";
import { esc } from "../lib/dom.js";
import { allergenIcons, allergenIcon } from "../lib/allergens.js";
import { appHeader } from "./nav.js";

function dishCard(d) {
  const price = d.price ? `<span class="price">${esc(d.price)},-</span>` : "";
  const gf = d.gf
    ? `<span class="badge badge-gf"><span class="check">✓</span> Glutenfri</span>`
    : "";
  const tag = d.tag
    ? `<span class="badge badge-tag">${esc(TAG_NAME[d.tag] || d.tag)}</span>`
    : "";
  const review = d.alReview
    ? `<span class="badge badge-review">⚠ Allergener uavklart</span>`
    : "";
  const badges =
    tag || gf || review
      ? `<div class="badges">${tag}${gf}${review}</div>`
      : "";
  return `
    <a class="card" href="#/dish/${esc(d.id)}">
      <div class="card-top">
        <h3 class="dish-name">${esc(d.name)}</h3>
        ${price}
      </div>
      <div class="card-meta">
        ${badges}
        ${allergenIcons(d.all)}
      </div>
    </a>`;
}

function categorySection(dishes, catKey, catName) {
  const items = dishes.filter((d) => d.cat === catKey);
  if (!items.length) return "";
  return `
    <section class="cat">
      <h2 class="cat-title">${esc(catName)}<span class="cat-count">${items.length}</span></h2>
      <div class="grid">${items.map(dishCard).join("")}</div>
    </section>`;
}

// Allergifilter-rad: én knapp per allergen. Trykk = skjul retter med det allergenet.
function allergenFilterChips(avoid) {
  return Object.entries(ALLERGEN_NAME)
    .map(
      ([k, label]) =>
        `<button type="button" class="alf-chip" data-al="${esc(k)}" aria-pressed="${
          avoid && avoid.has(k) ? "true" : "false"
        }">${allergenIcon(k)}<span>${esc(label)}</span></button>`
    )
    .join("");
}

// Rammen rundt lista: topplinje + søkeverktøy + tom resultatboks.
export function renderDishesShell(state = {}) {
  const avoid = state.avoid;
  const open = !!state.alOpen;
  return `
    ${appHeader("meny")}
    <div class="subbar">
      <div class="subbar-in">
        <input
          id="search"
          class="search"
          type="search"
          placeholder="Søk etter rett eller ingrediens…"
          autocomplete="off"
        />
        <label class="toggle">
          <input type="checkbox" id="gfOnly" /> Kun glutenfri
        </label>
        <button
          type="button"
          class="alltoggle"
          id="alToggle"
          aria-pressed="${open ? "true" : "false"}"
          aria-controls="alFilter"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
          Allergifilter
        </button>
        <div class="seg" id="groupSeg" role="group" aria-label="Gruppering">
          <button type="button" data-group="cat" class="seg-btn${
            state.groupBy === "station" ? "" : " on"
          }">Kategori</button>
          <button type="button" data-group="station" class="seg-btn${
            state.groupBy === "station" ? " on" : ""
          }">Stasjon</button>
        </div>
      </div>
      <div class="alfilter" id="alFilter"${open ? "" : " hidden"}>
        <div class="alfilter-in">
          <span class="alfilter-lead">Skjul retter som inneholder:</span>
          <div class="alf-chips">${allergenFilterChips(avoid)}</div>
        </div>
      </div>
    </div>
    <main class="wrap"><div id="results"></div></main>`;
}

// Filtrer retter på søketekst (navn + ingrediens), glutenfri-bryter og allergifilter.
export function filterDishes(dishes, state) {
  const q = (state.q || "").trim().toLowerCase();
  const avoid = state.avoid;
  return dishes.filter((d) => {
    if (state.gfOnly && !d.gf) return false;
    if (avoid && avoid.size && (d.all || []).some((a) => avoid.has(a)))
      return false;
    if (!q) return true;
    if ((d.name || "").toLowerCase().includes(q)) return true;
    const comps = d.comp || d.ing || [];
    return comps.some((c) => (c.n || c.name || "").toLowerCase().includes(q));
  });
}

// Finn oppskrifter som matcher søket (tittel + ingrediens). Tom uten søketekst.
export function filterRecipes(recipes, state) {
  const q = (state.q || "").trim().toLowerCase();
  if (!q) return [];
  return recipes.filter((r) => {
    if ((r.title || "").toLowerCase().includes(q)) return true;
    return (r.ing || []).some((i) =>
      (i.name || i.n || "").toLowerCase().includes(q)
    );
  });
}

function recipeCard(r) {
  const cat = r.cat ? `<span class="recipe-cat">${esc(r.cat)}</span>` : "";
  return `
    <a class="card card-recipe" href="#/recipe/${esc(r.id)}">
      <div class="card-top">
        <h3 class="dish-name">${esc(r.title)}</h3>
      </div>
      <div class="card-meta">
        <span class="badge badge-recipe">Oppskrift</span>
        ${cat}
      </div>
    </a>`;
}

function recipeSection(recipes) {
  if (!recipes.length) return "";
  return `
    <section class="cat">
      <h2 class="cat-title">Oppskrifter<span class="cat-count">${recipes.length}</span></h2>
      <div class="grid">${recipes.map(recipeCard).join("")}</div>
    </section>`;
}

// Kategori-seksjoner for et sett retter (kjente kategorier først, så resten).
function categorySections(dishes) {
  const known = new Set(CATEGORIES.map(([k]) => k));
  let html = CATEGORIES.map(([key, name]) =>
    categorySection(dishes, key, name)
  ).join("");
  const others = [...new Set(dishes.map((d) => d.cat))].filter(
    (c) => c && !known.has(c)
  );
  html += others
    .map((c) => categorySection(dishes, c, CATEGORY_NAME[c] || c))
    .join("");
  return html;
}

// Stasjon-gruppering: Bong / Disk / (drikke & catering uten stasjon).
const STATIONS = [
  ["bong", "Bong", "lages på bestilling"],
  ["disk", "Disk", "ferdig i disken"],
];
function stationHead(name, sub) {
  const s = sub ? `<span class="station-sub">${esc(sub)}</span>` : "";
  return `<div class="station-head"><span class="station-name">${esc(name)}</span>${s}</div>`;
}
function stationSections(dishes) {
  let html = "";
  STATIONS.forEach(([key, name, sub]) => {
    const grp = dishes.filter((d) => (d.station || "") === key);
    if (!grp.length) return;
    html += stationHead(name, sub) + categorySections(grp);
  });
  const rest = dishes.filter(
    (d) => d.station !== "bong" && d.station !== "disk"
  );
  if (rest.length) html += stationHead("Drikke & catering", "") + categorySections(rest);
  return html;
}

// Bygg resultatlista: retter (kategori- eller stasjonsgruppert) + oppskrifter ved søk.
export function renderDishResults(dishes, recipes, state) {
  const filtered = filterDishes(dishes, state);
  const matchedRecipes = filterRecipes(recipes || [], state);
  const searching = !!(state.q || "").trim();

  const count = searching
    ? `<p class="rescount">${filtered.length} ${
        filtered.length === 1 ? "rett" : "retter"
      } · ${matchedRecipes.length} ${
        matchedRecipes.length === 1 ? "oppskrift" : "oppskrifter"
      }</p>`
    : `<p class="rescount">${filtered.length} av ${dishes.length} retter</p>`;

  if (!filtered.length && !matchedRecipes.length) {
    return `${count}<p class="empty">Ingen treff. Prøv et annet søkeord.</p>`;
  }

  let html =
    state.groupBy === "station"
      ? stationSections(filtered)
      : categorySections(filtered);

  html += recipeSection(matchedRecipes);

  return count + html;
}
