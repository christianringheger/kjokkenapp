// Admin-innboks for «Meld feil»-meldinger (Firestore-samlingen `reports`).
// Liste (nyeste først) + merk som håndtert + slett. Gjenbruker .na-*/.ed-*-stiler.
import { esc, fmtDateNo } from "../lib/dom.js";
import { fetchList, updateFields, deleteDocById } from "../lib/firestore-admin.js";

export function renderReportsInbox(host) {
  const state = { list: [], msg: "" };

  async function load() {
    host.innerHTML = `<p class="lead">Laster innboks …</p>`;
    try {
      state.list = await fetchList("reports", "created", "desc");
    } catch (e) {
      host.innerHTML = `<p class="admin-err">Kunne ikke laste innboks. Er de nye Firestore-reglene publisert (reports-samlingen)?<br><span class="na-empty">${esc(e.message || e)}</span></p>`;
      return;
    }
    paint();
  }

  function itemRow(r) {
    const date = fmtDateNo((r.created || "").slice(0, 10));
    const who = r.reporter ? ` · ${esc(r.reporter)}` : "";
    return `<li class="rp-item${r.handled ? " done" : ""}">
      <div class="rp-main">
        <div class="rp-meta">
          <span class="rp-title">${esc(r.title || "(uten rett)")}</span>
          <span class="rp-date">${esc(date)}${who}</span>
          ${r.handled ? `<span class="news-type news-type-endring">Håndtert</span>` : ""}
        </div>
        <p class="rp-msg">${esc(r.message || "")}</p>
      </div>
      <div class="na-item-tools">
        <button type="button" class="ed-add" data-toggle="${esc(r._id)}">${r.handled ? "Merk uhåndtert" : "Merk håndtert"}</button>
        <button type="button" class="na-del" data-del="${esc(r._id)}">Slett</button>
      </div>
    </li>`;
  }

  function paint() {
    const open = state.list.filter((r) => !r.handled).length;
    const rows = state.list.length
      ? state.list.map(itemRow).join("")
      : `<li class="na-empty">Ingen meldinger.</li>`;
    host.innerHTML = `
      ${state.msg ? `<p class="ed-msg">${esc(state.msg)}</p>` : ""}
      <p class="ed-count">${state.list.length} meldinger · ${open} uhåndtert</p>
      <ul class="na-list">${rows}</ul>`;
    state.msg = "";
    host.querySelectorAll("[data-toggle]").forEach((b) =>
      b.addEventListener("click", () => onToggle(b.dataset.toggle))
    );
    host.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => onDelete(b.dataset.del))
    );
  }

  async function onToggle(id) {
    const r = state.list.find((x) => x._id === id);
    if (!r) return;
    try {
      await updateFields("reports", id, { handled: !r.handled });
      await load();
    } catch (e) {
      state.msg = "Kunne ikke oppdatere: " + (e.message || e);
      paint();
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Slette denne meldingen?")) return;
    try {
      await deleteDocById("reports", id);
      state.msg = "Slettet.";
      await load();
    } catch (e) {
      state.msg = "Kunne ikke slette: " + (e.message || e);
      paint();
    }
  }

  load();
}
