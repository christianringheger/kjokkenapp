// Medieblokk øverst på detaljsider: bilde (forstørrbart) + video (lightbox).
// Leser item.image (URL) og item.video (YouTube/Vimeo/embed-URL).
import { esc } from "./dom.js";

const PLAY = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
const ZOOM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;

// Gjør en YouTube-/Vimeo-lenke om til embed-URL (ellers antas den å være embed).
export function normVideo(v) {
  v = (v || "").trim();
  if (!v) return "";
  let m;
  if ((m = v.match(/youtube\.com\/watch\?v=([\w-]+)/)))
    return "https://www.youtube.com/embed/" + m[1];
  if ((m = v.match(/youtu\.be\/([\w-]+)/)))
    return "https://www.youtube.com/embed/" + m[1];
  if ((m = v.match(/vimeo\.com\/(\d+)/)))
    return "https://player.vimeo.com/video/" + m[1];
  return v;
}

// Bilde + evt. play-merke, eller «Se video»-knapp, eller "" (skjult) uten media.
export function mediaBlock(item) {
  const img = item && item.image;
  const vid = normVideo(item && item.video);
  if (img) {
    const alt = esc(item.name || item.title || "");
    const play = vid
      ? `<button class="media-play" type="button" data-vidplay="${esc(
          vid
        )}" aria-label="Se video">${PLAY}</button>`
      : "";
    return `
      <div class="media">
        <button class="media-img" type="button" data-imgview="${esc(
          img
        )}" aria-label="Forstørr bilde">
          <img src="${esc(img)}" alt="${alt}" loading="lazy" />
          <span class="media-zoom">${ZOOM}</span>
        </button>
        ${play}
      </div>`;
  }
  if (vid) {
    return `
      <div class="media">
        <button class="media-vidbtn" type="button" data-vidplay="${esc(vid)}">
          ${PLAY}<span>Se video</span>
        </button>
      </div>`;
  }
  return "";
}

// Oppretter lightbox-DOM (én gang) + globale klikk/Esc-håndterere.
export function initMedia() {
  if (document.getElementById("imgLightbox")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="vidLightbox" class="lb">
      <button class="lb-close" type="button" data-lbclose aria-label="Lukk">✕</button>
      <div class="lb-vid"><iframe id="vidFrame" allow="autoplay; fullscreen" allowfullscreen></iframe></div>
    </div>
    <div id="imgLightbox" class="lb">
      <button class="lb-close" type="button" data-lbclose aria-label="Lukk">✕</button>
      <img id="imgFull" alt="" />
    </div>`;
  document.body.appendChild(wrap);

  const $ = (id) => document.getElementById(id);
  const openVideo = (url) => {
    if (!url) return;
    const sep = url.indexOf("?") > -1 ? "&" : "?";
    $("vidFrame").src = url + sep + "autoplay=1&rel=0";
    $("vidLightbox").classList.add("open");
    document.body.classList.add("lb-open");
  };
  const closeVideo = () => {
    $("vidFrame").src = "";
    $("vidLightbox").classList.remove("open");
    document.body.classList.remove("lb-open");
  };
  const openImg = (url) => {
    if (!url) return;
    $("imgFull").src = url;
    $("imgLightbox").classList.add("open");
    document.body.classList.add("lb-open");
  };
  const closeImg = () => {
    $("imgLightbox").classList.remove("open");
    $("imgFull").src = "";
    document.body.classList.remove("lb-open");
  };
  const closeAll = () => {
    closeVideo();
    closeImg();
  };

  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-vidplay]");
    if (v) {
      e.preventDefault();
      openVideo(v.getAttribute("data-vidplay"));
      return;
    }
    const i = e.target.closest("[data-imgview]");
    if (i) {
      e.preventDefault();
      openImg(i.getAttribute("data-imgview"));
      return;
    }
    if (e.target.closest("[data-lbclose]")) {
      closeAll();
      return;
    }
    if (e.target.id === "vidLightbox") closeVideo();
    if (e.target.id === "imgLightbox") closeImg();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}
