const FILM_INDEX_PATH = './assets/data/film_index.json';
const SECTION_DATA_PATH = './assets/data/section.json';
const EUNMAK_SECTION_ID = 'eunmak';
const ALL = 'all';

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
    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${film.id}', event)" aria-label="보관함 담기">
      ${isFav ? '♥' : '♡'}
    </button>
  `;
}

function renderSectionChips() {
  const chips = [
    { id: ALL, label: '전체' },
    ...Object.values(sectionsById).map(section => ({
      id: section.id,
      label: section.id === EUNMAK_SECTION_ID ? '🤝 KAIST 은막' : section.title.ko,
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
      <input id="search-input" type="text" placeholder="작품명 또는 감독 검색..." value="${escapeHtml(searchText)}" oninput="handleSearch(this.value)">
    </div>
  `;
}

function renderSectionBanner(section) {
  return `
    <div class="color-curator-banner">
      <div class="ccb-top">
        <span class="ccb-color-badge" style="background:${section.hex};">
          ${section.icon} ${escapeHtml(section.title.ko)} (${escapeHtml(section.title.en)})
        </span>
        <span class="ccb-subtitle">${escapeHtml(section.subtitle.ko)}</span>
      </div>
      <p class="ccb-desc">${escapeHtml(section.desc.ko)}</p>
      <div class="ccb-tags">
        ${section.keywords.ko.map(keyword => `<span class="ccb-tag">#${escapeHtml(keyword)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderSpectrumGuide() {
  return `
    <div class="spectrum-guide-bar">
      <div class="sgb-header">
        <span>🎨 2026 비슬영화제 5대 감정 무드 컬러 스펙트럼</span>
        <span>상단 칩을 눌러 무드별 탐색 가능</span>
      </div>
      <div class="sgb-list">
        ${festivalSections().map(section => `
          <div class="sgb-item">
            <span class="sgb-name" style="color:${section.hex};">${section.icon} ${escapeHtml(section.title.ko)}</span>
            <span class="sgb-meaning">${escapeHtml(section.subtitle.ko)}</span>
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
        <span class="spotlight-widescreen-tag">16:9 CINEMA</span>
        ${imageTag(imageSources(film))}
      </div>
      <div class="spotlight-info">
        <div class="spotlight-meta-row">
          <span class="spotlight-hall">${formatDay(film.screening.day)} ${film.screening.start} · ${escapeHtml(film.screening.hall.ko)}</span>
          <span>${escapeHtml(formatRuntime(film.running_time))}${film.is_gv ? ' · GV' : ''}</span>
        </div>
        <h3 class="spotlight-film-title">${escapeHtml(film.title.ko)}</h3>
        <p class="spotlight-logline">${escapeHtml(film.logline.ko || film.synopsis.ko)}</p>
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
        <span style="font-size:0.7rem;color:var(--gold);font-weight:700;">DGIST E7 메인홀</span>
      </div>
      <div class="spotlight-grid">
        ${openingFilm ? renderSpotlightCard(openingFilm, 'badge-opening', '✨ 개막작 (OPENING FILM)') : ''}
        ${closingFilm ? renderSpotlightCard(closingFilm, 'badge-closing', '🌙 폐막작 (CLOSING FILM)') : ''}
      </div>
    </div>
  `;
}

function renderSectionTag(film) {
  if (isEunmak(film)) {
    return `<span class="fc-color-tag" style="background:var(--color-eunmak);color:#0369a1;font-weight:800;">KAIST 은막</span>`;
  }
  const section = sectionOf(film);
  return `<span class="fc-color-tag" style="background:${section.hex};">${escapeHtml(section.title.ko)}</span>`;
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
          <span class="txt">${escapeHtml(film.title.ko)}</span>
        </div>
      </div>
      <div class="fc-info">
        <h3 class="fc-title">${escapeHtml(film.title.ko)}</h3>
        <p class="fc-director">${isEunmak(film) ? '출품: KAIST 은막' : '감독: ' + escapeHtml(film.director.ko)}</p>
        <div class="fc-meta-sub">
          <span>${formatDay(film.screening.day)}</span>
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
      <h2 class="ebp-title">카이스트 영화제작동아리 ‘은막’ 초청 교류전</h2>
      <p class="ebp-desc">
        카이스트(KAIST) 유일의 중앙 영화제작동아리 <b>'은막(銀幕)'</b>과의 특별 상호 교류 프로그램입니다. 과학기술특성화대학 청년 창작자들의 스크린 너머 시선과 새로운 예술적 시도를 2일차 E7 A관에서 상영합니다.
      </p>
      <div class="ebp-sessions-grid">
        ${eunmakFilms.map(film => `
          <a href="${filmLink(film)}" class="ebp-card-link">
            <span class="time-tag">${formatDay(film.screening.day)} ${film.screening.part}부 · ${film.screening.start}</span>
            <span class="name-tag">${escapeHtml(film.title.ko)}</span>
            <span class="meta-tag">러닝타임 ${escapeHtml(formatRuntime(film.running_time))} · ${escapeHtml(shortHallName(film.screening.hall))}</span>
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

function renderCatalogView(items, emptyMessage = '해당 조건의 상영작이 없습니다.') {
  const matched = items.filter(film => matchesSection(film) && matchesSearch(film));
  const visibleFilms = isDefaultCatalog() ? sortForDefaultCatalog(matched) : matched;
  const listTitle = selectedSectionId === ALL
    ? '상영작 아카이브 (16:9 스틸컷)'
    : `${sectionsById[selectedSectionId].title.ko} 세션 상영작`;
  const showEunmakPanel = (selectedSectionId === ALL || selectedSectionId === EUNMAK_SECTION_ID) && !normalizedSearchText();

  return `
    ${renderSectionChips()}
    ${renderSearchBox()}
    ${renderCatalogIntro()}
    ${isDefaultCatalog() ? renderSpotlight() : ''}

    <div class="section-title-bar">
      <span class="section-title">${escapeHtml(listTitle)}</span>
      <span class="section-count">${visibleFilms.length}편</span>
    </div>

    <div class="films-grid">
      ${visibleFilms.length
        ? visibleFilms.map(renderFilmCard).join('')
        : renderEmptyState('🎬', emptyMessage, 'grid-column: span 2;')}
    </div>

    ${showEunmakPanel ? renderEunmakPanel() : ''}

    ${renderFooter(`
      <span>2026 BISEUL FILM FESTIVAL '낭만 ; 浪漫 ;'</span>
      <span>주최: DGIST 영화제작동아리 B_SLATE · 전 상영관 DGIST E7</span>
    `)}
  `;
}

function renderScheduleCard(film) {
  const section = sectionOf(film);
  const sectionTag = isEunmak(film)
    ? `<span class="badge-eunmak-tag">🤝 KAIST 은막</span>`
    : `<span class="badge-color-tag" style="color:${section.hex};">[${escapeHtml(section.title.ko)}]</span>`;
  const credit = isEunmak(film) ? '출품: 카이스트 영화제작동아리 은막' : '감독: ' + escapeHtml(film.director.ko);

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
        <h2 class="sc-title">${escapeHtml(film.title.ko)}</h2>
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
        <button class="chip ${selectedDay === day ? 'active' : ''}" onclick="selectDay('${day}')">${day === ALL ? '전체' : formatDay(day)}</button>
      `).join('')}
    </div>

    <div class="schedule-list">
      ${visibleFilms.length
        ? visibleFilms.map(renderScheduleCard).join('')
        : renderEmptyState('📅', '해당 일자의 상영작이 없습니다.')}
    </div>

    ${renderFooter(`<span>2026 BISEUL FILM FESTIVAL '낭만 ; 浪漫 ;' · DGIST E7</span>`)}
  `;
}

function renderDetailPill(film) {
  if (isEunmak(film)) {
    return `
      <span class="detail-color-pill" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
        🤝 KAIST 영화제작동아리 은막(銀幕) 초청 교류전
      </span>
    `;
  }
  const section = sectionOf(film);
  return `
    <span class="detail-color-pill" style="background:${section.hex};">
      [${escapeHtml(section.title.ko)}] ${escapeHtml(film.theme.ko)}
    </span>
  `;
}

function renderEunmakBanner() {
  return `
    <div class="eunmak-detail-banner">
      <div class="icon">🤝</div>
      <div class="txt">
        <b>[KAIST × DGIST 영화 교류전]</b><br>
        본 작품은 카이스트(KAIST) 중앙 영화제작동아리 <b>'은막(銀幕)'</b>의 공식 출품작입니다.
      </div>
    </div>
  `;
}

function renderGvBanner(film) {
  return `
    <div class="gv-detail-banner">
      <span class="badge">GV</span>
      <div class="txt">
        <b>관객과의 대화 [GV] 세션이 진행됩니다.</b><br>
        영화 상영 후 상영관(${escapeHtml(shortHallName(film.screening.hall))})에서 진행됩니다.
      </div>
    </div>
  `;
}

function renderStillsGallery(film) {
  const stills = stillPaths(film);
  if (!stills.length) return '';

  return `
    <div class="stills-gallery-section">
      <div class="sgs-header">
        <span class="sgs-title">🎬 16:9 WIDESCREEN STILLS</span>
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
  const actors = film.cast.map(member => member.name.ko).join(', ');
  const roles = film.cast
    .filter(member => member.role.ko)
    .map(member => `${member.role.ko}(${member.name.ko})`)
    .join(', ');
  const writer = film.writer.ko !== film.director.ko ? film.writer.ko : '';

  return `
    <table class="credits-table">
      ${renderCreditRow(isEunmak(film) ? '출품' : '연출', film.director.ko)}
      ${renderCreditRow('각본', writer)}
      ${renderCreditRow('출연', actors)}
      ${renderCreditRow('배역', roles)}
      ${isEunmak(film) ? renderCreditRow('소속', '카이스트(KAIST) 중앙 영화제작동아리 은막(銀幕)') : ''}
    </table>
  `;
}

function renderDetailView(filmId) {
  const film = films.find(candidate => candidate.id === filmId);
  if (!film) return renderEmptyState('🎬', '영화 정보를 찾을 수 없습니다.');

  return `
    <div class="detail-view">
      <a class="back-btn" href="javascript:history.back()">← 뒤로 가기</a>

      <div class="detail-hero-card">
        ${renderFavButton(film)}

        <div class="detail-widescreen-wrap">
          <span class="detail-widescreen-watermark">16:9 WIDESCREEN</span>
          ${imageTag(imageSources(film), 'id="detail-main-still-img"')}
          <div class="detail-widescreen-placeholder">${escapeHtml(film.title.ko)}</div>
        </div>

        <div class="detail-hero-content">
          ${renderDetailPill(film)}

          <h1 class="detail-title">${escapeHtml(film.title.ko)}</h1>

          <div class="detail-meta-line">
            <span>상영: <b>${formatDay(film.screening.day)} ${formatScreeningTime(film.screening)}</b></span>
            <span>장소: <b>${escapeHtml(film.screening.hall.ko)}</b></span>
            <span>시간: <b>${escapeHtml(formatRuntime(film.running_time))}</b></span>
          </div>

          ${isEunmak(film) ? renderEunmakBanner() : ''}
          ${film.is_gv ? renderGvBanner(film) : ''}
          ${film.logline.ko ? `<div class="logline-box">"${escapeHtml(film.logline.ko)}"</div>` : ''}
        </div>
      </div>

      ${renderStillsGallery(film)}

      <div class="detail-section">
        <h3>SYNOPSIS</h3>
        <p class="synopsis-text">${escapeHtml(film.synopsis.ko || '시놉시스 준비 중입니다.')}</p>
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
    app.innerHTML = renderDetailView(filmId);
    window.scrollTo(0, 0);
    return;
  }

  if (currentTab === 'schedule') {
    app.innerHTML = renderScheduleView();
  } else if (currentTab === 'catalog') {
    app.innerHTML = renderCatalogView(films);
  } else if (currentTab === 'favs') {
    const favFilms = films.filter(film => bookmarks.includes(film.id));
    app.innerHTML = renderCatalogView(favFilms, '아직 낭만 보관함에 담긴 영화가 없습니다.<br>보고 싶은 영화의 하트(♥)를 눌러보세요!');
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

async function init() {
  updateFavCount();
  setActiveNav(currentTab);

  try {
    const [filmData, sectionData] = await Promise.all([loadFilms(), loadJson(SECTION_DATA_PATH)]);
    films = filmData.sort(compareScreening);
    sectionsById = Object.fromEntries(sectionData.map(section => [section.id, section]));
  } catch (error) {
    console.error(error);
    document.getElementById('app-content').innerHTML = renderEmptyState('⚠️', '상영작 정보를 불러오지 못했습니다.<br>잠시 후 다시 시도해 주세요.');
    return;
  }

  window.addEventListener('hashchange', renderCurrentView);
  renderCurrentView();
}

init();
