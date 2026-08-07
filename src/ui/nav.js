// Toppnavigasjon + navnetrekk med jordbær-stempel.
import { esc } from "../lib/dom.js";

// Lite jordbær-stempel (JP-merke).
export function berry() {
  const seeds = [
    [13, 16], [19, 16], [16, 20], [11.5, 20], [20.5, 20],
    [14.2, 24], [17.8, 24], [16, 27],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.85"/>`)
    .join("");
  return `<svg class="berry" viewBox="0 0 32 32" aria-hidden="true">
    <path class="berry-leaf" d="M16 5.5v4"/>
    <path class="berry-leaf-fill" d="M16 10.5C14.3 7 10.8 6 8.3 7c1.5 2 4 3.3 7.7 3.5 3.7-.2 6.2-1.5 7.7-3.5-2.5-1-6 0-7.7 3.5z"/>
    <path class="berry-body" d="M16 9c6 0 10 3.6 10 8.1 0 5.6-5.6 11.4-10 12.9-4.4-1.5-10-7.3-10-12.9C6 12.6 10 9 16 9z"/>
    <g class="berry-seeds">${seeds}</g>
  </svg>`;
}

// Topplinje for forsiden: stort navnetrekk, ingen tilbake-knapp.
export function homeHeader() {
  return `
    <header class="appbar">
      <div class="appbar-row appbar-home">
        <a class="brand" href="#/">
          ${berry()}
          <span class="brand-name">Jordbærpikene<span class="brand-sub">Kjøkken</span></span>
        </a>
      </div>
    </header>`;
}

// Felles tilbake-topplinje: «‹ <label>» + lite merke som lenker til forsiden.
function backHeader(href, label) {
  return `
    <header class="appbar">
      <div class="appbar-row">
        <a class="back" href="${href}">‹ ${esc(label)}</a>
        <a class="brand brand-min" href="#/">${berry()}<span class="brand-name">Jordbærpikene</span></a>
      </div>
    </header>`;
}

// Seksjonssider (meny, råvarer, prep, …): tilbake til forsiden.
export function appHeader() {
  return backHeader("#/", "Forside");
}

// Detaljsider (rett/oppskrift): tilbake til menyen.
export function detailHeader() {
  return backHeader("#/meny", "Meny");
}
