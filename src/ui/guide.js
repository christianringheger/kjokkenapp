// Skjerm: glutenfri-guide. Innhold hentet ordrett fra
// «JP Bong- og påsmurtmanual, Sommer 2026» (s. 4).
import { esc } from "../lib/dom.js";
import { appHeader } from "./nav.js";

// Rutiner for trygg håndtering (sjekkliste).
const RUTINER = [
  "Glutenfrie produkter må aldri lagres sammen med glutenholdige produkter.",
  "Vask hendene godt før du håndterer glutenfri mat.",
  "Bruk alltid rene redskaper som rist, skjærefjøl og kniv.",
  "Merk bakker med «glutenfritt» (f.eks. smør, Philadelphia eller andre ingredienser som brukes til smøring).",
  "Legg mat på bakepapir før den settes i ovnen for å sikre et rent underlag.",
  "Bruk alltid øverste hylle/rist i ovn og på lager for å unngå at noe drysser ned på maten.",
  "Stek i en ren stekepanne eller kjele – aldri i en som har vært brukt til glutenholdig mat.",
];

// «Viktig!»-punkter.
const VIKTIG = [
  "Avklar alltid allergener og behandling med gjesten før servering.",
  "Glutenfrie produkter kan ligne på vanlige produkter – dobbeltsjekk alltid at du bruker riktig vare.",
  "Stek produkter med stekepose direkte i ovnen for å unngå krysskontaminering.",
];

// Ferdige glutenfrie produkter vi har.
const PRODUKTER = [
  "Lyst landstykke",
  "Brødskiver",
  "Hamburgerbrød",
  "Pasta",
  "Pannekaker",
  "Eplemuffins",
  "Sjokoladeterte",
];

// «Glutenfri på 1-2-3» – erstatninger per rett/type.
const ERSTATNINGER = [
  ["Hamburger", "1 stk glutenfritt hamburgerbrød"],
  ["Grillet ostesmørbrød", "Glutenfritt landstykke"],
  ["Pannekaker", "3 stk glutenfrie pannekaker"],
  ["Brødskive leverpostei", "2 stk skiver glutenfritt brød / 1 stk briks"],
  ["Halvt rundstykke", "1 stk glutenfritt brød / 1 stk briks"],
  ["Påsmurt focaccia", "1 stk glutenfritt landstykke"],
  ["Salater", "Krutonger fjernes; erstatt focaccia med 2 skiver glutenfritt brød / 1 briks"],
  ["Suppe", "Erstatt focaccia med 2 skiver glutenfritt brød / 1 briks"],
  ["Bruschetta", "2 stk skiver glutenfritt brød"],
];

const li = (items) =>
  `<ul class="guide-list">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;

function section(title, body) {
  return `<section class="dsec"><h2 class="dsec-title">${esc(title)}</h2>${body}</section>`;
}

export function renderGuide() {
  const rutiner = `<ol class="guide-steps">${RUTINER.map(
    (t) => `<li>${esc(t)}</li>`
  ).join("")}</ol>`;

  const erstatninger = `<ul class="guide-swap">${ERSTATNINGER.map(
    ([rett, bytt]) =>
      `<li><span class="swap-from">${esc(rett)}</span><span class="swap-to">${esc(
        bytt
      )}</span></li>`
  ).join("")}</ul>`;

  return `
    ${appHeader("guide")}
    <main class="wrap detail">
      <header class="detail-head">
        <p class="detail-cat">Glutenfri</p>
        <h1>Glutenfri-guide</h1>
        <p class="lead">Rutiner for trygg oppbevaring, tilberedning og servering av glutenfri mat.</p>
      </header>

      <div class="review-banner">
        <strong>⚠ Trygg mat for alle.</strong> Selv små mengder gluten kan gi alvorlige reaksjoner.
        Er du usikker – dobbeltsjekk alltid med gjesten eller en kollega før du serverer.
      </div>

      ${section("Rutiner for håndtering", rutiner)}
      ${section("Viktig", li(VIKTIG))}
      ${section("Glutenfri på 1-2-3", erstatninger)}
      ${section("Våre glutenfrie produkter", li(PRODUKTER))}

      <p class="guide-src">Kilde: JP Bong- og påsmurtmanual, Sommer 2026 (s. 4).</p>
    </main>`;
}
