# HANDOFF — Jordbærpikene Kjøkkenapp

Overlevering for å fortsette arbeidet i en ny økt. Les også `CLAUDE.md` (arkitektur/konvensjoner). Denne fila er selvstendig — du trenger ikke tidligere samtalehistorikk.

## 1. Hva dette er
Intern kjøkkenmanual for Jordbærpikene (JP): meny, oppskrifter, allergener, prep, glutenfri-guide, handleliste, arkiv. Norsk UI, brukes på mobil/iPad/desktop. Skal erstatte de trykte PDF-manualene, slik at menyendringer ikke krever ny trykk.

## 2. Kjøre / bygge / deploye
- **Prosjekt:** `~/Desktop/JP - Menyapp` (git-repo).
- **Dev:** `npm run dev` (port 5199, se `.claude/launch.json`). **Build:** `npm run build` → `dist/`. **Preview av bygg:** `npm run preview` (port 5200).
- **Repo:** `git@github.com:christianringheger/kjokkenapp.git`, branch `main`. SSH-nøkkel er satt opp på maskinen (push går uten prompt).
- **Deploy:** `git push origin main` → GitHub Actions (`.github/workflows/deploy.yml`) bygger og publiserer automatisk. **Live:** https://christianringheger.github.io/kjokkenapp/
- Test alltid `npm run build` før commit. Verifiser synlige endringer i nettleseren mot dev-serveren.

## 3. Arkitektur (kort)
Vite-app, modulær `src/`. Bygger til én selvstendig `dist/index.html` (vite-plugin-singlefile) + PWA-filer fra `public/`. Hub-og-eiker-navigasjon: `#/` forside → seksjoner (`#/meny`, `#/ravarer`, `#/handleliste`, `#/prep`, `#/guide`, `#/arkiv`), detaljer `#/dish/<id>` og `#/recipe/<id>`, admin `#/admin`. Data i `src/data/seed.json`. Se `CLAUDE.md` for full filstruktur og datamodell.

## 4. Ferdig (fungerer, live)
- **Frontend-paritet med originalen:** meny (grupper på kategori/stasjon), allergifilter (alle 14 EU-allergener), samlet søk (retter+oppskrifter+råvarer), råvare-indeks, glutenfri-guide, handleliste (localStorage), prep-ukesplan (localStorage), arkiv (SharePoint-PDF-lenker), forside-hub, medieblokk (bilde+video i lightbox).
- **PWA + offline:** manifest, `public/sw.js`, ikoner. «Legg til på Hjem-skjerm» + offline verifisert i prod.
- **Auto-deploy:** git + GitHub Actions (se pkt. 2).

## 5. Firebase — DER ARBEIDET SKAL FORTSETTE
Mål: **Firestore som fasit**, admin logger inn og redigerer i appen (live uten redeploy). Offentlig lesing beholdes; innlogging kun for admin.

**Prosjekt:** `jordbaerpikene-kjokken`. **Admin:** `christianringheger@gmail.com`. Klient-config ligger i `src/lib/firebase.js` (trygt i repo). Reglene: `firestore.rules` + `storage.rules` (publisert i konsollet: offentlig lesing, admin-skriving).

**Gjort:**
- `src/lib/firebase.js` — lat init, `isAdmin()`, `importSeedToFirestore()`.
- `src/ui/admin.js` — `#/admin`: innlogging (e-post/passord) + adminpanel med «Importer til Firestore»-knapp. Diskré «Admin»-lenke nederst på forsiden.
- ✅ **Import kjørt og verifisert** (84 dishes / 34 recipes / 87 prepitems i Firestore; media på d0/d1/d2 bevart, allergener = ny seed).
- ✅ **Import-blokker fikset:** `usedBy` på oppskrifter var array-av-arrays (Firestore avviser nøstede arrays) → endret til Firestore-native `[{id, title}]` i `seed.json` + `src/ui/detail.js`.
- ✅ **Appen leser fra Firestore** (Spor 2 steg 2): nytt `src/lib/data.js` (`loadData()` leser dishes/recipes/prepitems `orderBy('_ord')`, faller tilbake til `seed.json` ved feil/offline eller tom samling). `src/main.js` er nå async (viser «Laster…», henter data, bygger oppslag/indeks, tegner). Kilde logges: `[data] Firestore: …`.

