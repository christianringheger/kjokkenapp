// Porsjonsskalering på detaljsider: gang mengdene i en seksjon med et antall.
// Midlertidig (kun visning) — nullstilles når man forlater siden.

function fmtNum(n) {
  const r = Math.round(n * 100) / 100; // maks 2 desimaler, rydder flyttallsstøy
  return String(r).replace(".", ",");
}

function applyScale(scaler) {
  const input = scaler.querySelector("[data-scale-input]");
  const factor = Math.max(0.1, parseFloat(input.value) || 1);
  const sec = scaler.closest(".dsec");
  if (!sec) return;
  sec.querySelectorAll(".qty[data-amt]").forEach((q) => {
    const base = parseFloat(q.dataset.amt);
    if (Number.isNaN(base)) return;
    const unit = q.dataset.unit ? " " + q.dataset.unit : "";
    q.textContent = fmtNum(base * factor) + unit;
  });
}

export function initScale() {
  document.addEventListener("click", (e) => {
    const step = e.target.closest("[data-scale-step]");
    if (!step) return;
    const scaler = step.closest("[data-scaler]");
    const input = scaler.querySelector("[data-scale-input]");
    const next = Math.max(1, (parseInt(input.value, 10) || 1) + Number(step.dataset.scaleStep));
    input.value = next;
    applyScale(scaler);
  });
  document.addEventListener("input", (e) => {
    const input = e.target.closest("[data-scale-input]");
    if (input) applyScale(input.closest("[data-scaler]"));
  });
}
