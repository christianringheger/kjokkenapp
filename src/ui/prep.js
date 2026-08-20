// Skjerm: prep-oppgaver, gruppert på seksjon, med ukesplan.
// Hver oppgave kan legges på ukedager (lagres lokalt), og lista kan filtreres per dag.
import { esc } from "../lib/dom.js";
import { appHeader } from "./nav.js";

export const DAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
// To bokstaver på dagsknappene så Tirsdag/Torsdag ikke blir tvetydige (begge «T»).
const DAYS_SHORT = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const KEY = "jp_prepdays";

export function loadPrepDays() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch (e) {
    return {};
  }
}
export function savePrepDays(days) {
  try {
    localStorage.setItem(KEY, JSON.stringify(days));
  } catch (e) {
    /* ignore */
  }
}

// Gjør en link som "r:r5" / "d:d3" om til en klikkbar lenke.
function linkHtml(link) {
  if (!link) return "";
  const [pre, id] = link.split(":");
  if (pre === "d") return `<a class="prep-link" href="#/dish/${esc(id)}">Se rett ›</a>`;
  return `<a class="prep-link" href="#/recipe/${esc(id)}">Se oppskrift ›</a>`;
}

function dayToggles(p, days) {
  const on = days[p.id] || [];
  return `<div class="prep-days">${DAYS.map(
    (d, i) =>
      `<button type="button" class="prep-day${on.includes(i) ? " on" : ""}" data-pday="${esc(
        p.id
      )}|${i}" aria-pressed="${on.includes(i)}" title="${d}">${DAYS_SHORT[i]}</button>`
  ).join("")}</div>`;
}

function prepRow(p, days) {
  const hold = p.hold ? `<span class="hold">${esc(p.hold)}</span>` : "";
  const link = linkHtml(p.link);
  const meta = hold || link ? `<span class="prep-meta">${hold}${link}</span>` : "";
  return `
    <li class="prep-item">
      <div class="prep-item-top">
        <span class="prep-name">${esc(p.name)}</span>
        ${meta}
      </div>
      ${dayToggles(p, days)}
    </li>`;
}

// Filterknapper: Alle + de sju ukedagene.
function filterBar(filter) {
  const btn = (i, label) =>
    `<button type="button" class="prep-filter${
      filter === i ? " on" : ""
    }" data-pfilter="${i}">${esc(label)}</button>`;
  return `<div class="prep-filter-row">${btn(-1, "Alle")}${DAYS.map((d, i) =>
    btn(i, d)
  ).join("")}</div>`;
}

// Resultatlista (seksjoner), filtrert på valgt dag. Skilt ut for gjentegning.
export function renderPrepResults(prepitems, state) {
  const filter = state.filter;
  const days = state.days;
  const shown =
    filter < 0
      ? prepitems
      : prepitems.filter((p) => (days[p.id] || []).includes(filter));

  if (!shown.length) {
    return `<p class="rescount">Ingen prep lagt på ${DAYS[filter]} ennå.</p>`;
  }

  const order = [];
  const groups = {};
  shown.forEach((p) => {
    const s = p.sec || "Annet";
    if (!groups[s]) {
      groups[s] = [];
      order.push(s);
    }
    groups[s].push(p);
  });

  const count =
    filter < 0
      ? `<p class="rescount">${prepitems.length} prep-oppgaver</p>`
      : `<p class="rescount">${shown.length} oppgaver på ${DAYS[filter]}</p>`;

  const sections = order
    .map(
      (s) => `
      <section class="cat">
        <h2 class="cat-title">${esc(s)} <span class="cat-count">${groups[s].length}</span></h2>
        <ul class="preplist">${groups[s].map((p) => prepRow(p, days)).join("")}</ul>
      </section>`
    )
    .join("");

  return count + sections;
}

export function renderPrepShell(state) {
  return `
    ${appHeader("prep")}
    <div class="subbar">
      <div class="subbar-in prep-subbar">
        <p class="prep-lead">Trykk på ukedagene for å planlegge når hver oppgave skal gjøres. Lagres lokalt på denne enheten.</p>
        ${filterBar(state.filter)}
      </div>
    </div>
    <main class="wrap"><div id="prepResults"></div></main>`;
}