**Firestore-tilstand:** Firestore er nå fasit (84/34/87). `seed.json` er fortsatt komplett og fungerer som offline-fallback. Importen overskriver dishes (`set` uten merge) og legger til recipes/prepitems; media beholdes fordi `seed.json` allerede inneholder image/video på d0/d1/d2.

**NESTE STEG (i rekkefølge):**
1. ✅ Import kjørt (se over).
2. ✅ Appen leser fra Firestore med seed-fallback (se over).
3. ✅ **Admin-editor ferdig.** Full strukturert redigering av retter/oppskrifter/prep bak innlogging på `#/admin` («Rediger innhold»). Nye filer: `src/ui/editor.js` (UI + tilstand), `src/lib/firestore-admin.js` (fetchList/fetchDoc/saveDoc), `src/lib/editor-serialize.js` (`cleanForSave` — ren, testet). Redigerer alle synlige felt (navn, pris, kat, stasjon, gf, tag, allergener, `comp[]` m/ rid, `build.ing/steps/layers/pres`, ownprep, video/image, alReview+note for retter; tittel/kat/yield/hold/freeze/ing/steps for oppskrifter; sec/name/hold/link for prep). Lagring = full `setDoc` som bevarer skjulte felt (`_ord`, `src`, `usedBy`, legacy-`ing`). Verifisert: render mot ekte data, interaksjoner, 31 Node-tester på `cleanForSave`, og live round-trip (endret pris → riktig tall, alt annet bevart). **Åpent:** reorder-UI (`_ord`) og opprettelse/sletting av dokumenter er ikke bygd ennå; offentlig visning oppdateres først ved reload (editoren viser melding om det).
4. **Bildeopplasting (NÅ):** Firebase Storage (`media/`-path, admin write, bilder <25 MB). Koble til medieblokken/editoren (`item.image`). Editoren har allerede et «Bilde-URL»-felt merket «opplasting kommer» — bytt til opplasting som skriver URL dit.

## 6. Åpne punkter / advarsler
- **Matfaglig-allergener:** 7 retter har `alReview: true` + `alReviewNote` — utledede allergener som venter på bekreftelse fra Matfaglig. **Ikke fjern flagget uten bekreftelse.** Retter: `p27`, `p28`, `d58` (croissant: egg fra eggevask?), `p33`, `p34`, `p35` (bagel: sesam/melk i deig? + `p35` chickenparm-sammensetning), `p36` (bagel + pesto: melk/nøtter? + salami: allergener?). Appen viser amber «Allergener uavklart»-merke for disse.
- **Kilde-PDF-ene** ligger i `Underlag/` og er **gitignored** — de skal IKKE i det offentlige repoet (interne; hostes på SharePoint og lenkes fra Arkiv).
- **SharePoint-arkivlenker** (`src/ui/arkiv.js`) må være delt «alle med lenken» for at kjøkkenstaben skal få åpnet PDF-ene.
- **Bundle-størrelse:** Firebase-SDK gjorde bygget ~614 KB (gzip ~141 KB). Akseptabelt (SW-cachet), men hold øye med det.
- **Legacy:** original single-file-app (med gammel Firebase-kode) ligger i `legacy/original-index.html` som referanse.

## 7. Nyttige verdier
- Live: https://christianringheger.github.io/kjokkenapp/ · Repo: `christianringheger/kjokkenapp`
- Firebase-prosjekt: `jordbaerpikene-kjokken` · Admin-e-post: `christianringheger@gmail.com`
- Klient-config: `src/lib/firebase.js`. Regler: `firestore.rules`, `storage.rules`.
