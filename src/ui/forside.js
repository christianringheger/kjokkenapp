// Skjerm: forside – nyhetsfelt øverst + flis-grid som er hovednavet inn i appen.
import { esc, fmtDateNo } from "../lib/dom.js";
import { homeHeader } from "./nav.js";
import { NEWS } from "../data/news.js";

const TYPE_LABEL = { nyhet: "Nyhet", endring: "Endring" };

function newsItem(n) {
  const body = n.points
    ? `<ul class="news-points">${n.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`
    : n.body
      ? `<p class="news-body">${esc(n.body)}</p>`
      : "";
  return `
    <li class="news-item">
      <div class="news-meta">
        <span class="news-type news-type-${esc(n.type)}">${esc(TYPE_LABEL[n.type] || n.type)}</span>
        <time class="news-date">${esc(fmtDateNo(n.date))}</time>
      </div>
      <h3 class="news-head">${esc(n.title)}</h3>
      ${body}
    </li>`;
}

// Nyhetsfelt øverst på forsiden. Nyeste dato først.
// `newsItems` kommer fra Firestore (via main.js); faller tilbake til bundlet NEWS.
function newsBlock(newsItems) {
  const list = newsItems && newsItems.length ? newsItems : NEWS;
  if (!list.length) return "";
  const items = [...list]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map(newsItem)
    .join("");
  return `
    <section class="news" aria-label="Oppdateringer">
      <h2 class="news-title">Oppdateringer</h2>
      <ul class="news-list">${items}</ul>
    </section>`;
}

const IW = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';

// Fliser: rekkefølgen her styrer rekkefølgen på forsiden.
const TILES = [
  {
    href: "#/meny",
    title: "Meny",
    sub: "Retter, priser og allergener",
    color: "var(--coral)",
    icon: `<svg ${IW}><path d="M4 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3"/><path d="M6 12v9"/><path d="M18 15V3a4 4 0 0 0-4 4v5a2 2 0 0 0 2 2h2zm0 0v6"/></svg>`,
  },
  {
    href: "#/ravarer",
    title: "Råvarer",
    sub: "Hvor brukes hva",
    color: "var(--camel)",
    icon: `<svg ${IW}><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>`,
  },
  {
    href: "#/prep",
    title: "Preppeliste",
    sub: "Planlegg uka",
    color: "var(--green)",
    icon: `<svg ${IW}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M8.5 13l2 2 4-4"/></svg>`,
  },
  {
    href: "#/handleliste",
    title: "Handleliste",
    sub: "Summer råvarer",
    color: "var(--coral-deep)",
    icon: `<svg ${IW}><path d="M4 8h16l-1.4 11.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8z"/><path d="M9 8 12 3l3 5"/><path d="M9.5 12v4"/><path d="M14.5 12v4"/></svg>`,
  },
  {
    href: "#/guide",
    title: "Glutenfri",
    sub: "Guide og rutiner",
    color: "var(--green-deep)",
    icon: `<svg ${IW}><path d="M12 21V8"/><path d="M12 13c-3 0-4.2-2-4.2-4.2 2.2 0 4.2 1 4.2 4.2z"/><path d="M12 13c3 0 4.2-2 4.2-4.2-2.2 0-4.2 1-4.2 4.2z"/><path d="M12 8.5c-3 0-4.2-2-4.2-4.2 2.2 0 4.2 1 4.2 4.2z"/><path d="M12 8.5c3 0 4.2-2 4.2-4.2-2.2 0-4.2 1-4.2 4.2z"/><path d="M4.5 4.5l15 15"/></svg>`,
  },
  {
    href: "#/arkiv",
    title: "Arkiv",
    sub: "Manualer (PDF)",
    color: "var(--ink)",
    icon: `<svg ${IW}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>`,
  },
];

function tile(t) {
  return `
    <a class="tile" href="${t.href}">
      <span class="tile-ic" style="background:${t.color}">${t.icon}</span>
      <span class="tile-title">${esc(t.title)}</span>
      <span class="tile-sub">${esc(t.sub)}</span>
    </a>`;
}

export function renderForside(quickAccess = "", newsItems = null) {
  return `
    ${homeHeader()}
    <main class="wrap">
      ${newsBlock(newsItems)}
      ${quickAccess}
      <p class="forside-lead">Kjøkkenmanual for Jordbærpikene. Velg hva du vil se.</p>
      <div class="tiles">${TILES.map(tile).join("")}</div>
      <footer class="forside-foot"><a href="#/changelog">Endringslogg</a><span class="foot-sep">·</span><a href="#/admin">Admin</a></footer>
    </main>`;
}
