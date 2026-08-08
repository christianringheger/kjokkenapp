// Ren serialiserings-logikk for admin-editoren (ingen DOM/Firebase-avhengigheter,
// så den kan enhetstestes i Node). Gjør et redigert draft-objekt klart for
// skriving til Firestore: koerser typer, fjerner tomme valgfrie felt og bevarer
// ukjente/skjulte felt (id, _ord, src, usedBy, legacy-ing …).

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const isBlank = (v) => v == null || String(v).trim() === "";

export function cleanForSave(col, draft) {
  const o = clone(draft);

  if (col === "dishes") {
    o.name = (o.name || "").trim();
    o.price = num(o.price);
    o.gf = !!o.gf;
    o.all = Array.isArray(o.all) ? o.all : [];
    if (isBlank(o.station)) delete o.station;
    if (isBlank(o.tag)) delete o.tag;
    if (isBlank(o.video)) delete o.video;
    if (isBlank(o.image)) delete o.image;
    if (isBlank(o.ownprep)) delete o.ownprep;
    if (o.alReview) {
      o.alReview = true;
      if (isBlank(o.alReviewNote)) delete o.alReviewNote;
    } else {
      delete o.alReview;
      delete o.alReviewNote;
    }
    o.comp = (o.comp || [])
      .map((c) => {
        const row = { n: (c.n || "").trim(), a: Array.isArray(c.a) ? c.a : [] };
        if (!isBlank(c.rid)) row.rid = String(c.rid).trim();
        return row;
      })
      .filter((c) => c.n || c.a.length || c.rid);
    if (o.build) {
      const b = o.build;
      b.ing = (b.ing || [])
        .map((r) => {
          const row = {
            amt: num(r.amt),
            unit: (r.unit || "").trim(),
            name: (r.name || "").trim(),
          };
          if (!isBlank(r.rid)) row.rid = String(r.rid).trim();
          return row;
        })
        .filter((r) => r.name || r.amt != null);
      b.steps = (b.steps || []).map((s) => String(s).trim()).filter(Boolean);
      b.layers = (b.layers || []).map((s) => String(s).trim()).filter(Boolean);
      if (isBlank(b.pres)) delete b.pres;
      // Ikke skriv et helt tomt build-objekt (f.eks. for drikke uten oppbygging).
      if (!b.ing.length && !b.steps.length && !b.layers.length && !("pres" in b)) {
        delete o.build;
      }
    }
  } else if (col === "recipes") {
    o.title = (o.title || "").trim();
    o.yield = num(o.yield);
    if (isBlank(o.yieldunit)) delete o.yieldunit;
    o.hold = (o.hold || "").trim();
    if (o.freeze) o.freeze = true;
    else delete o.freeze;
    if (isBlank(o.video)) delete o.video;
    if (isBlank(o.image)) delete o.image;
    o.ing = (o.ing || [])
      .map((r) => ({
        amt: num(r.amt),
        unit: (r.unit || "").trim(),
        name: (r.name || "").trim(),
      }))
      .filter((r) => r.name || r.amt != null);
    o.steps = (o.steps || []).map((s) => String(s).trim()).filter(Boolean);
  } else if (col === "prepitems") {
    o.name = (o.name || "").trim();
    o.sec = (o.sec || "").trim();
    o.hold = (o.hold || "").trim();
    o.link = isBlank(o.link) ? null : String(o.link).trim();
  }
  return o;
}
