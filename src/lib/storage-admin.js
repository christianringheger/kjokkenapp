// Admin-lag mot Firebase Storage: last opp bilde og returner nedlastings-URL.
// Skriving krever admin (håndheves av storage.rules). Brukes fra editoren.
import { initFirebase } from "./firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { validateImageFile, safeFileName } from "./upload-validate.js";

// Last opp `file` til media/<prefix>/<tid>-<navn>. onProgress(pct) 0–100.
// Kaster feil ved ugyldig fil eller opplastingsfeil. Returnerer URL-en.
export async function uploadImage(prefix, file, onProgress, ts) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const { storage } = initFirebase();
  const stamp = ts || Date.now();
  const path = `media/${prefix}/${stamp}-${safeFileName(file.name)}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type,
  });
  await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress && snap.totalBytes) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      resolve
    );
  });
  return getDownloadURL(task.snapshot.ref);
}
