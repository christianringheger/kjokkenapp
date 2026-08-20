// Skjerm: prep-oppgaver, gruppert på seksjon, med ukesplan.
// Hver oppgave kan legges på ukedager (lagres lokalt), og lista kan filtreres per dag.
import { esc } from "../lib/dom.js";
import { appHeader } from "./nav.js";

export const DAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
// To bokstaver på dagsknappene så Tirsdag/Torsdag ikke blir tvetydige (begge «T»).
const DAYS_SHORT = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const KEY = "jp_prepdays";
const DONE_KEY = "jp_prepdone";

const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>`;

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

// «Gjort i dag»-avkryssing. Nullstilles automatisk ved nytt døgn (lagrer dato).
function today() {
  return new Date().toISOString().slice(0, 10);
}
export function loadPrepDone() {
  try {
    const o = JSON.parse(localStorage.getItem(DONE_KEY));
    if (o && o.date === today() && Array.isArray(o.ids)) return new Set(o.ids);
  } catch (e) {
    /* ignore */
  }
  return new Set();
}
export function savePrepDone(set) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify({ date: today(), ids: [...set] }));
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

function prepRow(p, days, done) {
  const hold = p.hold ? `<span class="hold">${esc(p.hold)}</span>` : "";
  const link = linkHtml(p.link);
  const meta = hold || link ? `<span class="prep-meta">${hold}${link}</span>` : "";
  const isDone = done.has(p.id);
  return `
    <li class="prep-item${isDone ? " done" : ""}">
      <div class="prep-item-top">
        <button type="button" class="prep-check" data-pdone="${esc(p.id)}" aria-pressed="${isDone}" aria-label="Merk som gjort">${CHECK}</button>
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
  const done = state.done || new Set();
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

  const doneCount = shown.filter((p) => done.has(p.id)).length;
  const countText =
    filter < 0
      ? `${prepitems.length} prep-oppgaver`
      : `${shown.length} oppgaver på ${DAYS[filter]}`;
  const resetBtn = done.size
    ? `<button type="button" class="prep-reset" data-preset>Nullstill gjort</button>`
    : "";
  const count = `<div class="prep-count-row"><p class="rescount">${countText} · ${doneCount} gjort</p>${resetBtn}</div>`;

  const sections = order
    .map(
      (s) => `
      <section class="cat">
        <h2 class="cat-title">${esc(s)} <span class="cat-count">${groups[s].length}</span></h2>
        <ul class="preplist">${groups[s].map((p) => prepRow(p, days, done)).join("")}</ul>
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
        <p class="prep-lead">Hak av oppgaver etter hvert som de gjøres (nullstilles automatisk hver dag). Trykk på ukedagene for å planlegge når hver oppgave skal gjøres. Lagres lokalt på denne enheten.</p>
        ${filterBar(state.filter)}
      </div>
    </div>
    <main class="wrap"><div id="prepResults"></div></main>`;
}
