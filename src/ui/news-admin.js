// Admin-panel for forsidens nyheter (Firestore-samlingen `news`).
// Liste + legg til / rediger / slett + importer forhåndslagde. Gjenbruker .ed-*-stiler.
import { esc } from "../lib/dom.js";
import { NEWS } from "../data/news.js";
import {
  fetchList,
  saveDoc,
  addDocTo,
  deleteDocById,
} from "../lib/firestore-admin.js";

const TYPES = [
  ["nyhet", "Nyhet"],
  ["endring", "Endring"],
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function renderNewsAdmin(host) {
  const state = { list: [], draft: null, msg: "" };

  async function load() {
    host.innerHTML = `<p class="lead">Laster nyheter …</p>`;
    try {
      state.list = await fetchList("news", "date", "desc");
    } catch (e) {
      host.innerHTML = `<p class="admin-err">Kunne ikke laste nyheter. Er de nye Firestore-reglene publisert (news-samlingen)?<br><span class="na-empty">${esc(e.message || e)}</span></p>`;
      return;
    }
    paintList();
  }

  function itemRow(n) {
    const label = (TYPES.find((t) => t[0] === n.type) || [])[1] || n.type || "";
    return `<li class="na-item">
      <div class="na-item-main">
        <span class="news-type news-type-${esc(n.type || "nyhet")}">${esc(label)}</span>
        <span class="na-item-date">${esc(n.date || "")}</span>
        <span class="na-item-title">${esc(n.title || "")}</span>
      </div>
      <div class="na-item-tools">
        <button type="button" class="ed-add" data-edit="${esc(n._id)}">Rediger</button>
        <button type="button" class="na-del" data-del="${esc(n._id)}">Slett</button>
      </div>
    </li>`;
  }

  function paintList() {
    const rows = state.list.length
      ? state.list.map(itemRow).join("")
      : `<li class="na-empty">Ingen nyheter i Firestore ennå.${NEWS.length ? " Du kan importere de forhåndslagde." : ""}</li>`;
    host.innerHTML = `
      ${state.msg ? `<p class="ed-msg">${esc(state.msg)}</p>` : ""}
      <div class="na-actions">
        <button type="button" class="admin-btn" id="naAdd">+ Legg til nyhet</button>
        ${!state.list.length && NEWS.length ? `<button type="button" class="admin-btn admin-btn-ghost" id="naSeed">Importer forhåndslagde</button>` : ""}
      </div>
      <ul class="na-list">${rows}</ul>`;
    state.msg = "";
    host.querySelector("#naAdd").addEventListener("click", () => openForm(null));
    const seedBtn = host.querySelector("#naSeed");
    if (seedBtn) seedBtn.addEventListener("click", onSeed);
    host.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(b.dataset.edit))
    );
    host.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => onDelete(b.dataset.del))
    );
  }

  function blank() {
    return { type: "nyhet", date: today(), title: "", body: "", points: [] };
  }

  function openForm(id) {
    const found = id && state.list.find((x) => x._id === id);
    state.draft = found ? JSON.parse(JSON.stringify(found)) : blank();
    if (!Array.isArray(state.draft.points)) state.draft.points = [];
    if (typeof state.draft.body !== "string") state.draft.body = "";
    paintForm();
  }

  function paintForm() {
    const d = state.draft;
    const isNew = !d._id;
    const typeOpts = TYPES.map(
      ([v, t]) => `<option value="${v}"${v === d.type ? " selected" : ""}>${t}</option>`
    ).join("");
    const pts = d.points
      .map(
        (p, i) => `<div class="ed-row">
          <input class="ed-input" data-pt="${i}" value="${esc(p)}" />
          <button type="button" class="na-del" data-ptdel="${i}">✕</button>
        </div>`
      )
      .join("");
    host.innerHTML = `
      <div class="ed-formhead">
        <button type="button" class="admin-btn admin-btn-ghost" id="naBack">‹ Tilbake</button>
        <span class="ed-editing">${isNew ? "Ny nyhet" : "Redigerer nyhet"}</span>
      </div>
      <form id="naForm" class="ed-form">
        <div class="ed-grid">
          <label class="ed-field"><span class="ed-lbl">Type</span>
            <select class="ed-input" data-f="type">${typeOpts}</select></label>
          <label class="ed-field"><span class="ed-lbl">Dato</span>
            <input class="ed-input" type="date" data-f="date" value="${esc(d.date)}" /></label>
        </div>
        <label class="ed-field"><span class="ed-lbl">Tittel</span>
          <input class="ed-input" data-f="title" value="${esc(d.title)}" /></label>
        <label class="ed-field"><span class="ed-lbl">Tekst (bruk enten tekst eller punkter under)</span>
          <textarea class="ed-input ed-area" data-f="body" rows="3">${esc(d.body)}</textarea></label>
        <fieldset class="ed-list"><legend>Punkter</legend>${pts}<button type="button" class="ed-add" data-ptadd>+ Legg til punkt</button></fieldset>
      </form>
      <div class="ed-actions">
        <button type="button" class="admin-btn" id="naSave">Lagre</button>
        <button type="button" class="admin-btn admin-btn-ghost" id="naCancel">Avbryt</button>
        <span id="naStatus" class="ed-status"></span>
      </div>`;

    host.querySelector("#naBack").addEventListener("click", load);
    host.querySelector("#naCancel").addEventListener("click", load);
    host.querySelector("#naSave").addEventListener("click", onSave);

    const form = host.querySelector("#naForm");
    form.addEventListener("input", (e) => {
      const el = e.target;
      if (el.dataset.f) d[el.dataset.f] = el.value;
      else if (el.dataset.pt != null) d.points[Number(el.dataset.pt)] = el.value;
    });
    form.addEventListener("change", (e) => {
      if (e.target.dataset.f) d[e.target.dataset.f] = e.target.value;
    });
    form.addEventListener("click", (e) => {
      const add = e.target.closest("[data-ptadd]");
      const del = e.target.closest("[data-ptdel]");
      if (add) {
        d.points.push("");
        paintForm();
      } else if (del) {
        d.points.splice(Number(del.dataset.ptdel), 1);
        paintForm();
      }
    });
  }

  // Bygg rent Firestore-objekt: enten `points` (om fylt) eller `body`.
  function payloadFrom(d) {
    const payload = { type: d.type || "nyhet", date: d.date, title: (d.title || "").trim() };
    const points = (d.points || []).map((p) => String(p).trim()).filter(Boolean);
    const body = (d.body || "").trim();
    if (points.length) payload.points = points;
    else if (body) payload.body = body;
    return payload;
  }

  async function onSave() {
    const d = state.draft;
    const status = host.querySelector("#naStatus");
    const btn = host.querySelector("#naSave");
    if (!(d.title || "").trim() || !d.date) {
      status.textContent = "Tittel og dato må fylles ut.";
      return;
    }
    btn.disabled = true;
    status.textContent = "Lagrer …";
    try {
      const payload = payloadFrom(d);
      if (d._id) await saveDoc("news", d._id, payload);
      else await addDocTo("news", payload);
      state.msg = "Lagret. Last forsiden på nytt for å se endringen.";
      await load();
    } catch (e) {
      status.textContent = "Feil: " + (e.message || e);
      btn.disabled = false;
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Slette denne nyheten?")) return;
    try {
      await deleteDocById("news", id);
      state.msg = "Slettet.";
      await load();
    } catch (e) {
      state.msg = "Kunne ikke slette: " + (e.message || e);
      paintList();
    }
  }

  async function onSeed() {
    if (!window.confirm("Importere de forhåndslagde nyhetene til Firestore?")) return;
    try {
      for (const n of NEWS) await addDocTo("news", payloadFrom({ ...n, points: n.points || [], body: n.body || "" }));
      state.msg = "Importert.";
      await load();
    } catch (e) {
      state.msg = "Import feilet: " + (e.message || e);
      paintList();
    }
  }

  load();
}
