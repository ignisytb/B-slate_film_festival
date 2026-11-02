const BOOKMARK_STORAGE_KEY = 'nangman_bookmarks';
const FILM_POSTER_DIR = 'assets/img/posters/film';
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

function posterPath(film) {
  return `${FILM_POSTER_DIR}/${encodeURIComponent(film.folder)}/poster.jpg`;
}

function stillPaths(film) {
  return (film.stills || []).map(path => encodeURI(path));
}

function imageSources(film) {
  return [...stillPaths(film), posterPath(film)];
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
  return `${day}일차`;
}

function formatRuntime(runningTime) {
  return runningTime ?? '러닝타임 미정';
}

function formatScreeningTime(screening) {
  return `${screening.start}~${screening.end} (${screening.part}부)`;
}

function shortHallName(hall) {
  return hall.ko.replace('DGIST ', '');
}

function compareScreening(a, b) {
  return a.screening.day - b.screening.day
    || a.screening.start.localeCompare(b.screening.start)
    || a.screening.hall.ko.localeCompare(b.screening.hall.ko)
    || (a.screening.order ?? 0) - (b.screening.order ?? 0);
}
