// Detaljvisning for én rett og for én oppskrift.
import { TAG_NAME, CATEGORY_NAME } from "../data/labels.js";
import { esc, amount, fmtDateNo } from "../lib/dom.js";
import { allergenChips, allergenIcons } from "../lib/allergens.js";
import { mediaBlock } from "../lib/media.js";
import { isFav } from "../lib/favorites.js";
import { detailHeader } from "./nav.js";

const STAR = `<svg class="star-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.4l2.7 5.4 6 .9-4.35 4.2 1.03 5.9L12 17l-5.38 2.8 1.03-5.9L3.3 9.7l6-.9z"/></svg>`;

// Favoritt-stjerne. `ref` = "dish:<id>" | "recipe:<id>".
function favBtn(ref) {
  const on = isFav(ref);
  return `<button type="button" class="fav-btn${on ? " on" : ""}" data-fav="${esc(ref)}" aria-pressed="${on}" aria-label="Lagre som favoritt" title="Lagre som favoritt">${STAR}</button>`;
}

// En ingrediens-/komponentlinje. Har den en rid, blir navnet en lenke til oppskriften.
function ingredientLine(item, kind) {
  const name = esc(item.name || item.n || "");
  const label = item.rid
    ? `<a class="rlink" href="#/recipe/${esc(item.rid)}">${name}</a>`
    : name;
  const qty =
    kind === "amount"
      ? `<span class="qty" data-amt="${item.amt ?? ""}" data-unit="${esc(item.unit || "")}">${amount(item)}</span>`
      : "";
  const all = allergenIcons(item.a);
  return `<li>${qty}<span class="iname">${label}</span>${all}</li>`;
}

// Skaler-kontroll for mengdelister (× antall). Gjelder mengdene i samme seksjon.
function scaler() {
  return `<div class="scaler" data-scaler>
    <span class="scaler-lbl">Skaler</span>
    <button type="button" class="scaler-btn" data-scale-step="-1" aria-label="Færre">−</button>
    <span class="scaler-x">×</span>
    <input class="scaler-input" type="number" min="1" step="1" value="1" data-scale-input aria-label="Antall ganger oppskrift" />
    <button type="button" class="scaler-btn" data-scale-step="1" aria-label="Flere">+</button>
  </div>`;
}

function stepsList(steps = []) {
  if (!steps.length) return "";
  return `<ol class="steps">${steps
    .map((s) => `<li>${esc(s)}</li>`)
    .join("")}</ol>`;
}

