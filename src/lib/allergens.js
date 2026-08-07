// Allergen-ikoner (linjeikoner, 24×24) — hentet fra originalens ALPATH.
import { ALLERGEN_NAME } from "../data/labels.js";
import { esc } from "./dom.js";

export const ALPATH = {
  gluten:
    '<path d="M12 21v-8"/><path d="M12 13c-2.4 0-3.4-1.6-3.4-3.5 1.9 0 3.4.9 3.4 3.5z"/><path d="M12 13c2.4 0 3.4-1.6 3.4-3.5-1.9 0-3.4.9-3.4 3.5z"/><path d="M12 9c-2.4 0-3.4-1.6-3.4-3.5 1.9 0 3.4.9 3.4 3.5z"/><path d="M12 9c2.4 0 3.4-1.6 3.4-3.5-1.9 0-3.4.9-3.4 3.5z"/>',
  melk: '<path d="M7 9 12 4l5 5v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M12 4v5"/><path d="M7 9h10"/>',
  egg: '<path d="M12 3c-3 0-5.5 4-5.5 8.5a5.5 5.5 0 0 0 11 0C17.5 7 15 3 12 3z"/>',
  sennep:
    '<path d="M10.5 3h3v2l1 2.2a3 3 0 0 1 .3 1.3V20a1 1 0 0 1-1 1H9.2a1 1 0 0 1-1-1V8.5a3 3 0 0 1 .3-1.3l1-2.2z"/><path d="M9.2 12h5.6"/>',
  sulfitt: '<path d="M8 3h8l-.8 6a3.2 3.2 0 0 1-6.4 0z"/><path d="M12 12v6"/><path d="M9 18h6"/>',
  selleri:
    '<path d="M12 21V8"/><path d="M12 8c0-2.4 1.7-3.9 3.9-3.9 0 2.4-1.5 3.9-3.9 3.9z"/><path d="M12 11c-2 0-3.4-1-3.4-2.9 2 0 3.4 1 3.4 2.9z"/><path d="M8.5 21h7"/>',
  soya: '<path d="M6.5 15.5c-2.2-2.6-1.4-7 1.8-9.3s7.6-1.8 9.3 1"/><circle cx="9.5" cy="12.2" r="1.5"/><circle cx="12.6" cy="10.3" r="1.5"/><circle cx="15.6" cy="9" r="1.5"/>',
  skalldyr:
    '<path d="M18.5 6.5c.7 3.4-.6 8.2-5.6 9.6-2 .5-4-.4-4.4-2.4-.3-1.7 1-3.1 2.9-3.1 3.6 0 5.6-1.7 5.6-4.5z"/><path d="M18.5 6.5c.6-.9 1.7-1.1 2.6-.7"/><path d="M8.5 13.6 6 15M9.5 15.7 8 18M11.6 16.4l-.7 2.4"/>',
  fisk: '<path d="M4 12c2-3 6-5 10-5 2.6 0 4.2 1.3 5.1 3.1L21 8v8l-1.9-2.1C18.2 15.7 16.6 17 14 17c-4 0-8-2-10-5z"/><circle cx="8.5" cy="10.5" r="1"/>',
  peanotter:
    '<path d="M12 3.4c-2 0-3.4 1.4-3.4 3.1 0 1 .5 1.7.5 2.7 0 1.2-1.3 2.1-1.3 4 0 3.1 2 5.6 4.2 5.6s4.2-2.5 4.2-5.6c0-1.9-1.3-2.8-1.3-4 0-1 .5-1.7.5-2.7 0-1.7-1.4-3.1-3.4-3.1z"/><path d="M8.8 9.4c2 1.1 4.4 1.1 6.4 0"/>',
  notter:
    '<path d="M12 3.2c-3.6 0-6.2 2.6-6.2 6.6 0 4.1 3.1 8.6 6.2 10.6 3.1-2 6.2-6.5 6.2-10.6 0-4-2.6-6.6-6.2-6.6z"/><path d="M7 8.2h10"/><path d="M12 3.2v4"/>',
  sesam:
    '<ellipse cx="8" cy="9" rx="1.5" ry="2.6" transform="rotate(-25 8 9)"/><ellipse cx="14.5" cy="8" rx="1.5" ry="2.6" transform="rotate(22 14.5 8)"/><ellipse cx="11" cy="15" rx="1.5" ry="2.6" transform="rotate(-8 11 15)"/>',
  lupin:
    '<path d="M5.5 15.5c-2.2-6 1.8-11.2 8-12.3 1.6 3.1 1.6 9.2-1 12.3"/><circle cx="8.2" cy="11.2" r="1.1"/><circle cx="10.7" cy="9" r="1.1"/><circle cx="13" cy="6.8" r="1.1"/>',
  blotdyr:
    '<path d="M3 18h9"/><path d="M12 18a6 6 0 1 0-6-6c0 2.2 1.8 4 4 4s3-1.4 3-3-1.2-2.6-2.5-2.6"/><path d="M18 9c.6-.8 1.4-1.2 2.2-1.2"/>',
};

// Ett ikon (uten tekst).
export function allergenIcon(key) {
  const p = ALPATH[key];
  if (!p) return "";
  return `<svg class="al-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

// Kompakt rad med bare ikoner (til kort). Navn ligger i title for tilgjengelighet.
export function allergenIcons(keys = []) {
  if (!keys.length) return "";
  return `<ul class="al-row">${keys
    .map(
      (k) =>
        `<li class="al-ic-wrap" title="${esc(ALLERGEN_NAME[k] || k)}">${allergenIcon(k)}</li>`
    )
    .join("")}</ul>`;
}

// Ikon + navn (til detaljvisning).
export function allergenChips(keys = []) {
  if (!keys.length) return "";
  return `<ul class="al-chips">${keys
    .map(
      (k) =>
        `<li class="al-chip">${allergenIcon(k)}<span>${esc(ALLERGEN_NAME[k] || k)}</span></li>`
    )
    .join("")}</ul>`;
}
