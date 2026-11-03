const FILM_INDEX_PATH = './assets/data/film_index.json';
const SECTION_DATA_PATH = './assets/data/section.json';
const EUNMAK_SECTION_ID = 'eunmak';
const ALL = 'all';
const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

let films = [];
let sectionsById = {};

let currentTab = 'catalog';
let selectedDay = ALL;
let selectedSectionId = ALL;
let searchText = '';
let bookmarks = loadBookmarks();

function isEunmak(film) {
  return film.section === EUNMAK_SECTION_ID;
}

function sectionOf(film) {
  return sectionsById[film.section];
}

function festivalSections() {
  return Object.values(sectionsById).filter(section => section.id !== EUNMAK_SECTION_ID);
}

function normalizedSearchText() {
  return searchText.trim().toLowerCase();
}

function isDefaultCatalog() {
  return selectedSectionId === ALL && !normalizedSearchText();
}

function matchesSearch(film) {
  const query = normalizedSearchText();
  if (!query) return true;
  return [film.title.ko, film.title.en, film.director.ko, film.director.en]
    .some(text => text.toLowerCase().includes(query));
}

function sectionBadgeTitle(section) {
  return currentLanguage === DEFAULT_LANGUAGE
    ? `${section.title.ko} (${section.title.en})`
    : section.title.en;
}

function renderSectionDot(section) {
  return `<span class="section-dot" style="background:${section.hex};"></span>`;
}

function matchesSection(film) {
  return selectedSectionId === ALL || film.section === selectedSectionId;
}

function toggleFav(id, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  bookmarks = bookmarks.includes(id)
    ? bookmarks.filter(bookmarkedId => bookmarkedId !== id)
    : [...bookmarks, id];
  saveBookmarks(bookmarks);
  updateFavCount();
  renderCurrentView();
}

function updateFavCount() {
  const count = document.getElementById('fav-count');
  if (count) count.textContent = bookmarks.length;
}

function setActiveNav(tab) {
  document.querySelectorAll('.nav-btn').forEach(button => button.classList.remove('active'));
  const activeButton = document.getElementById('nav-' + tab);
  if (activeButton) activeButton.classList.add('active');
}

function switchTab(tab) {
  currentTab = tab;
  setActiveNav(tab);
  window.location.hash = '';
  window.scrollTo(0, 0);
  renderCurrentView();
}

function switchHeroPoster(src, button) {
  const img = document.getElementById('hero-poster-img');
  if (img) img.src = src;
  document.querySelectorAll('.ps-chip').forEach(chip => chip.classList.remove('active'));
  if (button) button.classList.add('active');
}

function openPosterModal(src) {
  const modal = document.getElementById('poster-lightbox-modal');
  const modalImg = document.getElementById('lightbox-modal-img');
  if (!modal || !modalImg) return;
  modalImg.src = src || document.getElementById('hero-poster-img').src;
  modal.classList.add('open');
}

function closePosterModal() {
  const modal = document.getElementById('poster-lightbox-modal');
  if (modal) modal.classList.remove('open');
}

function changeMainStill(src) {
  const mainImg = document.getElementById('detail-main-still-img');
  if (mainImg) mainImg.src = src;
}

function renderFavButton(film) {
  const isFav = bookmarks.includes(film.id);
  return `
    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${film.id}', event)" aria-label="${t('common.save_to_favs')}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART_PATH}"/></svg>
    </button>
  `;
}

function renderSectionChips() {
  const chips = [
    { id: ALL, label: t('common.all') },
    ...Object.values(sectionsById).map(section => ({
      id: section.id,
      label: section.id === EUNMAK_SECTION_ID ? t('eunmak.chip') : localized(section.title),
      hex: section.hex,
    })),
  ];

  return `
    <div class="filter-bar">
      ${chips.map(chip => `
        <button class="chip ${chip.id === EUNMAK_SECTION_ID ? 'chip-eunmak' : ''} ${selectedSectionId === chip.id ? 'active' : ''}" onclick="selectSection('${chip.id}')">
          ${chip.hex ? `<span class="chip-dot" style="background:${chip.hex};"></span>` : ''}
          ${escapeHtml(chip.label)}
        </button>
      `).join('')}
    </div>
  `;
}

