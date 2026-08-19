// Oppdateringer/nyheter som vises øverst på forsiden. Nyeste først.
// type: "nyhet" | "endring". date: ISO (YYYY-MM-DD) — brukes til sortering + visning.
// Enten `body` (én tekst) eller `points` (punktliste).
export const NEWS = [
  {
    type: "nyhet",
    date: "2026-08-19",
    title: "Jordbær Matcha Latte",
    body: "Ny på menyen: kremet matcha med et hint av søt jordbær — sommerens signaturdrikk.",
  },
  {
    type: "endring",
    date: "2026-08-01",
    title: "Endringer i manualene",
    points: [
      "Laksewrap (Cateringmanual): «oppskrift × antall personer» endres til «Oppskriften gir 5 porsjoner» for tydelighet.",
      "Spansk omelett (Produksjonsmanual): sjalottløk byttes til vanlig løk — rimeligere og uten kvalitetsforskjell. Oppdateres i Plankjøp og manualen.",
    ],
  },
];
