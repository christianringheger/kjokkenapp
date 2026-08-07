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
