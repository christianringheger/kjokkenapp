// Skjerm: endringslogg — kort intern oversikt over hva som er gjort i appen.
import { esc, fmtDateNo } from "../lib/dom.js";
import { appHeader } from "./nav.js";
import { CHANGELOG } from "../data/changelog.js";

export function renderChangelog() {
  const sections = CHANGELOG.map(
    (e) => `
      <section class="dsec">
        <h2 class="dsec-title">${esc(fmtDateNo(e.date))}</h2>
        <ul class="cl-list">${e.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </section>`
  ).join("");
  return `
    ${appHeader()}
    <main class="wrap detail">
      <header class="detail-head">
        <p class="detail-cat">Internt</p>
        <h1>Endringslogg</h1>
        <p class="lead">Oversikt over endringer gjort i appen — til intern orientering.</p>
      </header>
      ${sections}
    </main>`;
}
