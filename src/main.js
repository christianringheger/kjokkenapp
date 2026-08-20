// Inngangspunkt + enkel ruter.
// Data leses fra Firestore (fasit) med seed.json som offline-fallback — se lib/data.js.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/detail.css";
import { loadData, loadNews } from "./lib/data.js";
import { renderDishesShell, renderDishResults } from "./ui/dishes.js";
import { renderDishDetail, renderRecipeDetail } from "./ui/detail.js";
import {
  renderPrepShell,
  renderPrepResults,
  loadPrepDays,
  savePrepDays,
} from "./ui/prep.js";
import {
  renderRavareShell,
  renderRavareResults,
  buildRavareIndex,
} from "./ui/ravarer.js";
import { renderGuide } from "./ui/guide.js";
import { renderArkiv } from "./ui/arkiv.js";
import { renderForside } from "./ui/forside.js";
import { renderChangelog } from "./ui/changelog.js";
import {
  initFavorites,
  pushRecent,
  getFavs,
  getRecent,
} from "./lib/favorites.js";
import { initMedia } from "./lib/media.js";
import { initChecklist } from "./lib/checklist.js";
import { initScale } from "./lib/scale.js";
import { initReports } from "./lib/reports.js";
import { renderAdmin } from "./ui/admin.js";
import {
  renderHandleShell,
  renderHandleList,
  renderHandleMatches,
  loadHandle,
  saveHandle,
} from "./ui/handleliste.js";

const app = document.querySelector("#app");

// Data + avledede oppslag/indeks — fylles i bootstrap() når loadData() er ferdig.
let data = { dishes: [], recipes: [], prepitems: [] };
let news = null; // nyheter til forsiden (Firestore, med bundlet fallback)
let dishById = {};
let recipeById = {};
let ravIndex = {};

// Filter-tilstand som huskes når man går fram og tilbake.
// `avoid` er allergener som skjules; `alOpen` husker om filterraden står åpen.
const listState = {
  q: "",
  gfOnly: false,
  alOpen: false,
  avoid: new Set(),
  groupBy: "cat", // "cat" | "station"
};

// `rq` husker søket i råvarevisningen.
const ravState = { rq: "" };

// Handleliste: valgte retter/oppskrifter (lagres lokalt) + søketekst.
const handleState = { items: loadHandle(), q: "" };

// Prep: ukedager per oppgave (lagres lokalt) + valgt dagsfilter (-1 = alle).
const prepState = { days: loadPrepDays(), filter: -1 };

// Tegn menylista og koble søk/filter til resultatboksen.
function renderList() {
  app.innerHTML = renderDishesShell(listState);
  const search = document.getElementById("search");
  const gf = document.getElementById("gfOnly");
  const alToggle = document.getElementById("alToggle");
  const alFilter = document.getElementById("alFilter");
  const results = document.getElementById("results");

  search.value = listState.q;
  gf.checked = listState.gfOnly;

  const update = () => {
    results.innerHTML = renderDishResults(data.dishes, data.recipes, listState);
  };
  search.addEventListener("input", () => {
    listState.q = search.value;
    update();
  });
  gf.addEventListener("change", () => {
    listState.gfOnly = gf.checked;
    update();
  });

  // Vis/skjul allergifilter-raden.
  alToggle.addEventListener("click", () => {
    listState.alOpen = !listState.alOpen;
    alToggle.setAttribute("aria-pressed", String(listState.alOpen));
    alFilter.hidden = !listState.alOpen;
  });

  // Bytt mellom kategori- og stasjonsgruppering.
  const groupSeg = document.getElementById("groupSeg");
  groupSeg.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-group]");
    if (!btn) return;
    listState.groupBy = btn.dataset.group;
    groupSeg
      .querySelectorAll(".seg-btn")
      .forEach((b) => b.classList.toggle("on", b.dataset.group === listState.groupBy));
    update();
  });

  // Trykk på et allergen = legg til / fjern fra «skjul»-settet.
  alFilter.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-al]");
    if (!chip) return;
    const key = chip.dataset.al;
    if (listState.avoid.has(key)) listState.avoid.delete(key);
    else listState.avoid.add(key);
    chip.setAttribute("aria-pressed", String(listState.avoid.has(key)));
    update();
  });

  update();
}

