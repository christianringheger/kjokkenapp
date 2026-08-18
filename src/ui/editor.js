// Admin-editor: full strukturert redigering av retter, oppskrifter og prep.
// Kun tilgjengelig bak innlogging (rendres inne i adminpanelet). Skriver til
// Firestore via lib/firestore-admin.js. Offentlig visning oppdateres ved reload.
import { esc } from "../lib/dom.js";
import { CATEGORIES, ALLERGEN_NAME, TAG_NAME } from "../data/labels.js";
import { fetchList, fetchDoc, saveDoc } from "../lib/firestore-admin.js";
import { cleanForSave } from "../lib/editor-serialize.js";
import { uploadImage } from "../lib/storage-admin.js";
import { validateImageFile } from "../lib/upload-validate.js";

export { cleanForSave };

const COLLECTIONS = [
  ["dishes", "Retter"],
  ["recipes", "Oppskrifter"],
  ["prepitems", "Prep"],
];

// Kjente valg for felt uten fast enum (nye verdier tillates via datalist).
const RECIPE_CATS = ["grønt", "kake", "prepp", "brod"];
const PREP_SECS = [
  "Forberedelse bong",
  "Produksjon",
  "Baking",
  "Ta ut (tin/hent frem)",
  "Huskeliste (ha klart)",
];
const ALLERGEN_KEYS = Object.keys(ALLERGEN_NAME);

/* ---------------- Path-hjelpere for draft-binding ---------------- */

function getByPath(root, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), root);
}
function setByPath(root, path, value) {
  const parts = path.split(".");
  let o = root;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = value;
}

/* ---------------- Felt-primitiver (HTML) ---------------- */

const idAttr = (p) => `data-path="${esc(p)}"`;

function fText(path, label, val, type = "text") {
  return `<label class="ed-field"><span class="ed-lbl">${esc(label)}</span>
    <input class="ed-input" type="${type}" ${idAttr(path)} value="${esc(val ?? "")}" /></label>`;
}
function fNum(path, label, val) {
  return `<label class="ed-field"><span class="ed-lbl">${esc(label)}</span>
    <input class="ed-input" type="number" step="any" ${idAttr(path)} value="${val ?? ""}" /></label>`;
}
function fBool(path, label, val) {
  return `<label class="ed-check"><input type="checkbox" ${idAttr(path)} ${val ? "checked" : ""} /> <span>${esc(label)}</span></label>`;
}
function fArea(path, label, val) {
  return `<label class="ed-field"><span class="ed-lbl">${esc(label)}</span>
    <textarea class="ed-input ed-area" ${idAttr(path)} rows="3">${esc(val ?? "")}</textarea></label>`;
}
function fSelect(path, label, val, options) {
  const opts = options
    .map(([v, t]) => `<option value="${esc(v)}"${v === (val ?? "") ? " selected" : ""}>${esc(t)}</option>`)
    .join("");
  return `<label class="ed-field"><span class="ed-lbl">${esc(label)}</span>
    <select class="ed-input" ${idAttr(path)}>${opts}</select></label>`;
}
function fDatalist(path, label, val, values, listId) {
  const opts = values.map((v) => `<option value="${esc(v)}"></option>`).join("");
  return `<label class="ed-field"><span class="ed-lbl">${esc(label)}</span>
    <input class="ed-input" ${idAttr(path)} list="${listId}" value="${esc(val ?? "")}" />
    <datalist id="${listId}">${opts}</datalist></label>`;
}

