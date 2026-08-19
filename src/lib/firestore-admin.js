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
} from "firebase/firestore";

// Hent hele samlingen sortert på _ord. `_id` = dokument-id (syntetisk hjelpefelt).
export async function fetchList(col) {
  const { db } = initFirebase();
  const snap = await getDocs(query(collection(db, col), orderBy("_ord")));
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
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
