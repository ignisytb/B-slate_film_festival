const FILM_INDEX_PATH = './assets/data/film_index.json';
const SECTION_DATA_PATH = './assets/data/section.json';
const EUNMAK_SECTION_ID = 'eunmak';
const ALL = 'all';
const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

let films = [];
let filmIndexOrder = [];
let sectionsById = {};

let currentTab = 'catalog';
let selectedSlots = new Set();
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

  const isFavsList = currentTab === 'favs' && !filmIdFromHash(window.location.hash);
  if (isFavsList) {
    renderCurrentView();
  } else {
    updateFavButtons(id);
  }
}

function updateFavButtons(id) {
  const isFav = bookmarks.includes(id);
  document.querySelectorAll(`.fav-btn[data-film-id="${id}"]`).forEach(button => button.classList.toggle('active', isFav));
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

const HERO_POSTERS = [
  { src: 'assets/img/posters/main_poster.jpg', titleKey: 'poster.main', altKey: 'hero.poster_alt' },
  { src: 'assets/img/posters/sub_poster_1.jpg', titleKey: 'poster.sub_1', altKey: 'poster.sub_1' },
  { src: 'assets/img/posters/sub_poster_2.jpg', titleKey: 'poster.sub_2', altKey: 'poster.sub_2' },
  { src: 'assets/img/posters/teaser_poster_b.jpg', titleKey: 'poster.teaser_black', altKey: 'poster.teaser_black' },
  { src: 'assets/img/posters/teaser_poster_w.jpg', titleKey: 'poster.teaser_white', altKey: 'poster.teaser_white' }
];

let currentPosterIndex = 0;
let posterAutoTimer = null;
const POSTER_AUTO_INTERVAL = 6000;

function updateHeroPosterUI(index) {
  const img = document.getElementById('hero-poster-img');
  const poster = HERO_POSTERS[index];
  if (!poster || !img) return;

  img.style.opacity = '0';
  setTimeout(() => {
    img.src = poster.src;
    img.setAttribute('alt', t(poster.altKey));
    img.style.opacity = '1';
  }, 220);

  const dots = document.querySelectorAll('.hero-poster-dots .poster-dot');
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

function updateHeroPosterAlt() {
  const img = document.getElementById('hero-poster-img');
  const poster = HERO_POSTERS[currentPosterIndex];
  if (img && poster) {
    img.setAttribute('alt', t(poster.altKey));
  }
}

function goToHeroPoster(index, isUserAction = false, event = null) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  currentPosterIndex = (index + HERO_POSTERS.length) % HERO_POSTERS.length;
  updateHeroPosterUI(currentPosterIndex);

  if (isUserAction) {
    restartPosterAutoPlay();
  }
}

function navigateHeroPoster(direction, event = null) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  goToHeroPoster(currentPosterIndex + direction, true);
}

function startPosterAutoPlay() {
  stopPosterAutoPlay();
  posterAutoTimer = setInterval(() => {
    if (isPosterModalOpen()) return;
    goToHeroPoster(currentPosterIndex + 1, false);
  }, POSTER_AUTO_INTERVAL);
}

function stopPosterAutoPlay() {
  if (posterAutoTimer) {
    clearInterval(posterAutoTimer);
    posterAutoTimer = null;
  }
}

function restartPosterAutoPlay() {
  stopPosterAutoPlay();
  startPosterAutoPlay();
}

function initHeroPosterSlider() {
  const container = document.querySelector('.hero-poster-container');
  if (container) {
    container.addEventListener('mouseenter', stopPosterAutoPlay);
    container.addEventListener('mouseleave', () => {
      if (!isPosterModalOpen()) startPosterAutoPlay();
    });
  }
  startPosterAutoPlay();
}

function openPosterModal(src) {
  stopPosterAutoPlay();
  const modal = document.getElementById('poster-lightbox-modal');
  const modalImg = document.getElementById('lightbox-modal-img');
  if (!modal || !modalImg) return;
  modalImg.src = src || document.getElementById('hero-poster-img').src;
  modal.classList.add('open');
}

function closePosterModal() {
  const modal = document.getElementById('poster-lightbox-modal');
  if (modal) modal.classList.remove('open');
  startPosterAutoPlay();
}

function isPosterModalOpen() {
  const modal = document.getElementById('poster-lightbox-modal');
  return Boolean(modal && modal.classList.contains('open'));
}

