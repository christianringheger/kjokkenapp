// Små delte hjelpefunksjoner.

// Trygg tekst i HTML (unngår at < > & " ødelegger visningen).
export function esc(s) {
  return String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// Formater et tall norsk: 1.0 → "1", 1.2 → "1,2".
export function num(n) {
  if (n == null || n === "") return "";
  return String(n).replace(".", ",");
}

// Formater en mengde: {amt, unit} → "60 g", "1,2 kg".
export function amount(item) {
  const a = num(item.amt);
  const u = item.unit ? ` ${esc(item.unit)}` : "";
  return a ? `${a}${u}` : "";
}

// Dato: "2026-08-19" → "19. aug 2026" (manuell parsing unngår tidssone-fella).
const MONTHS_NO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
export function fmtDateNo(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d}. ${MONTHS_NO[m - 1] || ""} ${y}`;
}
