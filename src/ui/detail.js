// Detaljvisning for én rett og for én oppskrift.
import { TAG_NAME, CATEGORY_NAME } from "../data/labels.js";
import { esc, amount } from "../lib/dom.js";
import { allergenChips, allergenIcons } from "../lib/allergens.js";
import { mediaBlock } from "../lib/media.js";
import { detailHeader } from "./nav.js";

// En ingrediens-/komponentlinje. Har den en rid, blir navnet en lenke til oppskriften.
function ingredientLine(item, kind) {
  const name = esc(item.name || item.n || "");
  const label = item.rid
    ? `<a class="rlink" href="#/recipe/${esc(item.rid)}">${name}</a>`
    : name;
  const qty = kind === "amount" ? `<span class="qty">${amount(item)}</span>` : "";
  const all = allergenIcons(item.a);
  return `<li>${qty}<span class="iname">${label}</span>${all}</li>`;
}

function stepsList(steps = []) {
  if (!steps.length) return "";
  return `<ol class="steps">${steps
    .map((s) => `<li>${esc(s)}</li>`)
    .join("")}</ol>`;
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
        `<ul class="inglist">${b.ing.map((c) => ingredientLine(c, "amount")).join("")}</ul>`
      )
    : "";
  const buildSteps = (b.steps || []).length
    ? section("Fremgangsmåte", stepsList(b.steps))
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
          ${price}
        </div>
        ${cat}
        <div class="badges">${tag}${gf}</div>
      </header>
      ${allergens}
      ${compSection}
      ${buildIng}
      ${buildSteps}
      ${layers}
      ${pres}
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
        `<ul class="inglist">${r.ing.map((c) => ingredientLine(c, "amount")).join("")}</ul>`
      )
    : "";
  const steps = (r.steps || []).length
    ? section("Fremgangsmåte", stepsList(r.steps))
    : "";

  const usedBy = (r.usedBy || []).length
    ? section(
        "Brukes i",
        `<ul class="usedby">${r.usedBy
          .map(([id, name]) => `<li><a class="rlink" href="#/dish/${esc(id)}">${esc(name)}</a></li>`)
          .join("")}</ul>`
      )
    : "";

  return `
    ${detailHeader()}
    <main class="wrap detail">
      ${mediaBlock(r)}
      <header class="detail-head">
        <p class="detail-cat">Oppskrift</p>
        <h1>${esc(r.title)}</h1>
        ${metaHtml}
      </header>
      ${ing}
      ${steps}
      ${usedBy}
    </main>`;
}

/* ---------- felles ---------- */
function section(title, body) {
  return `<section class="dsec"><h2 class="dsec-title">${esc(title)}</h2>${body}</section>`;
}

function notFound(msg) {
  return `${detailHeader()}<main class="wrap detail"><p>${esc(msg)}</p></main>`;
}
