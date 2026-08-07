// Inngangspunkt + enkel ruter.
// Data lastes lokalt fra seed.json. Firebase kobles på senere.
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/detail.css";
import seed from "./data/seed.json";
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
import { initMedia } from "./lib/media.js";
import { renderAdmin } from "./ui/admin.js";
import {
  renderHandleShell,
  renderHandleList,
  renderHandleMatches,
  loadHandle,
  saveHandle,
} from "./ui/handleliste.js";

const app = document.querySelector("#app");

// Oppslagstabeller for rask henting på id.
const dishById = Object.fromEntries(seed.dishes.map((d) => [d.id, d]));
const recipeById = Object.fromEntries(seed.recipes.map((r) => [r.id, r]));

// Filter-tilstand som huskes når man går fram og tilbake.
// `avoid` er allergener som skjules; `alOpen` husker om filterraden står åpen.
const listState = {
  q: "",
  gfOnly: false,
  alOpen: false,
  avoid: new Set(),
  groupBy: "cat", // "cat" | "station"
};

// Råvare-indeks: bygges én gang; `rq` husker søket i råvarevisningen.
const ravIndex = buildRavareIndex(seed);
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
    results.innerHTML = renderDishResults(seed.dishes, seed.recipes, listState);
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
      seed.dishes,
      seed.recipes,
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
    results.innerHTML = renderPrepResults(seed.prepitems, prepState);
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
    window.scrollTo(0, 0);
  } else if (route === "recipe" && id) {
    app.innerHTML = renderRecipeDetail(recipeById[id]);
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
  } else {
    app.innerHTML = renderForside();
    window.scrollTo(0, 0);
  }
}

initMedia();
window.addEventListener("hashchange", render);
render();
