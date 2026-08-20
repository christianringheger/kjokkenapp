# Jordbærpikene Kjøkkenapp

Intern kjøkkenmanual for Jordbærpikene (JP): meny, oppskrifter, allergener, prep, glutenfri-guide, handleliste og arkiv. Brukes av kjøkkenstab på mobil/iPad/desktop. Norsk UI.

## Arkitektur
- **Vite-prosjekt** med modulær kildekode under `src/`. `npm run build` inliner all JS/CSS til én selvstendig `dist/index.html` via `vite-plugin-singlefile`. **PWA-filer** (`manifest.webmanifest`, `sw.js`, `icon-180/192/512.png`) ligger i `public/` og kopieres til `dist/` ved siden av. Deploy er altså nå **flere filer** (ikke én lenger).
  - `index.html` (rot) er et lite skall som laster `src/main.js` + injiserer manifest/apple-touch-icon og registrerer service worker (offline).
  - **Ingen backend i drift nå.** Dataene lastes lokalt fra `src/data/seed.json`. Firebase (auth/admin/media) er bevisst utsatt — se «Utsatt / blokkert».
  - Eneste eksterne avhengighet i appen er Google Fonts. `firebase` ligger som npm-dependency, men importeres ikke ennå.
- **Dev:** `npm run dev` (se `.claude/launch.json` — kjører på port 5199 for å ikke kollidere med andre lokale servere). `npm run build` / `npm run preview`.
- **Originalen** (gammel single-file med Firebase inline) er tatt vare på i `legacy/original-index.html` som referanse.

### Filstruktur (src/)
- `main.js` — inngangspunkt + hash-ruter + all interaktiv wiring (tilstand for søk/filter/handleliste/prep).
- `ui/` — én modul per skjerm: `forside.js` (flis-hub), `nav.js` (topplinjer), `dishes.js` (meny + kort + filtre), `detail.js` (rett/oppskrift), `ravarer.js`, `handleliste.js`, `prep.js`, `guide.js`, `arkiv.js`.
- `lib/` — `dom.js` (`esc`, tallformat), `allergens.js` (SVG-ikoner `ALPATH` + chips).
- `data/` — `seed.json` (dishes/recipes/prepitems), `labels.js` (koder → visningsnavn, kategori-rekkefølge, allergen-navn).
- `styles/` — `tokens.css` (farger/fonter/skygger), `base.css`, `components.css`, `detail.css`.

### Navigasjon (hub-og-eiker)
- `#/` = **forside** (flis-grid). Ingen faner. Hver flis lenker til en seksjon.
- Seksjoner: `#/meny`, `#/ravarer`, `#/handleliste`, `#/prep`, `#/guide`, `#/arkiv`. Hver har «‹ Forside» tilbake.
- Detaljer: `#/dish/<id>`, `#/recipe/<id>` — «‹ Meny» tilbake.

## Funksjoner (frontend, ingen backend nødvendig)
- **Meny:** kort gruppert på **kategori** eller **stasjon** (Bong/Disk/Drikke & catering — bryter i søkeraden). Søk treffer retter, oppskrifter og ingredienser. Filtre: «Kun glutenfri» + utfellbart **allergifilter** (skjul retter med valgte allergener).
- **Råvarer:** indeks over alle råvarer → hvilke retter/oppskrifter de inngår i (klikkbart).
- **Handleliste:** legg til retter/oppskrifter med antall → summerer råvarer (`build.ing`/`ing` × antall). Lagres i `localStorage` (`jp_handle`).
- **Prep:** oppgaver gruppert på seksjon, med **ukesplan** — legg oppgaver på ukedager + dagsfilter. Lagres i `localStorage` (`jp_prepdays`).
- **Glutenfri-guide:** rutiner + «Glutenfri på 1-2-3»-erstatninger (innhold hentet ordrett fra Bong-manualen s. 4).
- **Arkiv:** lenker til de trykte PDF-manualene (hostet på SharePoint) for avdelinger som fortsatt vil printe selv. URL-ene ligger i `MANUALER` i `arkiv.js`.

