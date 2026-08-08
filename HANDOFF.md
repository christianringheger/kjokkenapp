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
- `src/lib/firebase.js` — lat init (Firebase starter kun på `#/admin`), `isAdmin()`, `importSeedToFirestore()`.
- `src/ui/admin.js` — `#/admin`: innlogging (e-post/passord) + adminpanel med «Importer til Firestore»-knapp. Diskré «Admin»-lenke nederst på forsiden.

**Firestore-tilstand (viktig kontekst):** databasen hadde gammel data fra original-appen — 84 `dishes` (gammel allergendata) der 3 retter (`d0`, `d1`, `d2`) hadde ekte bilde (Firebase Storage) + Vimeo-video, men `recipes` og `prepitems` var TOMME. De 3 mediene er reddet inn i `seed.json` (så `seed.json` er nå komplett fasit). Importen overskriver de 84 rettene med vår data (mediene beholdt) og legger til 34 oppskrifter + 87 prep.

**NESTE STEG (i rekkefølge):**
1. **Sjekk om importen er kjørt.** Admin skulle logge inn på `#/admin` og trykke «Importer til Firestore» én gang. Verifiser via offentlig REST-lesing (ingen innlogging):
   ```bash
   KEY="AIzaSyCSLtKx1jOz8m7oshob0BbxqeBsBDMiuGU"
   BASE="https://firestore.googleapis.com/v1/projects/jordbaerpikene-kjokken/databases/(default)/documents"
   for c in dishes recipes prepitems; do
     n=$(curl -s "$BASE/$c?key=$KEY&pageSize=300" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('documents',[])))")
     echo "$c: $n"
   done
   ```
   Er `recipes`/`prepitems` > 0 er importen kjørt. Er de 0, be admin kjøre importen på `#/admin`.
2. **Koble appen til å lese fra Firestore** (source of truth) med `seed.json` som offline-fallback. `src/main.js` må bli async: last `dishes`/`recipes`/`prepitems` fra Firestore (`orderBy('_ord')`), fall tilbake til bundlet `seed.json` ved feil/offline. Vurder Firestore offline-persistence (`persistentLocalCache`). Behold PWA/offline-oppførselen.
3. **Admin-editor:** rediger felt (navn, pris, allergener, komponenter, `build`-steg, `video`-URL osv.) og lagre til Firestore. Reorder via `_ord`. Kun synlig for admin.
4. **Bildeopplasting:** Firebase Storage (`media/`-path, admin write, bilder <25 MB). Koble til medieblokken/editoren (`item.image`).

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
