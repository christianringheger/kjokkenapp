// Skjerm: arkiv – lenker til de trykte PDF-manualene for utskrift.
// Avdelinger som fortsatt vil trykke opp manualer, laster dem ned herfra selv.
// `url` = full lenke til PDF-en (hostes eksternt). Tom url = lenke ikke satt ennå.
import { esc } from "../lib/dom.js";
import { appHeader } from "./nav.js";

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>`;

export const MANUALER = [
  {
    title: "Bong- og påsmurtmanual",
    desc: "Meny, oppskrifter, oppbygging og påsmurt.",
    url: "https://bitastad.sharepoint.com/:b:/r/sites/JordbrpikeneServicekontor/Delte%20dokumenter/General/Konsept%20og%20mat/Meny/2026/JP_Juni_menyskifte/Teams/JP_Bong%20og%20pa%CC%8Asmurtmanual_Sommer%202026.pdf?d=w129231805b0044e887c66d7bc73c7ee4&csf=1&web=1&e=e3Pdpm",
    pages: 49,
  },
  {
    title: "Diskmanual",
    desc: "Rutiner og produkter i disken.",
    url: "https://bitastad.sharepoint.com/:b:/r/sites/JordbrpikeneServicekontor/Delte%20dokumenter/General/Konsept%20og%20mat/Meny/2026/JP_Juni_menyskifte/Teams/JP_Diskmanual_Sommer%202026.pdf?d=wff426b3b449e4ab493ae4e45758604e7&csf=1&web=1&e=X5CGs1",
    pages: 13,
  },
  {
    title: "Kakemanual",
    desc: "Kaker og kakemanual.",
    url: "https://bitastad.sharepoint.com/:b:/r/sites/JordbrpikeneServicekontor/Delte%20dokumenter/General/Konsept%20og%20mat/Meny/2026/JP_Juni_menyskifte/Teams/JP_Kakemanual_Sommer%202026.pdf?d=w758d0e9a088d4b9cb0c26de8a85f93de&csf=1&web=1&e=eNtbzV",
    pages: 29,
  },
  {
    title: "Produksjonsmanual",
    desc: "Produksjon og prep av komponenter.",
    url: "https://bitastad.sharepoint.com/:b:/r/sites/JordbrpikeneServicekontor/Delte%20dokumenter/General/Konsept%20og%20mat/Meny/2026/JP_Juni_menyskifte/Teams/JP_Produksjonsmanual_Sommer%202026.pdf?d=w57bea65b4011479dae097fcfa3f46a03&csf=1&web=1&e=Asddiu",
    pages: 17,
  },
  {
    title: "Catering allergiguide",
    desc: "Allergener for catering-utvalget.",
    url: "https://bitastad.sharepoint.com/:b:/r/sites/JordbrpikeneServicekontor/Delte%20dokumenter/General/Konsept%20og%20mat/Meny/2026/JP_Juni_menyskifte/Teams/JP_Catering_Allergiguide_NO_Sommer%202026.pdf?d=w8215cbd531dd498e836a6171d4583528&csf=1&web=1&e=kEC6lL",
    pages: 5,
  },
  {
    title: "Bordmeny",
    desc: "Trykt bordmeny med priser og allergener.",
    url: "https://bitastad.sharepoint.com/:b:/r/sites/JordbrpikeneServicekontor/Delte%20dokumenter/General/Konsept%20og%20mat/Meny/2026/JP_Juni_menyskifte/Teams/JP_Bordmeny_NO_Sommer%202026%20-%20Prisjustert.pdf?d=w8d86ffced0954bc9b8342f55f753fe19&csf=1&web=1&e=80Ba9b",
    pages: 2,
  },
];

function manualCard(m) {
  const inner = `
    <span class="arkiv-ic" aria-hidden="true">${ICON}</span>
    <span class="arkiv-body">
      <span class="arkiv-title">${esc(m.title)}</span>
      <span class="arkiv-desc">${esc(m.desc)}</span>
      <span class="arkiv-meta">PDF · ${m.pages} sider · Sommer 2026</span>
    </span>`;

  if (!m.url) {
    return `<div class="arkiv-card arkiv-card-pending">${inner}<span class="arkiv-pending">Lenke ikke satt</span></div>`;
  }
  return `<a class="arkiv-card" href="${esc(
    m.url
  )}" target="_blank" rel="noopener">${inner}<span class="arkiv-open">Åpne / skriv ut ›</span></a>`;
}

export function renderArkiv() {
  return `
    ${appHeader("arkiv")}
    <main class="wrap detail">
      <header class="detail-head">
        <p class="detail-cat">Arkiv</p>
        <h1>Manualer (PDF)</h1>
        <p class="lead">De trykte manualene i PDF. Trenger avdelingen din papirutgave, laster du ned og skriver ut herfra selv.</p>
      </header>
      <div class="arkiv-list">
        ${MANUALER.map(manualCard).join("")}
      </div>
    </main>`;
}