// Tegn råvare-indeksen og koble søkefeltet til resultatboksen.
function renderRavarer() {
  app.innerHTML = renderRavareShell();
  const search = document.getElementById("ravSearch");
  const results = document.getElementById("ravResults");

  search.value = ravState.rq;
  const update = () => {
    results.innerHTML = renderRavareResults(ravIndex, ravState);
  };
  search.addEventListener("input", () => {
    ravState.rq = search.value;
    update();
  });
  update();
}

// Tegn handlelista: valgte rader + summert råvareliste + søk for å legge til.
function renderHandle() {
  app.innerHTML = renderHandleShell();
  const search = document.getElementById("handleSearch");
  const listEl = document.getElementById("handleList");
  const matchEl = document.getElementById("handleMatches");

  const paintList = () => {
    listEl.innerHTML = renderHandleList(
      handleState.items,
      dishById,
      recipeById
    );
  };
  const paintMatches = () => {
    matchEl.innerHTML = renderHandleMatches(
      handleState.q,
      data.dishes,
      data.recipes,
      handleState.items
    );
  };

  search.value = handleState.q;
  search.addEventListener("input", () => {
    handleState.q = search.value;
    paintMatches();
  });

  // Legg til fra søkeresultatet.
  matchEl.addEventListener("click", (e) => {
    const add = e.target.closest("[data-hadd]");
    if (!add) return;
    const [kind, id] = add.dataset.hadd.split(":");
    if (!handleState.items.some((it) => it.kind === kind && it.id === id)) {
      handleState.items.push({ kind, id, qty: 1 });
      saveHandle(handleState.items);
    }
    paintList();
    paintMatches();
  });

  // Antall +/−, fjern og tøm.
  listEl.addEventListener("click", (e) => {
    const step = e.target.closest("[data-hq]");
    const rm = e.target.closest("[data-hrm]");
    const clear = e.target.closest("[data-hclear]");
    if (step) {
      const [ref, delta] = step.dataset.hq.split("|");
      const [kind, id] = ref.split(":");
      const it = handleState.items.find((x) => x.kind === kind && x.id === id);
      if (it) {
        it.qty = Math.max(1, it.qty + Number(delta));
        saveHandle(handleState.items);
      }
    } else if (rm) {
      const [kind, id] = rm.dataset.hrm.split(":");
      handleState.items = handleState.items.filter(
        (x) => !(x.kind === kind && x.id === id)
      );
      saveHandle(handleState.items);
    } else if (clear) {
      handleState.items = [];
      saveHandle(handleState.items);
    } else {
      return;
    }
    paintList();
    paintMatches();
  });

  paintList();
  paintMatches();
}

// Tegn prep-skjermen: dagsfilter + oppgaver med ukedags-knapper.
function renderPrep() {
  app.innerHTML = renderPrepShell(prepState);
  const results = document.getElementById("prepResults");
  const filterRow = document.querySelector(".prep-filter-row");

  const update = () => {
    results.innerHTML = renderPrepResults(data.prepitems, prepState);
  };

  // Bytt dagsfilter.
  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pfilter]");
    if (!btn) return;
    prepState.filter = Number(btn.dataset.pfilter);
    filterRow
      .querySelectorAll(".prep-filter")
      .forEach((b) =>
        b.classList.toggle(
          "on",
          Number(b.dataset.pfilter) === prepState.filter
        )
      );
    update();
  });

  // Legg/fjern en oppgave på en ukedag.
  results.addEventListener("click", (e) => {
    const day = e.target.closest("[data-pday]");
    if (!day) return;
    const [id, idxRaw] = day.dataset.pday.split("|");
    const idx = Number(idxRaw);
    const list = prepState.days[id] || [];
    if (list.includes(idx)) {
      prepState.days[id] = list.filter((x) => x !== idx);
      if (!prepState.days[id].length) delete prepState.days[id];
    } else {
      prepState.days[id] = [...list, idx].sort((a, b) => a - b);
    }
    savePrepDays(prepState.days);
    // Med aktivt dagsfilter kan raden forsvinne → tegn hele lista på nytt.
    if (prepState.filter >= 0) update();
    else {
      day.classList.toggle("on");
      day.setAttribute("aria-pressed", day.classList.contains("on"));
    }
  });

  update();
}

