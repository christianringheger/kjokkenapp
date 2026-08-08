// Ren validering av bildefiler før opplasting (må matche storage.rules:
// kun image/*, maks 25 MB). Ingen Firebase-avhengighet → enhetstestbar i Node.

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

// Returnerer en feilmelding (streng) hvis fila ikke kan lastes opp, ellers null.
export function validateImageFile(file) {
  if (!file) return "Ingen fil valgt.";
  const type = file.type || "";
  if (!type.startsWith("image/")) return "Kun bildefiler (jpg, png, webp …).";
  if (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES)
    return "Bildet er for stort (maks 25 MB).";
  return null;
}

// Trygt filnavn for Storage-stien: behold bokstaver/tall/._-, resten → _.
export function safeFileName(name) {
  const n = String(name || "bilde").trim().toLowerCase();
  return n.replace(/[^a-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "bilde";
}