function isTypingTarget(element) {
  return Boolean(element.closest('input, textarea, [contenteditable="true"]'));
}

function handleEscapeKey(event) {
  if (event.key !== 'Escape') return;
  if (isPosterModalOpen()) {
    closePosterModal();
    return;
  }
  if (isTypingTarget(event.target)) return;
  if (filmIdFromHash(window.location.hash)) window.location.hash = '';
}

function changeMainStill(src) {
  const mainImg = document.getElementById('detail-main-still-img');
  if (mainImg) mainImg.src = src;
}

function renderFavButton(film) {
  const isFav = bookmarks.includes(film.id);
  return `
    <button class="fav-btn ${isFav ? 'active' : ''}" data-film-id="${film.id}" onclick="toggleFav('${film.id}', event)" aria-label="${t('common.save_to_favs')}">
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
          ${film.is_eng ? `<span class="badge-eng-simple">Eng</span>` : ''}
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

function catalogItems() {
  return currentTab === 'favs' ? films.filter(film => bookmarks.includes(film.id)) : films;
}

function catalogEmptyMessage() {
  return currentTab === 'favs' ? t('catalog.favs_empty') : t('catalog.empty');
}

function renderCatalogResults(items, emptyMessage) {
  const matched = items.filter(film => matchesSection(film) && matchesSearch(film));
  const visibleFilms = isDefaultCatalog() ? sortForDefaultCatalog(matched) : matched;
  const isFavs = currentTab === 'favs';
  const defaultTitle = isFavs ? (t('catalog.favs_title') || t('tab.favs')) : t('catalog.archive_title');
  const listTitle = selectedSectionId === ALL
    ? defaultTitle
    : t('catalog.section_title', { section: localized(sectionsById[selectedSectionId].title) });
  const showEunmakPanel = !isFavs && (selectedSectionId === ALL || selectedSectionId === EUNMAK_SECTION_ID)
      && !normalizedSearchText();

  return `
    ${!isFavs ? renderCatalogIntro() : ''}
    ${!isFavs && isDefaultCatalog() ? renderSpotlight() : ''}

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
      <span>2026 BSLATE FILM FESTIVAL '낭만 ; 浪漫 ;'</span>
      <span>${t('footer.host')}</span>
    `)}
  `;
}

function renderCatalogView(items, emptyMessage = t('catalog.empty')) {
  return `
    ${renderSectionChips()}
    ${renderSearchBox()}
    <div id="catalog-results">
      ${renderCatalogResults(items, emptyMessage)}
    </div>
  `;
}

function renderSessionFavButton(film) {
  const isFav = bookmarks.includes(film.id);
  return `
    <button class="fav-btn session-fav-btn ${isFav ? 'active' : ''}" data-film-id="${film.id}" onclick="toggleFav('${film.id}', event)" aria-label="${t('common.save_to_favs')}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART_PATH}"/></svg>
    </button>
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
        <div class="sc-hall">${escapeHtml(shortHallName(film.screening.hall))}</div>
        <div class="sc-time">${film.screening.start}</div>
      </div>
      <div class="sc-content">
        <div class="sc-meta">
          ${sectionTag}
          <span style="font-size:0.68rem;color:var(--text-muted);">${escapeHtml(formatRuntime(film.running_time))}</span>
          ${film.is_eng ? `<span class="badge-eng-simple">Eng</span>` : ''}
          ${film.is_gv ? `<span class="badge-gv-simple">GV</span>` : ''}
        </div>
        <h2 class="sc-title">${escapeHtml(localized(film.title))}</h2>
        <p class="sc-director">${credit} · ${formatDay(film.screening.day)}</p>
      </div>
      ${renderSessionFavButton(film)}
    </a>
  `;
}

function slotKey(day, part) {
  return `${day}-${part}`;
}

function isInSelectedSlots(film) {
  return selectedSlots.size === 0 || selectedSlots.has(slotKey(film.screening.day, film.screening.part));
}

function compareFilmIndex(a, b) {
  return filmIndexOrder.indexOf(a.id) - filmIndexOrder.indexOf(b.id);
}

function screeningDays() {
  return [...new Set(films.map(film => film.screening.day))].sort((a, b) => a - b);
}

function partsOn(day) {
  return [...new Set(films.filter(film => film.screening.day === day).map(film => film.screening.part))].sort((a, b) => a - b);
}

function filmsInSlot(day, part) {
  return films.filter(film => film.screening.day === day && film.screening.part === part);
}

