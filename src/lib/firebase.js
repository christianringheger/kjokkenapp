// Firebase-lag: init (lat), auth-hjelpere og seed-import til Firestore.
// Klient-config er trygg i offentlig repo — sikkerheten ligger i reglene.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, writeBatch, deleteField } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import seed from "../data/seed.json";

const firebaseConfig = {
  apiKey: "AIzaSyCSLtKx1jOz8m7oshob0BbxqeBsBDMiuGU",
  authDomain: "jordbaerpikene-kjokken.firebaseapp.com",
  projectId: "jordbaerpikene-kjokken",
  storageBucket: "jordbaerpikene-kjokken.firebasestorage.app",
  messagingSenderId: "208907309160",
  appId: "1:208907309160:web:dbe4aafca9823d5d8e6bdd",
};

// Må matche firestore.rules + storage.rules.
export const ADMIN_EMAILS = ["christianringheger@gmail.com"];

let services = null;
// Lat init — Firebase starter først når dette kalles (dvs. på admin-ruten).
export function initFirebase() {
  if (services) return services;
  const app = initializeApp(firebaseConfig);
  services = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return services;
}

export function isAdmin(user) {
  const email = user && user.email && user.email.toLowerCase();
  return !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email);
}

export { onAuthStateChanged, signInWithEmailAndPassword, signOut };

// Skriv den innebygde seed-dataen til Firestore.
// Overskriver dishes (set uten merge), legger til recipes/prepitems. `_ord` = rekkefølge.
export async function importSeedToFirestore(onLog) {
  const { db } = initFirebase();
  const collections = [
    ["dishes", seed.dishes],
    ["recipes", seed.recipes],
    ["prepitems", seed.prepitems],
  ];
  for (const [col, items] of collections) {
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(db);
      items.slice(i, i + 400).forEach((it, j) => {
        const id = String(it.id || `${col}_${i + j}`);
        batch.set(doc(db, col, id), { ...it, _ord: i + j });
      });
      await batch.commit();
    }
    onLog && onLog(`${col}: ${items.length} skrevet`);
  }
}

// Engangs-migrering: bruk Matfaglig-avklaringen 20. aug 2026 på de 7 rettene.
// Målrettet og ikke-destruktivt (update): setter `all` der den endres og fjerner
// alReview/alReviewNote — alle andre felt (bilder m.m.) bevares. Kan fjernes etter bruk.
export async function applyMatfagligFix(onLog) {
  const { db } = initFirebase();
  const today = new Date().toISOString().slice(0, 10);
  // Kun croissant-rettene endrer allergensett (får egg); bagel-rettene beholder settet.
  const FIX = {
    p27: ["gluten", "egg", "melk"],
    p28: ["gluten", "egg", "melk", "sulfitt"],
    d58: ["gluten", "egg", "melk"],
    p33: null,
    p34: null,
    p35: null,
    p36: null,
  };
  const batch = writeBatch(db);
  for (const [id, all] of Object.entries(FIX)) {
    const upd = {
      alReview: deleteField(),
      alReviewNote: deleteField(),
      _updated: today,
    };
    if (all) upd.all = all;
    batch.update(doc(db, "dishes", id), upd);
  }
  await batch.commit();
  onLog && onLog(`Oppdatert 7 retter (egg lagt til p27/p28/d58, flagg fjernet).`);
}