## Datamodell (per rett/oppskrift)
- `build.steps` / `steps`: fremgangsmåte (nummerert). `build.ing`: mengder til handleliste. `build.layers`: «Lagdeling» (vises kun når fylt). `comp` / `ing`: komponenter.
- `station`: `"bong"` | `"disk"` | mangler (drikke/catering) — styrer stasjonsgruppering.
- **Allergener** (`all` på rett, `a`/`comp[].a` per komponent): dekker nå alle **14 lovpålagte EU-allergener**. Gyldige nøkler: `gluten, skalldyr, egg, fisk, peanotter, soya, melk, notter, selleri, sennep, sesam, sulfitt, lupin, blotdyr`. Hver har et inline SVG-ikon i `ALPATH` (`lib/allergens.js`) og visningsnavn i `ALLERGEN_NAME` (`data/labels.js`). De opprinnelige 7 nøklene er beholdt for bakoverkompat.
- **`alReview: true` + `alReviewNote`:** markerer retter der allergenene er utledet, men ikke bekreftet av Matfaglig. Vises som amber «Allergener uavklart»-merke/varsel. Mekanismen beholdes for framtidig bruk. De opprinnelige 7 rettene er **avklart 20. aug 2026 av Matfaglig (Torkil)**: croissant-deig inneholder egg (p27/p28/d58 fikk `egg`); bagel-deig har verken sesam eller melk; pesto = melk (ingen nøtter); salami = gluten+melk; chickenparm = egg+melk — alt dekket av eksisterende `gluten/egg/melk`. Flaggene er fjernet i `seed.json`.
- **`image`** (bilde-URL) / **`video`** (YouTube/Vimeo/embed-URL): vises som medieblokk øverst på detaljsiden (bilde forstørres i lightbox, video spilles i lightbox via grønt play-merke). Blokken er skjult når begge mangler. Se `lib/media.js`. Visningen er ren frontend — legg inn URL-er i dataene (bildet hostes eksternt, f.eks. SharePoint). Opplasting/redigering *i appen* kommer med Firebase.

## Designprofil (JP)
- Farger: JP-rød `#da2a1c`, kremhvit `#f5f5ea`, sort; støtte brun `#cda177`, grønn `#708573`. Varselfarge (uavklart) amber `#f6ead2`. Definert i `tokens.css`.
- Typografi: display/«Signal»-rolle = **Signal** (URW, caps + sperret tracking); brødtekst = **Maison Neue** (Book/Medium/Bold). Lisensierte profilfonter, bygget inn som base64 i `src/styles/fonts.css`. Archivo/Hanken Grotesk beholdt som fallback i `--signal`/`--body` (`tokens.css`). Ingen ekstern fontlasting.
- Offisiell JP-jordbærlogo (fra designprofilen) ved navnetrekket, se `berry()` i `nav.js` (silhuett + 5 frø, farges via `currentColor`). PWA/hjem-skjerm-ikonet (`public/icon-*.png`) er hvit jordbær på JP-rød bunn. Responsivt: 2 kolonner mobil / 3 iPad+desktop. Safe-area håndtert.

## Konvensjoner
- Norsk UI. Behold den modulære src-strukturen; ikke slå alt sammen til én fil igjen (bygget gjør det).
- Test før commit: `npm run build` (fanger syntaksfeil) + at `seed.json` parser.
- Verifiser endringer i nettleseren via dev-serveren når de er synlige (se `.claude/launch.json`).

## Deploy
- **Ikke et git-repo lokalt.** Endringene ligger foreløpig bare på denne maskinen. Normal deploy går via `kjokkenapp`-repoet på GitHub Pages.
- `npm run build`, og publiser **hele innholdet i `dist/`** (index.html + manifest.webmanifest + sw.js + icon-*.png) til der Pages serverer fra (rot av `main`). Alle filene må ligge sammen for at PWA/offline skal virke.
- **PWA:** appen kan «Legg til på Hjem-skjerm» på iPad (Safari → Del → Legg til på Hjem-skjerm) og fungerer offline. `sw.js` cacher app-skallet (nett-først på HTML, cache-først på øvrige). Bump `CACHE`-konstanten i `sw.js` ved større endringer for å tvinge frisk cache.
- **Auto-deploy er satt opp:** `.github/workflows/deploy.yml` kjører `npm run build` og publiserer `dist/` til Pages ved hver push til `main`. Repo: `git@github.com:christianringheger/kjokkenapp.git` (SSH-nøkkel satt opp lokalt). Pages-kilden står på «GitHub Actions». Live: https://christianringheger.github.io/kjokkenapp/
- Flyt: endre kode → `git commit` → `git push origin main` → auto-bygg og -publisering. Ingen manuell opplasting.

## Firebase (pågår — se HANDOFF.md)
- Firebase re-integreres nå. Mål: **Firestore som fasit**, admin logger inn på `#/admin` og redigerer i appen (live uten redeploy). Offentlig lesing beholdes; login kun for admin.
- Gjort: `src/lib/firebase.js` (lat init + `importSeedToFirestore`), `src/ui/admin.js` (innlogging + adminpanel), `firestore.rules` + `storage.rules` (publisert). Prosjekt `jordbaerpikene-kjokken`, admin `christianringheger@gmail.com`. `firebaseConfig` er klient-konfig (trygt i repo; sikkerhet ligger i reglene).
- **Neste steg og full status: se `HANDOFF.md`.**