function renderPartButton(day, part) {
  const slotFilms = filmsInSlot(day, part);
  const detail = `${slotFilms[0].screening.start} · ${t('format.film_count', { count: slotFilms.length })}`;

  return `
    <button type="button" class="calendar-part" aria-pressed="${selectedSlots.has(slotKey(day, part))}"
      onclick="toggleSlot(${day}, ${part})">
      <span class="calendar-part-name">${t('format.part', { part })}</span>
      <span class="calendar-part-detail">${detail}</span>
    </button>
  `;
}

function renderCalendarDay(day) {
  return `
    <div class="calendar-day">
      <div class="calendar-date">
        <span class="calendar-date-md">${screeningDate(day)}</span>
        <span class="calendar-date-day">${formatDay(day)}</span>
      </div>
      <div class="calendar-parts">
        ${partsOn(day).map(part => renderPartButton(day, part)).join('')}
      </div>
    </div>
  `;
}

function renderSelectedSlots(count) {
  const labels = [...selectedSlots].sort().map(key => {
    const [day, part] = key.split('-');
    return `${formatDay(day)} ${t('format.part', { part })}`;
  });

  return `
    <div class="calendar-status">
      <span>${labels.length ? labels.join(', ') : t('common.all')} · ${t('format.film_count', { count })}</span>
      <button type="button" class="chip ${selectedSlots.size ? '' : 'active'}" onclick="clearSlots()">${t('common.all')}</button>
    </div>
  `;
}

function renderScheduleView() {
  const visibleFilms = films.filter(isInSelectedSlots).sort(compareFilmIndex);

  return `
    <hr class="calendar-divider">
    <div class="schedule-calendar">
      ${screeningDays().map(renderCalendarDay).join('')}
    </div>
    ${renderSelectedSlots(visibleFilms.length)}

    <div class="schedule-list">
      ${visibleFilms.length
        ? visibleFilms.map(renderScheduleCard).join('')
        : renderEmptyState('📅', t('schedule.empty'))}
    </div>

    ${renderFooter(`<span>2026 BSLATE FILM FESTIVAL '낭만 ; 浪漫 ;' · DGIST E7</span>`)}
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
      ${renderCreditRow(t('credit.director'), localized(film.director))}
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

      ${hasEpisodes(film) ? renderEpisodes(film) : `
      <div class="detail-section">
        <h3>SYNOPSIS</h3>
        <p class="synopsis-text">${escapeHtml(localized(film.synopsis) || t('detail.synopsis_empty'))}</p>
      </div>

      <div class="detail-section">
        <h3>CAST & CREW</h3>
        ${renderCredits(film)}
      </div>
      `}

      ${renderReviewSection(film)}
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
    if (film) {
      showStillsGallery(film);
      showReviews(film.id);
    }
    return;
  }

  if (currentTab === 'schedule') {
    app.innerHTML = renderScheduleView();
  } else {
    app.innerHTML = renderCatalogView(catalogItems(), catalogEmptyMessage());
  }
}

function toggleSlot(day, part) {
  const key = slotKey(day, part);
  if (selectedSlots.has(key)) selectedSlots.delete(key);
  else selectedSlots.add(key);
  renderCurrentView();
}

function clearSlots() {
  selectedSlots.clear();
  renderCurrentView();
}

function selectSection(sectionId) {
  selectedSectionId = sectionId;
  renderCurrentView();
}

function handleSearch(text) {
  searchText = text;
  document.getElementById('catalog-results').innerHTML = renderCatalogResults(catalogItems(), catalogEmptyMessage());
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
  updateHeroPosterAlt();
  renderCurrentView();
}

async function init() {
  currentLanguage = initialLanguage();
  updateFavCount();
  setActiveNav(currentTab);

  try {
    const [filmData, sectionData] = await Promise.all([loadFilms(), loadJson(SECTION_DATA_PATH), loadDictionaries()]);
    filmIndexOrder = filmData.map(film => film.id);
    films = filmData.sort(compareScreening);
    sectionsById = Object.fromEntries(sectionData.map(section => [section.id, section]));
  } catch (error) {
    console.error(error);
    document.getElementById('app-content').innerHTML = renderEmptyState('⚠️', t('common.load_error'));
    return;
  }

  applyStaticTranslations();
  window.addEventListener('hashchange', renderCurrentView);
  document.addEventListener('keydown', handleEscapeKey);
  initHeroPosterSlider();
  renderCurrentView();
}

init();
