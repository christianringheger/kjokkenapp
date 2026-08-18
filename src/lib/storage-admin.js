// Admin-lag mot Firebase Storage: last opp bilde og returner nedlastings-URL.
// Store bilder krympes + komprimeres i nettleseren FØR opplasting, så siden
// holder seg lett. Skriving krever admin (håndheves av storage.rules).
import { initFirebase } from "./firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { validateImageFile, safeFileName } from "./upload-validate.js";

const MAX_EDGE = 1600; // lengste side (px) etter krymping
const QUALITY = 0.82; // WebP/JPEG-kvalitet
const SKIP_UNDER = 400 * 1024; // hopp over krymping for filer < 400 KB som alt er små

// Les fila til et bitmap/bilde, med korrekt EXIF-orientering der det støttes.
async function loadImage(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (_) {
      /* faller tilbake til <img> under */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("Kunne ikke lese bildet."));
      im.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function supportsWebp() {
  try {
    return document
      .createElement("canvas")
      .toDataURL("image/webp")
      .startsWith("data:image/webp");
  } catch (_) {
    return false;
  }
}

// Krymp til maks MAX_EDGE og re-kod til WebP (ev. JPEG). Returnerer
// { blob, type, ext } — original beholdes hvis den alt er liten nok.
export async function downscaleImage(file) {
  let img;
  try {
    img = await loadImage(file);
  } catch (_) {
    return { blob: file, type: file.type, ext: null }; // klarte ikke dekode → last opp som den er
  }
  const w = img.width;
  const h = img.height;
  const longEdge = Math.max(w, h);
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1;

  if (scale === 1 && file.size <= SKIP_UNDER) {
    if (img.close) img.close();
    return { blob: file, type: file.type, ext: null };
  }

  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
  if (img.close) img.close();

  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  const blob = await new Promise((res) => canvas.toBlob(res, type, QUALITY));

  // Fallback hvis toBlob feilet, eller hvis «komprimert» ble større enn originalen.
  if (!blob || (scale === 1 && blob.size >= file.size)) {
    return { blob: file, type: file.type, ext: null };
  }
  return { blob, type, ext: type === "image/webp" ? "webp" : "jpg" };
}

// Last opp `file` til media/<prefix>/<tid>-<navn>. onProgress(pct) 0–100.
// Kaster feil ved ugyldig fil eller opplastingsfeil. Returnerer URL-en.
export async function uploadImage(prefix, file, onProgress, ts) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const { storage } = initFirebase();
  const stamp = ts || Date.now();

  const { blob, type, ext } = await downscaleImage(file);
  let name = safeFileName(file.name);
  if (ext) name = name.replace(/\.[a-z0-9]+$/i, "") + "." + ext;
  const path = `media/${prefix}/${stamp}-${name}`;

  const task = uploadBytesResumable(ref(storage, path), blob, {
    contentType: type,
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
