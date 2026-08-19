// Admin-lag mot Firestore: liste, hent og lagre dokumenter.
// Lesing er offentlig; skriving krever admin (håndheves av firestore.rules).
// Brukes kun fra editoren bak innlogging (#/admin).
import { initFirebase } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

// Hent hele samlingen sortert på `field` (standard _ord). `_id` = dokument-id.
// Merk: Firestore utelater dokumenter som mangler sorteringsfeltet.
export async function fetchList(col, field = "_ord", dir = "asc") {
  const { db } = initFirebase();
  const snap = await getDocs(query(collection(db, col), orderBy(field, dir)));
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

// Opprett nytt dokument med auto-id. Returnerer den nye id-en.
export async function addDocTo(col, data) {
  const { db } = initFirebase();
  const { _id, ...clean } = data;
  const refDoc = await addDoc(collection(db, col), clean);
  return refDoc.id;
}

// Slett et dokument.
export async function deleteDocById(col, id) {
  const { db } = initFirebase();
  await deleteDoc(doc(db, col, id));
}

export async function fetchDoc(col, id) {
  const { db } = initFirebase();
  const s = await getDoc(doc(db, col, id));
  return s.exists() ? { _id: s.id, ...s.data() } : null;
}

// Skriv hele dokumentet (full overskriving). `data` må inneholde _ord og alle
// felt som skal bevares. Synteitske hjelpefelt (_id) fjernes før skriving.
// Stempler `_updated` (YYYY-MM-DD) så «Sist oppdatert» kan vises i appen.
export async function saveDoc(col, id, data) {
  const { db } = initFirebase();
  const { _id, ...clean } = data;
  clean._updated = new Date().toISOString().slice(0, 10);
  await setDoc(doc(db, col, id), clean);
}
