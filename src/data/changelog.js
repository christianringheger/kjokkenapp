// Endringslogg — kort, lesbar oversikt over hva som er gjort i appen.
// Nyeste dato først. Til intern orientering (f.eks. for å informere kolleger).
export const CHANGELOG = [
  {
    date: "2026-08-20",
    items: [
      "Innholdet styres nå fra en database (Firestore) med offline-sikring — menyendringer blir synlige i appen med én gang, uten ny publisering.",
      "Administrator kan redigere retter, oppskrifter og prep direkte i appen (bak innlogging).",
      "Bildeopplasting i appen: last opp rett fra mobilen — store bilder krympes og komprimeres automatisk så appen holder seg lett.",
      "Designprofil på plass: offisiell JP-logo, profilfontene Signal + Maison Neue, offisielle allergen-ikoner fra bordmenyen, og «Ny!»/«Bestselger!» som på bordmenyen.",
      "Nytt app-ikon (offisiell jordbær) for «Legg til på Hjem-skjerm».",
      "Detaljsiden viser Oppbygging øverst, rett under bildet — mindre scrolling for kjøkkenet.",
      "Fremgangsmåte kan hakes av mens man jobber, med «Nullstill sjekkliste».",
      "Porsjonsskalering (× antall) på oppskrifter og oppbygging — nyttig for catering.",
      "Favoritter og «nylig åpnet» for rask tilgang fra forsiden.",
      "«Sist oppdatert»-dato vises på retter og oppskrifter.",
      "Nyhetsfelt øverst på forsiden (Nyhet/Endring med dato) — redigerbart av admin.",
      "Automatisk oppdatering: nye versjoner dukker opp av seg selv på enhetene.",
    ],
  },
];
