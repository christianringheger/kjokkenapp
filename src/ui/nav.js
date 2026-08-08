// Toppnavigasjon + navnetrekk med jordbær-stempel.
import { esc } from "../lib/dom.js";

// Offisielt JP-jordbær (designprofilen: JP_Strawberry_red_RGB.svg — silhuett + 5 frø).
// Farges via currentColor (rød på lyse flater, jf. `.berry` i CSS).
export function berry() {
  return `<svg class="berry" viewBox="0 0 377 569" fill="currentColor" aria-hidden="true"><path d="M375.93,264.77c0-19.9-13.74-50.08-34.69-52.73a1.16,1.16,0,0,1-1-1.06,40.15,40.15,0,0,0-39.73-36.58H267.38a1.15,1.15,0,0,1-.79-.31,111.5,111.5,0,0,0-32-21.31q-4.23-1.87-8.67-3.41a.36.36,0,0,1,.11-.71H329.35A3.62,3.62,0,0,0,333,145v-5.48a3.63,3.63,0,0,0-3.63-3.64H196a1.16,1.16,0,0,1-1.16-1.16V4.7A3.67,3.67,0,0,0,191.15,1h-5.43a3.66,3.66,0,0,0-3.66,3.66l-.32,130.06a1.18,1.18,0,0,1-1.17,1.16H47a3.64,3.64,0,0,0-3.64,3.63V145A3.63,3.63,0,0,0,47,148.66H150.31a.36.36,0,0,1,.11.71q-4.44,1.53-8.68,3.41a111.59,111.59,0,0,0-32,21.31,1.17,1.17,0,0,1-.79.31H79.76A43.81,43.81,0,0,0,36.56,211a1.17,1.17,0,0,1-1,1C14.33,214.34.4,244.72.4,264.77v1.16l.33.83C-.18,308,11.29,359.69,33.05,412.24c.76,1.84,1.54,3.68,2.32,5.5,2.47,5.76,5.11,11.58,7.83,17.29s5.53,11.33,8.45,16.92,5.91,11,9,16.37S66.78,478.88,70,484s6.4,10.06,9.65,14.85,6.57,9.46,9.84,13.86,6.62,8.69,9.91,12.71c2.69,3.27,5.46,6.65,8.5,9.75.9.92,1.83,1.82,2.79,2.69a121.26,121.26,0,0,0,14.46,11.29,115.16,115.16,0,0,0,109.45,9.06,112.2,112.2,0,0,0,19.53-11.05l.08-.06,14.3-11.77.14-.13c27.08-29.4,55-75.37,74.73-123,21.8-52.65,33.28-104.37,32.32-145.69l.25-.63Zm-12.36.88h0c1.17,39.87-10,90.29-31.38,142-18.34,44.3-44.32,87.71-69.43,116.07l-.06,0-2.59,2.61a99.75,99.75,0,0,1-30.41,20.82,103.39,103.39,0,0,1-83.07,0,99.7,99.7,0,0,1-30.28-20.7l-1.88-1.88-.06-.06C89,496.11,62.76,452.41,44.22,407.62,22.86,356,11.71,305.68,12.84,265.85l0-1.24-.37-.95c.53-19,14-39.73,25.89-39.73h6A3.66,3.66,0,0,0,48,220.31V219.1a33,33,0,0,1,32.86-32.61h33a1.17,1.17,0,0,0,.83-.34l1.43-1.44a99.6,99.6,0,0,1,30.47-20.88,101.64,101.64,0,0,1,33.79-8.42,1.18,1.18,0,0,1,1.26,1.18l-.16,64.08a3.65,3.65,0,0,0,3.7,3.65l6-.08a3.65,3.65,0,0,0,3.6-3.64v-64a1.17,1.17,0,0,1,1.25-1.17,101.51,101.51,0,0,1,33.63,8.41,99.53,99.53,0,0,1,30.47,20.88l1.43,1.44a1.17,1.17,0,0,0,.82.34h36.91a28.94,28.94,0,0,1,28.94,28.94v7.1a1.41,1.41,0,0,0,1.41,1.4h8.26c11.88,0,25.37,20.74,25.89,39.73l-.3.75Z"/><rect x="91.39" y="286.98" width="13.57" height="56.38" rx="3.66"/><rect x="135.88" y="400.22" width="13.57" height="56.38" rx="3.64"/><rect x="226.87" y="400.22" width="13.58" height="56.38" rx="3.64"/><rect x="181.38" y="286.98" width="13.58" height="56.38" rx="3.66"/><rect x="271.36" y="286.98" width="13.58" height="56.38" rx="3.66"/></svg>`;
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
