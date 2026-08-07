// Skjerm: admin — innlogging + adminpanel (import til Firestore).
// Offentlig lesing beholdes; dette er kun for administrator.
import { esc } from "../lib/dom.js";
import { appHeader } from "./nav.js";
import {
  initFirebase,
  isAdmin,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  importSeedToFirestore,
} from "../lib/firebase.js";

function mapErr(e) {
  const c = (e && e.code) || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password"))
    return "Feil e-post eller passord.";
  if (c.includes("user-not-found")) return "Fant ingen bruker med denne e-posten.";
  if (c.includes("invalid-email")) return "Ugyldig e-postadresse.";
  if (c.includes("too-many-requests"))
    return "For mange forsøk. Vent litt og prøv igjen.";
  if (c.includes("network")) return "Nettverksfeil. Sjekk tilkoblingen.";
  return "Innlogging feilet: " + (e.message || c);
}

export function renderAdmin(container) {
  const { auth } = initFirebase();
  container.innerHTML = `${appHeader()}<main class="wrap detail"><div id="adminBody"><p class="lead">Laster…</p></div></main>`;
  const body = container.querySelector("#adminBody");

  const paintLogin = (err) => {
    body.innerHTML = `
      <header class="detail-head">
        <p class="detail-cat">Admin</p>
        <h1>Logg inn</h1>
        <p class="lead">Kun for administrator. Kjøkkenstab trenger ikke å logge inn.</p>
      </header>
      <form id="loginForm" class="admin-form">
        <input id="adminEmail" class="admin-input" type="email" placeholder="E-post" autocomplete="username" required />
        <input id="adminPass" class="admin-input" type="password" placeholder="Passord" autocomplete="current-password" required />
        <button type="submit" class="admin-btn">Logg inn</button>
        ${err ? `<p class="admin-err">${esc(err)}</p>` : ""}
      </form>`;
    body.querySelector("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = body.querySelector("#adminEmail").value.trim();
      const pass = body.querySelector("#adminPass").value;
      const btn = body.querySelector(".admin-btn");
      btn.disabled = true;
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (er) {
        paintLogin(mapErr(er));
      }
    });
  };

  const paintPanel = (user) => {
    const admin = isAdmin(user);
    body.innerHTML = `
      <header class="detail-head">
        <p class="detail-cat">Admin</p>
        <h1>Adminpanel</h1>
        <p class="lead">Logget inn som ${esc(user.email)}${admin ? "" : " — <strong>ikke admin</strong>"}.</p>
      </header>
      ${
        admin
          ? `<section class="dsec">
              <h2 class="dsec-title">Importer data til Firestore</h2>
              <p>Skriver den innebygde menyen (retter, oppskrifter, prep) til Firestore. Overskriver eksisterende retter; legger til oppskrifter og prep. Kjør én gang.</p>
              <button id="importBtn" class="admin-btn">Importer til Firestore</button>
              <pre id="importLog" class="admin-log" hidden></pre>
            </section>`
          : `<p class="admin-err">Denne kontoen har ikke admin-tilgang.</p>`
      }
      <button id="logoutBtn" class="admin-btn admin-btn-ghost">Logg ut</button>`;

    body.querySelector("#logoutBtn").addEventListener("click", () => signOut(auth));

    if (admin) {
      const btn = body.querySelector("#importBtn");
      const log = body.querySelector("#importLog");
      btn.addEventListener("click", async () => {
        if (!window.confirm("Importere og overskrive rettene i Firestore?")) return;
        btn.disabled = true;
        log.hidden = false;
        log.textContent = "Starter import…\n";
        try {
          await importSeedToFirestore((m) => {
            log.textContent += m + "\n";
          });
          log.textContent += "✓ Ferdig – dataene er i Firestore.\n";
        } catch (er) {
          log.textContent += "Feil: " + (er.message || er) + "\n";
        } finally {
          btn.disabled = false;
        }
      });
    }
  };

  onAuthStateChanged(auth, (user) => {
    if (user) paintPanel(user);
    else paintLogin();
  });
}
