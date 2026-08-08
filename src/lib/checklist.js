// Avkryssbar Fremgangsmåte på detaljsider. Klikk på et trinn = merk gjort
// (strek over). «Nullstill sjekkliste» fjerner alle avkryssinger i lista.
// Tilstanden er midlertidig (kun i DOM) — nullstilles når man forlater siden.
export function initChecklist() {
  document.addEventListener("click", (e) => {
    const reset = e.target.closest("[data-ckreset]");
    if (reset) {
      const list = reset.previousElementSibling;
      if (list && list.classList.contains("steps-check")) {
        list
          .querySelectorAll("[data-ck].done")
          .forEach((li) => li.classList.remove("done"));
      }
      return;
    }
    const li = e.target.closest("[data-ck]");
    if (li) {
      li.classList.toggle("done");
      li.setAttribute("aria-pressed", li.classList.contains("done"));
    }
  });
}