// Velg skjerm ut fra adressen (#/dish/d0, #/recipe/r5, #/ravarer, ellers lista).
function render() {
  const hash = location.hash.replace(/^#\/?/, ""); // "dish/d0"
  const [route, id] = hash.split("/");

  if (route === "dish" && id) {
    app.innerHTML = renderDishDetail(dishById[id]);
    if (dishById[id]) pushRecent(`dish:${id}`);
    window.scrollTo(0, 0);
  } else if (route === "recipe" && id) {
    app.innerHTML = renderRecipeDetail(recipeById[id]);
    if (recipeById[id]) pushRecent(`recipe:${id}`);
    window.scrollTo(0, 0);
  } else if (route === "ravarer") {
    renderRavarer();
    window.scrollTo(0, 0);
  } else if (route === "guide") {
    app.innerHTML = renderGuide();
    window.scrollTo(0, 0);
  } else if (route === "arkiv") {
    app.innerHTML = renderArkiv();
    window.scrollTo(0, 0);
  } else if (route === "handleliste") {
    renderHandle();
    window.scrollTo(0, 0);
  } else if (route === "prep") {
    renderPrep();
    window.scrollTo(0, 0);
  } else if (route === "meny") {
    renderList();
  } else if (route === "admin") {
    renderAdmin(app);
    window.scrollTo(0, 0);
  } else if (route === "changelog") {
    app.innerHTML = renderChangelog();
    window.scrollTo(0, 0);
  } else {
    app.innerHTML = renderForside(buildQuickAccess(), news);
    window.scrollTo(0, 0);
  }
}

// Bygg hurtigtilgang (favoritter + nylig) til forsiden. Løser opp id → navn.
function resolveRef(ref) {
  const [kind, id] = ref.split(":");
  if (kind === "dish" && dishById[id])
    return { href: `#/dish/${id}`, name: dishById[id].name };
  if (kind === "recipe" && recipeById[id])
    return { href: `#/recipe/${id}`, name: recipeById[id].title };
  return null;
}
function quickRow(title, refs) {
  const items = refs
    .map(resolveRef)
    .filter(Boolean)
    .map((x) => `<a class="qa-chip" href="${x.href}">${escName(x.name)}</a>`)
    .join("");
  return items
    ? `<div class="qa-row"><span class="qa-title">${title}</span><div class="qa-chips">${items}</div></div>`
    : "";
}
function escName(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function buildQuickAccess() {
  const fav = quickRow("Favoritter", getFavs());
  const recent = quickRow("Nylig", getRecent());
  return fav || recent ? `<div class="quickaccess">${fav}${recent}</div>` : "";
}

// Bygg oppslag/indeks fra lastet data.
function indexData() {
  dishById = Object.fromEntries(data.dishes.map((d) => [d.id, d]));
  recipeById = Object.fromEntries(data.recipes.map((r) => [r.id, r]));
  ravIndex = buildRavareIndex(data);
}

// Oppstart: vis skjelett med en gang, last data (Firestore → seed-fallback),
// og tegn så den valgte skjermen. Ruteren fungerer under lasting.
async function bootstrap() {
  initMedia();
  initChecklist();
  initScale();
  initFavorites();
  initReports();
  window.addEventListener("hashchange", render);
  app.innerHTML = `<main class="wrap"><p class="lead">Laster…</p></main>`;
  const [d, n] = await Promise.all([loadData(), loadNews()]);
  data = d;
  news = n;
  indexData();
  render();
}

bootstrap();