function renderSearchBox() {
  return `
    <div class="search-box">
      <svg viewBox="0 0 24 24"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/></svg>
      <input id="search-input" type="text" placeholder="${t('catalog.search_placeholder')}" value="${escapeHtml(searchText)}" oninput="handleSearch(this.value)">
    </div>
  `;
}

function renderSectionBanner(section) {
  return `
    <div class="color-curator-banner">
      <div class="ccb-top">
        <span class="ccb-color-badge" style="background:${section.hex};">
          ${renderSectionDot(section)}${escapeHtml(sectionBadgeTitle(section))}
        </span>
        <span class="ccb-subtitle">${escapeHtml(localized(section.subtitle))}</span>
      </div>
      <p class="ccb-desc">${escapeHtml(localized(section.desc))}</p>
      <div class="ccb-tags">
        ${localized(section.keywords).map(keyword => `<span class="ccb-tag">#${escapeHtml(keyword)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderSpectrumGuide() {
  return `
    <div class="spectrum-guide-bar">
      <div class="sgb-header">
        <span>${t('catalog.spectrum_title')}</span>
        <span>${t('catalog.spectrum_hint')}</span>
      </div>
      <div class="sgb-list">
        ${festivalSections().map(section => `
          <div class="sgb-item">
            <span class="sgb-name" style="color:${section.hex};">${renderSectionDot(section)}${escapeHtml(localized(section.title))}</span>
            <span class="sgb-meaning">${escapeHtml(localized(section.subtitle))}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCatalogIntro() {
  if (selectedSectionId !== ALL) return renderSectionBanner(sectionsById[selectedSectionId]);
  if (isDefaultCatalog()) return renderSpectrumGuide();
  return '';
}

function renderSpotlightCard(film, badgeClass, badgeLabel) {
  return `
    <a class="spotlight-card" href="${filmLink(film)}">
      <div class="spotlight-media-wrap">
        <span class="spotlight-badge-floating ${badgeClass}">${badgeLabel}</span>
        <span style="display: none;" class="spotlight-widescreen-tag">16:9 CINEMA</span>
        ${imageTag(imageSources(film))}
      </div>
      <div class="spotlight-info">
        <div class="spotlight-meta-row">
          <span class="spotlight-hall">${formatDay(film.screening.day)} ${film.screening.start} · ${escapeHtml(localized(film.screening.hall))}</span>
          <span>${escapeHtml(formatRuntime(film.running_time))}${film.is_gv ? ' · GV' : ''}</span>
        </div>
        <h3 class="spotlight-film-title">${escapeHtml(localized(film.title))}</h3>
        <p class="spotlight-logline">${escapeHtml(localized(film.logline) || localized(film.synopsis))}</p>
      </div>
    </a>
  `;
}

function renderSpotlight() {
  const openingFilm = films.find(film => film.is_opening);
  const closingFilm = films.find(film => film.is_closing);

  return `
    <div class="spotlight-section">
      <div class="spotlight-header">
        <span class="spotlight-title">🎬 FESTIVAL HIGHLIGHT : OPENING & CLOSING</span>
        <span style="display:none; font-size:0.7rem;color:var(--gold);font-weight:700;">${t('catalog.spotlight_venue')}</span>
      </div>
      <div class="spotlight-grid">
        ${openingFilm ? renderSpotlightCard(openingFilm, 'badge-opening', t('catalog.opening_badge')) : ''}
        ${closingFilm ? renderSpotlightCard(closingFilm, 'badge-closing', t('catalog.closing_badge')) : ''}
      </div>
    </div>
  `;
}

function renderSectionTag(film) {
  if (isEunmak(film)) {
    // return `<span class="fc-color-tag" style="background:var(--color-eunmak);color:#0369a1;font-weight:800;">${t('eunmak.tag')}</span>`;
    return `<span class="fc-color-tag" style="background:var(--color-eunmak);color:#0369a1;font-weight:800;"></span>`;
  }
  const section = sectionOf(film);
  // return `<span class="fc-color-tag" style="background:${section.hex};">${escapeHtml(localized(section.title))}</span>`;
  return `<span class="fc-color-tag" style="background:${section.hex};"></span>`;
}

function renderFilmCard(film) {
  return `
    <a class="film-card" href="${filmLink(film)}">
      ${renderFavButton(film)}
      <div class="fc-still-wrap">
        <span class="fc-runtime-tag">${escapeHtml(formatRuntime(film.running_time))}</span>
        ${renderSectionTag(film)}
        ${imageTag(imageSources(film))}
        <div class="fc-still-fallback">
          <span class="icon">🎬</span>
          <span class="txt">${escapeHtml(localized(film.title))}</span>
        </div>
      </div>
      <div class="fc-info">
        <h3 class="fc-title">${renderSectionDot(sectionOf(film))}${escapeHtml(localized(film.title))}</h3>
        <p class="fc-director">${isEunmak(film) ? t('film.presented_by_eunmak') : t('film.director', { name: escapeHtml(localized(film.director)) })}</p>
        <div class="fc-meta-sub">
          <span>${formatDay(film.screening.day)} (${screeningDate(film.screening.day)})</span>
          ${film.is_gv ? `<span class="badge-gv-simple">GV</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

function renderEmptyState(icon, message, style = '') {
  return `
    <div class="empty-state" style="${style}">
      <div class="icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

function renderEunmakPanel() {
  const eunmakFilms = films.filter(isEunmak);

  return `
    <div class="eunmak-bottom-panel">
      <div class="ebp-header">
        <span class="ebp-badge">🤝 SPECIAL EXCHANGE PROGRAM</span>
        <span class="ebp-collab">KAIST × DGIST</span>
      </div>
      <h2 class="ebp-title">${t('eunmak.panel_title')}</h2>
      <p class="ebp-desc">${t('eunmak.panel_desc')}</p>
      <div class="ebp-sessions-grid">
        ${eunmakFilms.map(film => `
          <a href="${filmLink(film)}" class="ebp-card-link">
            <span class="time-tag">${formatDay(film.screening.day)} ${t('format.part', film.screening)} · ${film.screening.start}</span>
            <span class="name-tag">${escapeHtml(localized(film.title))}</span>
            <span class="meta-tag">${t('eunmak.panel_meta', { runtime: escapeHtml(formatRuntime(film.running_time)), hall: escapeHtml(shortHallName(film.screening.hall)) })}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFooter(text) {
  return `
    <div class="footer-credits">
      <img src="assets/img/logo/bslate_logo_white.png" class="footer-logo-img" onerror="this.remove();">
      ${text}
    </div>
  `;
}

function sortForDefaultCatalog(items) {
  const openingAndClosing = items.filter(film => film.is_opening || film.is_closing);
  const festivalFilms = items.filter(film => !film.is_opening && !film.is_closing && !isEunmak(film));
  const eunmakFilms = items.filter(isEunmak);
  return [...openingAndClosing, ...festivalFilms, ...eunmakFilms];
}

function renderCatalogView(items, emptyMessage = t('catalog.empty')) {
  const matched = items.filter(film => matchesSection(film) && matchesSearch(film));
  const visibleFilms = isDefaultCatalog() ? sortForDefaultCatalog(matched) : matched;
  const listTitle = selectedSectionId === ALL
    ? t('catalog.archive_title')
    : t('catalog.section_title', { section: localized(sectionsById[selectedSectionId].title) });
  const showEunmakPanel = (selectedSectionId === ALL || selectedSectionId === EUNMAK_SECTION_ID) && !normalizedSearchText();

  return `
    ${renderSectionChips()}
    ${renderSearchBox()}
    ${renderCatalogIntro()}
    ${isDefaultCatalog() ? renderSpotlight() : ''}

    <div class="section-title-bar">
      <span class="section-title">${escapeHtml(listTitle)}</span>
      <span class="section-count">${t('format.film_count', { count: visibleFilms.length })}</span>
    </div>

    <div class="films-grid">
      ${visibleFilms.length
        ? visibleFilms.map(renderFilmCard).join('')
        : renderEmptyState('🎬', emptyMessage, 'grid-column: span 2;')}
    </div>

    ${showEunmakPanel ? renderEunmakPanel() : ''}

    ${renderFooter(`
      <span>2026 BISEUL FILM FESTIVAL '낭만 ; 浪漫 ;'</span>
      <span>${t('footer.host')}</span>
    `)}
  `;
}

function renderScheduleCard(film) {
  const section = sectionOf(film);
  const sectionTag = isEunmak(film)
    ? `<span class="badge-eunmak-tag">${t('eunmak.chip')}</span>`
    : `<span class="badge-color-tag" style="color:${section.hex};">[${escapeHtml(localized(section.title))}]</span>`;
  const credit = isEunmak(film) ? t('eunmak.presented_by') : t('film.director', { name: escapeHtml(localized(film.director)) });

  return `
    <a class="schedule-card" href="${filmLink(film)}">
      <div class="sc-color-strip" style="background:${section.hex};"></div>
      <div class="sc-time-col">
        <div class="sc-time">${film.screening.start}</div>
        <div class="sc-hall">${escapeHtml(shortHallName(film.screening.hall))}</div>
      </div>
      <div class="sc-content">
        <div class="sc-meta">
          ${sectionTag}
          <span style="font-size:0.68rem;color:var(--text-muted);">${escapeHtml(formatRuntime(film.running_time))}</span>
          ${film.is_gv ? `<span class="badge-gv-simple">GV</span>` : ''}
        </div>
        <h2 class="sc-title">${escapeHtml(localized(film.title))}</h2>
        <p class="sc-director">${credit} · ${formatDay(film.screening.day)}</p>
      </div>
    </a>
  `;
}

function renderScheduleView() {
  const days = [...new Set(films.map(film => String(film.screening.day)))];
  const visibleFilms = films.filter(film => selectedDay === ALL || String(film.screening.day) === selectedDay);

  return `
    <div class="filter-bar">
      ${[ALL, ...days].map(day => `
        <button class="chip ${selectedDay === day ? 'active' : ''}" onclick="selectDay('${day}')">${day === ALL ? t('common.all') : formatDay(day)}</button>
      `).join('')}
    </div>

    <div class="schedule-list">
      ${visibleFilms.length
        ? visibleFilms.map(renderScheduleCard).join('')
        : renderEmptyState('📅', t('schedule.empty'))}
    </div>

    ${renderFooter(`<span>2026 BISEUL FILM FESTIVAL '낭만 ; 浪漫 ;' · DGIST E7</span>`)}
  `;
}

function renderDetailPill(film) {
  if (isEunmak(film)) {
    return `
      <span class="detail-color-pill" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
        ${t('eunmak.detail_pill')}
      </span>
    `;
  }
  const section = sectionOf(film);
  return `
    <span class="detail-color-pill" style="background:${section.hex};">
      [${escapeHtml(localized(section.title))}] ${escapeHtml(localized(film.theme))}
    </span>
  `;
}

function renderEunmakBanner() {
  return `
    <div class="eunmak-detail-banner">
      <div class="icon">🤝</div>
      <div class="txt">
        <b>${t('eunmak.detail_banner_title')}</b><br>
        ${t('eunmak.detail_banner_desc')}
      </div>
    </div>
  `;
}

function renderGvBanner(film) {
  return `
    <div class="gv-detail-banner">
      <span class="badge">GV</span>
      <div class="txt">
        <b>${t('detail.gv_title')}</b><br>
        ${t('detail.gv_desc', { hall: escapeHtml(shortHallName(film.screening.hall)) })}
      </div>
    </div>
  `;
}

function renderStillsGallery(stills) {
  if (!stills.length) return '';

  return `
    <div class="stills-gallery-section">
      <div class="sgs-header">
        <span class="sgs-title">🎬 STILLS</span>
        <span class="sgs-ratio">1920 × 1080 (16:9)</span>
      </div>
      <div class="stills-thumb-grid">
        ${stills.map(still => `
          <div class="still-thumb-item" data-src="${still}" onclick="changeMainStill(this.dataset.src)">
            ${imageTag([still])}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCreditRow(label, value) {
  return value ? `<tr><th>${label}</th><td>${escapeHtml(value)}</td></tr>` : '';
}

function renderCredits(film) {
  const actors = film.cast.map(member => localized(member.name)).join(', ');
  const roles = film.cast
    .filter(member => localized(member.role))
    .map(member => t('credit.role_entry', { role: localized(member.role), name: localized(member.name) }))
    .join(', ');
  const writer = film.writer.ko !== film.director.ko ? localized(film.writer) : '';

  return `
    <table class="credits-table">
      ${renderCreditRow(isEunmak(film) ? t('credit.presenter') : t('credit.director'), localized(film.director))}
      ${renderCreditRow(t('credit.writer'), writer)}
      ${renderCreditRow(t('credit.cast'), actors)}
      ${renderCreditRow(t('credit.roles'), roles)}
      ${isEunmak(film) ? renderCreditRow(t('credit.affiliation'), t('eunmak.affiliation')) : ''}
    </table>
  `;
}

async function showStillsGallery(film) {
  const stills = await findStills(film);
  const gallery = document.getElementById('stills-gallery');
  if (gallery && gallery.dataset.filmId === film.id) gallery.innerHTML = renderStillsGallery(stills);
}

function renderDetailView(film) {
  if (!film) return renderEmptyState('🎬', t('detail.not_found'));

  return `
    <div class="detail-view">
      <a class="back-btn" href="javascript:history.back()">${t('detail.back')}</a>

      <div class="detail-hero-card">
        ${renderFavButton(film)}

        <div class="detail-widescreen-wrap">
          <span class="detail-widescreen-watermark">SCREEN</span>
          ${imageTag(imageSources(film), 'id="detail-main-still-img"')}
          <div class="detail-widescreen-placeholder">${escapeHtml(localized(film.title))}</div>
        </div>

        <div class="detail-hero-content">
          ${renderDetailPill(film)}

          <h1 class="detail-title">${escapeHtml(localized(film.title))}</h1>

          <div class="detail-meta-line">
            <span>${t('detail.screening')}: <b>${formatDay(film.screening.day)} ${formatScreeningTime(film.screening)}</b></span>
            <span>${t('detail.venue')}: <b>${escapeHtml(localized(film.screening.hall))}</b></span>
            <span>${t('detail.runtime')}: <b>${escapeHtml(formatRuntime(film.running_time))}</b></span>
          </div>

          ${isEunmak(film) ? renderEunmakBanner() : ''}
          ${film.is_gv ? renderGvBanner(film) : ''}
          ${localized(film.logline) ? `<div class="logline-box">"${escapeHtml(localized(film.logline))}"</div>` : ''}
        </div>
      </div>

      <div id="stills-gallery" data-film-id="${film.id}"></div>

      <div class="detail-section">
        <h3>SYNOPSIS</h3>
        <p class="synopsis-text">${escapeHtml(localized(film.synopsis) || t('detail.synopsis_empty'))}</p>
      </div>

      <div class="detail-section">
        <h3>CAST & CREW</h3>
        ${renderCredits(film)}
      </div>
    </div>
  `;
}

function renderCurrentView() {
  const app = document.getElementById('app-content');
  const filmId = filmIdFromHash(window.location.hash);

  if (filmId) {
    const film = films.find(candidate => candidate.id === filmId);
    app.innerHTML = renderDetailView(film);
    window.scrollTo(0, 0);
    if (film) showStillsGallery(film);
    return;
  }

  if (currentTab === 'schedule') {
    app.innerHTML = renderScheduleView();
  } else if (currentTab === 'catalog') {
    app.innerHTML = renderCatalogView(films);
  } else if (currentTab === 'favs') {
    const favFilms = films.filter(film => bookmarks.includes(film.id));
    app.innerHTML = renderCatalogView(favFilms, t('catalog.favs_empty'));
  }
}

function selectDay(day) {
  selectedDay = day;
  renderCurrentView();
}

function selectSection(sectionId) {
  selectedSectionId = sectionId;
  renderCurrentView();
}

function focusSearchInputAtEnd() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function handleSearch(text) {
  searchText = text;
  renderCurrentView();
  focusSearchInputAtEnd();
}

async function loadFilms() {
  const filmIndex = await loadJson(FILM_INDEX_PATH);
  return Promise.all(filmIndex.map(async ({ folder }) => ({ ...await loadJson(filmDataPath(folder)), folder })));
}

function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) return;
  currentLanguage = language;
  saveLanguage(language);
  applyStaticTranslations();
  renderCurrentView();
}

async function init() {
  currentLanguage = initialLanguage();
  updateFavCount();
  setActiveNav(currentTab);

  try {
    const [filmData, sectionData] = await Promise.all([loadFilms(), loadJson(SECTION_DATA_PATH), loadDictionaries()]);
    films = filmData.sort(compareScreening);
    sectionsById = Object.fromEntries(sectionData.map(section => [section.id, section]));
  } catch (error) {
    console.error(error);
    document.getElementById('app-content').innerHTML = renderEmptyState('⚠️', t('common.load_error'));
    return;
  }

  applyStaticTranslations();
  window.addEventListener('hashchange', renderCurrentView);
  renderCurrentView();
}

init();
