// Favoritter + nylig åpnet, lagret lokalt på enheten (localStorage).
// Referanseformat: "dish:<id>" | "recipe:<id>".
const FAV = "jp_fav";
const RECENT = "jp_recent";
const RECENT_MAX = 8;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (_) {
    return [];
  }
}
function write(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (_) {
    /* full/blokkert lagring – ignorer */
  }
}

export function getFavs() {
  return read(FAV);
}
export function isFav(ref) {
  return read(FAV).includes(ref);
}
export function toggleFav(ref) {
  const arr = read(FAV);
  const i = arr.indexOf(ref);
  if (i >= 0) arr.splice(i, 1);
  else arr.unshift(ref);
  write(FAV, arr);
  return arr.includes(ref);
}

export function getRecent() {
  return read(RECENT);
}
export function pushRecent(ref) {
  const arr = read(RECENT).filter((x) => x !== ref);
  arr.unshift(ref);
  write(RECENT, arr.slice(0, RECENT_MAX));
}

// Global klikk-håndterer for favoritt-stjerner (data-fav="dish:<id>").
export function initFavorites() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    const on = toggleFav(btn.dataset.fav);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}
