// «Meld feil»: kjøkkenstab (uten innlogging) sender en melding til kjedekontoret.
// Lagres i Firestore-samlingen `reports` (offentlig opprett, admin leser — se
// firestore.rules). Innsending + global UI-håndtering for skjemaet på detaljsider.
import { initFirebase } from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";

const MAX = 1500;

export async function submitReport({ ref, title, message, reporter }) {
  const { db } = initFirebase();
  await addDoc(collection(db, "reports"), {
    ref: ref || "",
    title: title || "",
    message: String(message || "").trim().slice(0, MAX),
    reporter: reporter ? String(reporter).trim().slice(0, 120) : "",
    created: new Date().toISOString(),
    handled: false,
  });
}

// Global håndtering: åpne/lukke skjema + send. Skjemaet ligger på detaljsider.
export function initReports() {
  document.addEventListener("click", async (e) => {
    const toggle = e.target.closest("[data-report-toggle]");
    if (toggle) {
      const form = toggle.parentElement.querySelector("[data-report-form]");
      if (form) {
        form.hidden = !form.hidden;
        if (!form.hidden) form.querySelector("[data-report-msg]").focus();
      }
      return;
    }
    const send = e.target.closest("[data-report-send]");
    if (!send) return;
    const form = send.closest("[data-report-form]");
    const msg = form.querySelector("[data-report-msg]").value.trim();
    const name = form.querySelector("[data-report-name]").value.trim();
    const status = form.querySelector("[data-report-status]");
    if (!msg) {
      status.textContent = "Skriv en melding først.";
      return;
    }
    send.disabled = true;
    status.textContent = "Sender …";
    try {
      await submitReport({
        ref: form.dataset.ref,
        title: form.dataset.title,
        message: msg,
        reporter: name,
      });
      form.innerHTML = `<p class="report-thanks">Takk! Meldingen er sendt til kjedekontoret.</p>`;
    } catch (er) {
      status.textContent = "Kunne ikke sende: " + (er.message || er);
      send.disabled = false;
    }
  });
}