const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>`;

// Fremgangsmåte som avkryssbar sjekkliste + «Nullstill». Avkryssing er
// midlertidig (nullstilles ved nullstill-knapp eller når man forlater siden).
function checklist(steps = []) {
  if (!steps.length) return "";
  const items = steps
    .map(
      (s) =>
        `<li data-ck><span class="ck-box">${CHECK}</span><span class="ck-tx">${esc(s)}</span></li>`
    )
    .join("");
  return `<ol class="steps steps-check">${items}</ol><button type="button" class="ckreset" data-ckreset>Nullstill sjekkliste</button>`;
}

/* ---------- RETT ---------- */
export function renderDishDetail(d) {
  if (!d) return notFound("Fant ikke retten.");

  const price = d.price ? `<span class="price">${esc(d.price)},-</span>` : "";
  const gf = d.gf
    ? `<span class="badge badge-gf"><span class="check">✓</span> Glutenfri</span>`
    : "";
  const tag = d.tag
    ? `<span class="badge badge-tag">${esc(TAG_NAME[d.tag] || d.tag)}</span>`
    : "";
  const cat = d.cat
    ? `<p class="detail-cat">${esc(CATEGORY_NAME[d.cat] || d.cat)}</p>`
    : "";

  const comp = (d.comp || d.ing || []);
  const compSection = comp.length
    ? section(
        "Komponenter",
        `<ul class="inglist">${comp.map((c) => ingredientLine(c, "plain")).join("")}</ul>`
      )
    : "";

  const b = d.build || {};
  const buildIng = (b.ing || []).length
    ? section(
        "Oppbygging",
        `${scaler()}<ul class="inglist">${b.ing.map((c) => ingredientLine(c, "amount")).join("")}</ul>`
      )
    : "";
  const buildSteps = (b.steps || []).length
    ? section("Fremgangsmåte", checklist(b.steps))
    : "";
  const layers = (b.layers || []).length
    ? section("Lagdeling", stepsList(b.layers))
    : "";
  const pres = b.pres
    ? section("Servering", `<p class="pres">${esc(b.pres)}</p>`)
    : "";

  const reviewBanner = d.alReview
    ? `<div class="review-banner"><strong>⚠ Ikke bekreftet.</strong> ${esc(
        d.alReviewNote || "Allergener under avklaring."
      )}. Sjekk alltid med gjest ved allergi.</div>`
    : "";
  const allergens =
    (d.all || []).length || d.alReview
      ? section(
          "Allergener",
          `${reviewBanner}${(d.all || []).length ? allergenChips(d.all) : ""}`
        )
      : "";

  return `
    ${detailHeader()}
    <main class="wrap detail">
      ${mediaBlock(d)}
      <header class="detail-head">
        <div class="detail-title">
          <h1>${esc(d.name)}</h1>
          <div class="detail-title-actions">${price}${favBtn(`dish:${d.id}`)}</div>
        </div>
        ${cat}
        <div class="badges">${tag}${gf}</div>
      </header>
      ${buildIng}
      ${buildSteps}
      ${allergens}
      ${compSection}
      ${layers}
      ${pres}
      ${reportSection(`dish:${d.id}`, d.name)}
      ${updatedLine(d)}
    </main>`;
}

/* ---------- OPPSKRIFT ---------- */
export function renderRecipeDetail(r) {
  if (!r) return notFound("Fant ikke oppskriften.");

  const meta = [];
  if (r.yield) meta.push(`Mengde: ${esc(r.yield)}${r.yieldunit ? " " + esc(r.yieldunit) : ""}`);
  if (r.hold) meta.push(`Holdbarhet: ${esc(r.hold)}`);
  if (r.freeze) meta.push("Kan fryses");
  const metaHtml = meta.length
    ? `<ul class="metalist">${meta.map((m) => `<li>${m}</li>`).join("")}</ul>`
    : "";

  const ing = (r.ing || []).length
    ? section(
        "Ingredienser",
        `${scaler()}<ul class="inglist">${r.ing.map((c) => ingredientLine(c, "amount")).join("")}</ul>`
      )
    : "";
  const steps = (r.steps || []).length
    ? section("Fremgangsmåte", checklist(r.steps))
    : "";

  const usedBy = (r.usedBy || []).length
    ? section(
        "Brukes i",
        `<ul class="usedby">${r.usedBy
          .map(({ id, title }) => `<li><a class="rlink" href="#/dish/${esc(id)}">${esc(title)}</a></li>`)
          .join("")}</ul>`
      )
    : "";

  return `
    ${detailHeader()}
    <main class="wrap detail">
      ${mediaBlock(r)}
      <header class="detail-head">
        <p class="detail-cat">Oppskrift</p>
        <div class="detail-title">
          <h1>${esc(r.title)}</h1>
          <div class="detail-title-actions">${favBtn(`recipe:${r.id}`)}</div>
        </div>
        ${metaHtml}
      </header>
      ${ing}
      ${steps}
      ${usedBy}
      ${reportSection(`recipe:${r.id}`, r.title)}
      ${updatedLine(r)}
    </main>`;
}

/* ---------- felles ---------- */
function section(title, body) {
  return `<section class="dsec"><h2 class="dsec-title">${esc(title)}</h2>${body}</section>`;
}

// Dempet «Sist oppdatert»-linje nederst (vises kun når `_updated` finnes).
function updatedLine(item) {
  const d = fmtDateNo(item && item._updated);
  return d ? `<p class="detail-updated">Sist oppdatert ${esc(d)}</p>` : "";
}

// «Meld feil»: sammenleggbart skjema som sender til kjedekontoret (reports.js).
function reportSection(ref, title) {
  return `
    <section class="dsec report">
      <button type="button" class="report-toggle" data-report-toggle>Meld feil eller forslag</button>
      <form class="report-form" data-report-form hidden data-ref="${esc(ref)}" data-title="${esc(title)}">
        <textarea class="ed-input ed-area" data-report-msg rows="3" maxlength="1500" placeholder="Beskriv feilen eller forslaget …"></textarea>
        <input class="ed-input" data-report-name maxlength="120" placeholder="Ditt navn (valgfritt)" />
        <div class="report-actions">
          <button type="button" class="admin-btn" data-report-send>Send til kjedekontoret</button>
          <span class="report-status" data-report-status></span>
        </div>
      </form>
    </section>`;
}

function notFound(msg) {
  return `${detailHeader()}<main class="wrap detail"><p>${esc(msg)}</p></main>`;
}