// Bilde-felt: forhåndsvisning + opplasting (Firebase Storage) + redigerbar URL.
function imageField(val) {
  const preview = val
    ? `<div class="ed-imgprev"><img src="${esc(val)}" alt="" /></div>`
    : `<div class="ed-imgprev ed-imgprev-empty">Ingen bilde</div>`;
  return `<fieldset class="ed-list ed-imgfield"><legend>Bilde</legend>
    ${preview}
    <div class="ed-imgrow">
      <input type="file" accept="image/*" class="ed-file" data-upload="image" />
      ${val ? `<button type="button" class="ed-imgrm" data-action="rmimg">Fjern bilde</button>` : ""}
    </div>
    <label class="ed-field"><span class="ed-lbl">Bilde-URL</span>
      <input class="ed-input" data-path="image" value="${esc(val ?? "")}" /></label>
    <p class="ed-imgstatus" id="edImgStatus"></p>
    <p class="ed-hint">Last opp rett fra mobilen — store bilder krympes og komprimeres automatisk (maks ~1600 px) før opplasting, så appen holder seg lett. URL-en fylles inn automatisk.</p>
  </fieldset>`;
}

// Allergen-velger: chips som toggles. `path` peker på array-feltet (all / comp.N.a).
function allergenPicker(path, selected = []) {
  const chips = ALLERGEN_KEYS.map((k) => {
    const on = selected.includes(k);
    return `<button type="button" class="ed-al${on ? " on" : ""}" data-action="al" data-path="${esc(path)}" data-key="${k}" aria-pressed="${on}">${esc(ALLERGEN_NAME[k])}</button>`;
  }).join("");
  return `<div class="ed-alrow">${chips}</div>`;
}

// Verktøyknapper for en array-rad (opp/ned/slett).
function rowTools(path, idx) {
  return `<div class="ed-rowtools">
    <button type="button" data-action="up" data-path="${esc(path)}" data-idx="${idx}" title="Flytt opp">↑</button>
    <button type="button" data-action="down" data-path="${esc(path)}" data-idx="${idx}" title="Flytt ned">↓</button>
    <button type="button" data-action="del" data-path="${esc(path)}" data-idx="${idx}" title="Slett">✕</button>
  </div>`;
}
function addBtn(path, kind, label) {
  return `<button type="button" class="ed-add" data-action="add" data-path="${esc(path)}" data-kind="${kind}">+ ${esc(label)}</button>`;
}

// Liste av frie tekstlinjer (steps / layers).
function stringListEditor(path, label, arr = []) {
  const rows = arr
    .map(
      (s, i) => `<div class="ed-row">
        <input class="ed-input" data-path="${esc(path)}.${i}" value="${esc(s)}" />
        ${rowTools(path, i)}
      </div>`
    )
    .join("");
  return `<fieldset class="ed-list"><legend>${esc(label)}</legend>${rows}${addBtn(path, "string", "Legg til linje")}</fieldset>`;
}

// Komponentliste (dish.comp): navn + valgfri oppskrift-id + allergener.
function compListEditor(path, arr = []) {
  const rows = arr
    .map(
      (c, i) => `<div class="ed-card">
        <div class="ed-row">
          <input class="ed-input" placeholder="Navn" data-path="${esc(path)}.${i}.n" value="${esc(c.n ?? "")}" />
          <input class="ed-input ed-rid" placeholder="oppskrift-id (rid)" data-path="${esc(path)}.${i}.rid" value="${esc(c.rid ?? "")}" />
          ${rowTools(path, i)}
        </div>
        ${allergenPicker(`${path}.${i}.a`, c.a || [])}
      </div>`
    )
    .join("");
  return `<fieldset class="ed-list"><legend>Komponenter</legend>${rows}${addBtn(path, "comp", "Legg til komponent")}</fieldset>`;
}

// Mengdeliste med rid (build.ing).
function buildIngEditor(path, arr = []) {
  const rows = arr
    .map(
      (r, i) => `<div class="ed-row ed-ing">
        <input class="ed-input ed-amt" type="number" step="any" placeholder="mengde" data-path="${esc(path)}.${i}.amt" value="${r.amt ?? ""}" />
        <input class="ed-input ed-unit" placeholder="enhet" data-path="${esc(path)}.${i}.unit" value="${esc(r.unit ?? "")}" />
        <input class="ed-input" placeholder="navn" data-path="${esc(path)}.${i}.name" value="${esc(r.name ?? "")}" />
        <input class="ed-input ed-rid" placeholder="rid" data-path="${esc(path)}.${i}.rid" value="${esc(r.rid ?? "")}" />
        ${rowTools(path, i)}
      </div>`
    )
    .join("");
  return `<fieldset class="ed-list"><legend>Oppbygging (mengder)</legend>${rows}${addBtn(path, "building", "Legg til rad")}</fieldset>`;
}

