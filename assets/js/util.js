const BOOKMARK_STORAGE_KEY = 'nangman_bookmarks';
const FILM_DATA_DIR = './assets/data/films';
const FILM_POSTER_DIR = 'assets/img/posters/film';
const FILM_STILL_DIR = 'assets/img/stills';
const MAX_STILLS = 20;
const IMAGE_EXTENSIONS = ['jpg', 'png', 'webp'];
const FILM_ID_PREFIX = 'film_';
const FILM_ROUTE_PREFIX = '#/film/';

function escapeHtml(value) {
  return (value ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {}
}

function filmLink(film) {
  return FILM_ROUTE_PREFIX + film.id.replace(FILM_ID_PREFIX, '');
}

function filmIdFromHash(hash) {
  return hash.startsWith(FILM_ROUTE_PREFIX) ? FILM_ID_PREFIX + hash.slice(FILM_ROUTE_PREFIX.length) : null;
}

function filmDataPath(folder) {
  return `${FILM_DATA_DIR}/${encodeURIComponent(folder)}.json`;
}

function posterPaths(film) {
  return IMAGE_EXTENSIONS.map(extension => `${FILM_POSTER_DIR}/${encodeURIComponent(film.folder)}/poster.${extension}`);
}

function stillPaths(film, number) {
  return IMAGE_EXTENSIONS.map(extension => `${FILM_STILL_DIR}/${encodeURIComponent(film.folder)}/still_${number}.${extension}`);
}

function imageSources(film) {
  return [...stillPaths(film, 1), ...posterPaths(film)];
}

function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function firstExistingImage(sources) {
  for (const src of sources) {
    if (await imageExists(src)) return src;
  }
  return null;
}

async function findStills(film) {
  const stills = [];
  for (let number = 1; number <= MAX_STILLS; number++) {
    const still = await firstExistingImage(stillPaths(film, number));
    if (!still) break;
    stills.push(still);
  }
  return stills;
}

function imageTag(sources, attributes = '') {
  const [first, ...fallbacks] = sources;
  return `<img src="${first}" data-fallbacks="${fallbacks.join('|')}" onerror="showNextImageSource(this)" ${attributes}>`;
}

function showNextImageSource(img) {
  const fallbacks = img.dataset.fallbacks ? img.dataset.fallbacks.split('|') : [];
  if (!fallbacks.length) {
    img.remove();
    return;
  }
  img.dataset.fallbacks = fallbacks.slice(1).join('|');
  img.src = fallbacks[0];
}

function formatDay(day) {
  return t('format.day', { day });
}

function formatRuntime(runningTime) {
  return runningTime ?? t('format.runtime_unknown');
}

function formatScreeningTime(screening) {
  return t('format.screening_time', screening);
}

function shortHallName(hall) {
  return localized(hall).replace('DGIST ', '');
}

function compareScreening(a, b) {
  return a.screening.day - b.screening.day
    || a.screening.start.localeCompare(b.screening.start)
    || a.screening.hall.ko.localeCompare(b.screening.hall.ko)
    || (a.screening.order ?? 0) - (b.screening.order ?? 0);
}
