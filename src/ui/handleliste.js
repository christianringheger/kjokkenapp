// Skjerm: handleliste. Legg til retter/oppskrifter med antall,
// så summeres alle råvarene (build.ing / ing × antall) til én liste.
// Utvalget lagres lokalt (localStorage), ikke i data.
import { esc, amount } from "../lib/dom.js";
import { appHeader } from "./nav.js";

const KEY = "jp_handle";

export function loadHandle() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}
export function saveHandle(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    /* ignore */
  }
}

function ingsFor(item, dishById, recipeById) {
  if (item.kind === "dish") {
    const d = dishById[item.id];
    return (d && d.build && d.build.ing) || [];
  }
  const r = recipeById[item.id];
  return (r && r.ing) || [];
}
function titleFor(item, dishById, recipeById) {
  return item.kind === "dish"
    ? dishById[item.id] && dishById[item.id].name
    : recipeById[item.id] && recipeById[item.id].title;
}

// Summer råvarer på tvers av valgte retter/oppskrifter, gruppert på navn + enhet.
export function handleTotals(items, dishById, recipeById) {
  const map = {};
  items.forEach((it) => {
    ingsFor(it, dishById, recipeById).forEach((i) => {
      const name = (i.name || i.n || "").trim();
      if (!name) return;
      const unit = i.unit || "";
      const key = name.toLowerCase() + "|" + unit;
      if (!map[key]) map[key] = { name, unit, amt: 0, hasAmt: false };
      if (i.amt != null) {
        map[key].amt += (i.amt || 0) * (it.qty || 1);
        map[key].hasAmt = true;
      }
    });
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, "no"));
}

// Valgte rader + samlet råvareliste. Tegnes på nytt ved endring.
export function renderHandleList(items, dishById, recipeById) {
  const rows = items.length
    ? items
        .map((it) => {
          const nm = titleFor(it, dishById, recipeById);
          if (!nm) return "";
          const kindLabel =
            it.kind === "recipe"
              ? ` <span class="hl-kind">· oppskrift</span>`
              : "";
          return `
      <div class="hl-row">
        <a class="hl-name" href="#/${it.kind === "recipe" ? "recipe" : "dish"}/${esc(
            it.id
          )}">${esc(nm)}${kindLabel}</a>
        <div class="hl-qty">
          <button type="button" class="hl-step" data-hq="${it.kind}:${it.id}|-1" aria-label="Færre">–</button>
          <b>${it.qty}</b>
          <button type="button" class="hl-step" data-hq="${it.kind}:${it.id}|1" aria-label="Flere">+</button>
        </div>
        <button type="button" class="hl-rm" data-hrm="${it.kind}:${it.id}" aria-label="Fjern">✕</button>
      </div>`;
        })
        .join("")
    : `<p class="empty">Lista er tom – søk og legg til retter eller oppskrifter under.</p>`;

  const tot = handleTotals(items, dishById, recipeById);
  const totals = tot.length
    ? `<h2 class="dsec-title hl-tot-title">Samlet råvareliste<span class="cat-count">${tot.length}</span></h2>
       <ul class="hl-totals">${tot
         .map(
           (t) =>
             `<li><span class="hl-amt">${
               t.hasAmt ? esc(amount({ amt: t.amt, unit: t.unit })) : ""
             }</span><span class="hl-ing">${esc(t.name)}</span></li>`
         )
         .join("")}</ul>
       <button type="button" class="hl-clear" data-hclear>Tøm lista</button>`
    : "";

  return `<div class="hl-rows">${rows}</div>${totals}`;
}

// Søkeresultat (retter/oppskrifter som kan legges til). Tegnes separat → input beholder fokus.
export function renderHandleMatches(q, dishes, recipes, items) {
  const query = (q || "").trim().toLowerCase();
  if (!query) return "";
  const chosen = new Set(items.map((it) => it.kind + ":" + it.id));
  const md = dishes
    .filter(
      (d) =>
        (d.name || "").toLowerCase().includes(query) &&
        d.build &&
        (d.build.ing || []).length
    )
    .slice(0, 8);
  const mr = recipes
    .filter(
      (r) => (r.title || "").toLowerCase().includes(query) && (r.ing || []).length
    )
    .slice(0, 8);

  const row = (kind, id, name, isRecipe) => {
    const already = chosen.has(kind + ":" + id);
    return `<div class="hl-add-row">
      <span>${esc(name)}${isRecipe ? ' <span class="hl-kind">· oppskrift</span>' : ""}</span>
      <button type="button" class="hl-add" data-hadd="${kind}:${id}"${
      already ? " disabled" : ""
    }>${already ? "Lagt til" : "Legg til"}</button>
    </div>`;
  };

  let html = md.map((d) => row("dish", d.id, d.name, false)).join("");
  html += mr.map((r) => row("recipe", r.id, r.title, true)).join("");
  if (!md.length && !mr.length)
    html += `<p class="empty">Ingen treff med råvaremengder på «${esc(q)}».</p>`;
  return `<div class="hl-matches">${html}</div>`;
}

export function renderHandleShell() {
  return `
    ${appHeader("handle")}
    <main class="wrap detail">
      <header class="detail-head">
        <h1>Handleliste</h1>
        <p class="lead">Legg til retter eller oppskrifter med antall – appen summerer alle råvarene til én liste (mise en place / innkjøp). Lagres lokalt på denne enheten.</p>
      </header>
      <div id="handleList"></div>
      <div class="subbar hl-searchbar">
        <div class="subbar-in">
          <input
            id="handleSearch"
            class="search"
            type="search"
            placeholder="Søk rett eller oppskrift å legge til…"
            autocomplete="off"
          />
        </div>
      </div>
      <div id="handleMatches"></div>
    </main>`;
}