// Mengdeliste uten rid (recipe.ing).
function recipeIngEditor(path, arr = []) {
  const rows = arr
    .map(
      (r, i) => `<div class="ed-row ed-ing">
        <input class="ed-input ed-amt" type="number" step="any" placeholder="mengde" data-path="${esc(path)}.${i}.amt" value="${r.amt ?? ""}" />
        <input class="ed-input ed-unit" placeholder="enhet" data-path="${esc(path)}.${i}.unit" value="${esc(r.unit ?? "")}" />
        <input class="ed-input" placeholder="navn" data-path="${esc(path)}.${i}.name" value="${esc(r.name ?? "")}" />
        ${rowTools(path, i)}
      </div>`
    )
    .join("");
  return `<fieldset class="ed-list"><legend>Ingredienser</legend>${rows}${addBtn(path, "ing", "Legg til rad")}</fieldset>`;
}

/* ---------------- Skjema pr. samling ---------------- */

function dishForm(d) {
  const catOpts = CATEGORIES.slice();
  const stationOpts = [["", "— ingen —"], ["bong", "Bong"], ["disk", "Disk"]];
  const tagOpts = [["", "— ingen —"], ...Object.entries(TAG_NAME)];
  d.build = d.build || {};
  const review = `<div class="ed-review">
      ${fBool("alReview", "Allergener uavklart (venter på Matfaglig)", d.alReview)}
      ${d.alReview ? fText("alReviewNote", "Notat om uavklaring", d.alReviewNote) : ""}
    </div>`;
  return `
    ${fText("name", "Navn", d.name)}
    <div class="ed-grid">
      ${fNum("price", "Pris (kr)", d.price)}
      ${fSelect("cat", "Kategori", d.cat, catOpts)}
      ${fSelect("station", "Stasjon", d.station || "", stationOpts)}
      ${fSelect("tag", "Merke", d.tag || "", tagOpts)}
    </div>
    ${fBool("gf", "Glutenfri", d.gf)}
    <fieldset class="ed-list"><legend>Allergener</legend>${allergenPicker("all", d.all || [])}</fieldset>
    ${review}
    ${compListEditor("comp", d.comp || [])}
    ${buildIngEditor("build.ing", d.build.ing || [])}
    ${stringListEditor("build.steps", "Fremgangsmåte", d.build.steps || [])}
    ${stringListEditor("build.layers", "Lagdeling", d.build.layers || [])}
    ${fArea("build.pres", "Servering", d.build.pres)}
    ${fText("ownprep", "Egen prep (rid)", d.ownprep)}
    ${fText("video", "Video-URL", d.video)}
    ${imageField(d.image)}`;
}

function recipeForm(r) {
  const catOpts = [["", "— velg —"], ...RECIPE_CATS.map((c) => [c, c])];
  return `
    ${fText("title", "Tittel", r.title)}
    <div class="ed-grid">
      ${fSelect("cat", "Kategori", r.cat || "", catOpts)}
      ${fNum("yield", "Mengde", r.yield)}
      ${fText("yieldunit", "Mengde-enhet", r.yieldunit)}
      ${fText("hold", "Holdbarhet", r.hold)}
    </div>
    ${fBool("freeze", "Kan fryses", r.freeze)}
    ${recipeIngEditor("ing", r.ing || [])}
    ${stringListEditor("steps", "Fremgangsmåte", r.steps || [])}
    ${fText("video", "Video-URL", r.video)}
    ${imageField(r.image)}`;
}

function prepForm(p) {
  return `
    ${fText("name", "Navn", p.name)}
    ${fDatalist("sec", "Seksjon", p.sec, PREP_SECS, "prepSecs")}
    ${fText("hold", "Holdbarhet", p.hold)}
    ${fText("link", "Lenke (valgfri)", p.link)}`;
}

