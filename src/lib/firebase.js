// Firebase-lag: init (lat), auth-hjelpere og seed-import til Firestore.
// Klient-config er trygg i offentlig repo — sikkerheten ligger i reglene.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
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