function renderForm(col, item) {
  if (col === "dishes") return dishForm(item);
  if (col === "recipes") return recipeForm(item);
  return prepForm(item);
}

function itemLabel(col, it) {
  if (col === "recipes") return it.title || it._id;
  return it.name || it._id;
}

/* ---------------- Editor-panel (tilstand + hendelser) ---------------- */

export function renderEditorPanel(host) {
  const state = { col: "dishes", list: [], q: "", draft: null, msg: "" };

  const paintTabs = () =>
    COLLECTIONS.map(
      ([c, t]) =>
        `<button type="button" class="ed-tab${c === state.col ? " on" : ""}" data-col="${c}">${esc(t)}</button>`
    ).join("");

  async function loadList() {
    host.innerHTML = `<div class="ed-tabs">${paintTabs()}</div><p class="lead">Laster …</p>`;
    wireTabs();
    try {
      state.list = await fetchList(state.col);
    } catch (e) {
      host.innerHTML = `<div class="ed-tabs">${paintTabs()}</div><p class="admin-err">Kunne ikke laste: ${esc(e.message || e)}</p>`;
      wireTabs();
      return;
    }
    paintList();
  }

  function paintList() {
    const q = state.q.toLowerCase();
    const rows = state.list
      .filter((it) => !q || itemLabel(state.col, it).toLowerCase().includes(q) || it._id.toLowerCase().includes(q))
      .map(
        (it) =>
          `<li><button type="button" class="ed-listbtn" data-edit="${esc(it._id)}"><span class="ed-listname">${esc(itemLabel(state.col, it))}</span><span class="ed-listid">${esc(it._id)}</span></button></li>`
      )
      .join("");
    host.innerHTML = `
      <div class="ed-tabs">${paintTabs()}</div>
      ${state.msg ? `<p class="ed-msg">${esc(state.msg)}</p>` : ""}
      <input id="edSearch" class="ed-input ed-search" placeholder="Søk i ${esc(state.col)} …" value="${esc(state.q)}" />
      <p class="ed-count">${state.list.length} elementer</p>
      <ul class="ed-listing">${rows}</ul>`;
    state.msg = "";
    wireTabs();
    const search = host.querySelector("#edSearch");
    search.addEventListener("input", () => {
      state.q = search.value;
      const ul = host.querySelector(".ed-listing");
      const qq = state.q.toLowerCase();
      ul.innerHTML = state.list
        .filter((it) => !qq || itemLabel(state.col, it).toLowerCase().includes(qq) || it._id.toLowerCase().includes(qq))
        .map(
          (it) =>
            `<li><button type="button" class="ed-listbtn" data-edit="${esc(it._id)}"><span class="ed-listname">${esc(itemLabel(state.col, it))}</span><span class="ed-listid">${esc(it._id)}</span></button></li>`
        )
        .join("");
    });
    host.querySelector(".ed-listing").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-edit]");
      if (btn) openForm(btn.dataset.edit);
    });
  }

  async function openForm(id) {
    host.innerHTML = `<p class="lead">Laster element …</p>`;
    let item;
    try {
      item = await fetchDoc(state.col, id);
    } catch (e) {
      host.innerHTML = `<p class="admin-err">Kunne ikke hente: ${esc(e.message || e)}</p>`;
      return;
    }
    if (!item) {
      host.innerHTML = `<p class="admin-err">Fant ikke elementet.</p>`;
      return;
    }
    state.draft = item;
    paintForm();
  }

  function paintForm() {
    const col = state.col;
    host.innerHTML = `
      <div class="ed-formhead">
        <button type="button" class="admin-btn admin-btn-ghost" id="edBack">‹ Tilbake</button>
        <span class="ed-editing">Redigerer <strong>${esc(state.draft._id)}</strong></span>
      </div>
      <form id="edForm" class="ed-form">${renderForm(col, state.draft)}</form>
      <div class="ed-actions">
        <button type="button" class="admin-btn" id="edSave">Lagre</button>
        <button type="button" class="admin-btn admin-btn-ghost" id="edCancel">Avbryt</button>
        <span id="edStatus" class="ed-status"></span>
      </div>`;

    host.querySelector("#edBack").addEventListener("click", () => loadList());
    host.querySelector("#edCancel").addEventListener("click", () => loadList());
    host.querySelector("#edSave").addEventListener("click", onSave);

    const form = host.querySelector("#edForm");
    // Skalare felt: oppdater draft uten å tegne på nytt (beholder fokus).
    form.addEventListener("input", (e) => {
      const el = e.target;
      if (!el.dataset.path) return;
      const val = el.type === "checkbox" ? el.checked : el.value;
      setByPath(state.draft, el.dataset.path, val);
    });
    form.addEventListener("change", (e) => {
      const el = e.target;
      if (el.dataset.upload === "image") {
        handleUpload(el);
        return;
      }
      if (el.dataset.path && (el.tagName === "SELECT" || el.type === "checkbox")) {
        const val = el.type === "checkbox" ? el.checked : el.value;
        setByPath(state.draft, el.dataset.path, val);
        // alReview styrer om notat-feltet vises → tegn skjema på nytt.
        if (el.dataset.path === "alReview") paintForm();
      }
    });
    // Array-handlinger + allergen-toggles: muter draft og tegn skjema på nytt.
    form.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, path, idx, kind, key } = btn.dataset;
      if (action === "rmimg") {
        setByPath(state.draft, "image", "");
        paintForm();
        return;
      }
      if (action === "al") {
        const arr = getByPath(state.draft, path) || [];
        const i = arr.indexOf(key);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(key);
        setByPath(state.draft, path, arr);
      } else {
        const arr = getByPath(state.draft, path);
        if (!Array.isArray(arr)) return;
        const j = Number(idx);
        if (action === "add") arr.push(newRow(kind));
        else if (action === "del") arr.splice(j, 1);
        else if (action === "up" && j > 0) arr.splice(j - 1, 0, arr.splice(j, 1)[0]);
        else if (action === "down" && j < arr.length - 1) arr.splice(j + 1, 0, arr.splice(j, 1)[0]);
      }
      paintForm();
    });
  }

  async function handleUpload(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const status = host.querySelector("#edImgStatus");
    const preErr = validateImageFile(file);
    if (preErr) {
      if (status) status.textContent = preErr;
      input.value = "";
      return;
    }
    if (status) status.textContent = "Laster opp … 0 %";
    try {
      const url = await uploadImage(
        `${state.col}/${state.draft._id}`,
        file,
        (p) => {
          if (status) status.textContent = `Laster opp … ${p} %`;
        }
      );
      setByPath(state.draft, "image", url);
      paintForm();
    } catch (e) {
      if (status) status.textContent = "Opplasting feilet: " + (e.message || e);
    }
  }

  async function onSave() {
    const status = host.querySelector("#edStatus");
    const saveBtn = host.querySelector("#edSave");
    saveBtn.disabled = true;
    status.textContent = "Lagrer …";
    try {
      const payload = cleanForSave(state.col, state.draft);
      await saveDoc(state.col, state.draft._id, payload);
      state.msg = `Lagret «${itemLabel(state.col, payload)}» (${state.draft._id}). Last appen på nytt for å se endringen i menyen.`;
      await loadList();
    } catch (e) {
      status.textContent = "Feil: " + (e.message || e);
      saveBtn.disabled = false;
    }
  }

  function wireTabs() {
    host.querySelectorAll(".ed-tab").forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.col === state.col) return;
        state.col = b.dataset.col;
        state.q = "";
        state.draft = null;
        loadList();
      })
    );
  }

  loadList();
}

// Standardrad for en ny array-oppføring.
function newRow(kind) {
  if (kind === "string") return "";
  if (kind === "comp") return { n: "", a: [] };
  if (kind === "building") return { amt: "", unit: "g", name: "" };
  if (kind === "ing") return { amt: "", unit: "g", name: "" };
  return "";
}
