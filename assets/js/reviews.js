const REVIEWS_ENDPOINT = 'https://script.google.com/macros/s/AKfycby9XVevEt8Kuawc15YTqtFRc8jW7lKQXFGkomZNjyTCZfssiWtIGVI5yR-Dmn1YcQsyxA/exec';
const REVIEW_MAX_LENGTH = 300;
const REVIEW_RATE_LIMIT = 5;
const REVIEW_RATE_WINDOW_MS = 10000;
const REVIEW_TIMES_STORAGE_KEY = 'nangman_review_times';

function recentReviewTimes() {
  try {
    const times = JSON.parse(localStorage.getItem(REVIEW_TIMES_STORAGE_KEY) || '[]');
    return times.filter(time => Date.now() - time < REVIEW_RATE_WINDOW_MS);
  } catch {
    return [];
  }
}

function canSendReview() {
  return recentReviewTimes().length < REVIEW_RATE_LIMIT;
}

function recordReviewTime() {
  try {
    localStorage.setItem(REVIEW_TIMES_STORAGE_KEY, JSON.stringify([...recentReviewTimes(), Date.now()]));
  } catch {}
}

async function fetchReviews(filmId) {
  const response = await fetch(`${REVIEWS_ENDPOINT}?film=${encodeURIComponent(filmId)}`);
  const data = await response.json();
  return data.reviews || [];
}

async function postReview(filmId, content) {
  const response = await fetch(REVIEWS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ film: filmId, content }),
  });
  const result = await response.json();
  if (!result.ok) throw new Error('review rejected');
}

function formatReviewTime(time) {
  return new Date(time).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderReviewList(reviews) {
  if (!reviews.length) return `<p class="review-empty">${t('reviews.empty')}</p>`;
  return `
    <ul class="review-list">
      ${reviews.map(review => `
        <li class="review-item">
          <p class="review-content">${escapeHtml(review.content)}</p>
          <span class="review-time">${escapeHtml(formatReviewTime(review.time))}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderReviewSection(film) {
  if (!REVIEWS_ENDPOINT) return '';
  return `
    <div class="detail-section review-section">
      <h3>${t('reviews.title')}</h3>
      <form class="review-form" onsubmit="submitReview(event, '${film.id}')">
        <textarea id="review-input" enterkeyhint="send" onkeydown="handleReviewKeydown(event)" maxlength="${REVIEW_MAX_LENGTH}" placeholder="${escapeHtml(t('reviews.placeholder'))}" required></textarea>
        <div class="review-form-footer">
          <span class="review-notice">${t('reviews.notice')}</span>
          <button type="submit" class="review-submit">${t('reviews.submit')}</button>
        </div>
        <p class="review-status" id="review-status" aria-live="polite"></p>
      </form>
      <div id="review-list" data-film-id="${film.id}">${t('reviews.loading')}</div>
    </div>
  `;
}

async function showReviews(filmId) {
  const list = document.getElementById('review-list');
  if (!list) return;
  let html;
  try {
    html = renderReviewList(await fetchReviews(filmId));
  } catch {
    html = `<p class="review-empty">${t('reviews.load_error')}</p>`;
  }
  const currentList = document.getElementById('review-list');
  if (currentList && currentList.dataset.filmId === filmId) currentList.innerHTML = html;
}

function setReviewStatus(message) {
  const status = document.getElementById('review-status');
  if (status) status.textContent = message;
}

function handleReviewKeydown(event) {
  const isComposing = event.isComposing || event.keyCode === 229;
  if (event.key !== 'Enter' || event.shiftKey || isComposing) return;
  event.preventDefault();
  event.target.form.requestSubmit();
}

async function submitReview(event, filmId) {
  event.preventDefault();
  const form = event.target;
  const input = form.querySelector('#review-input');
  const button = form.querySelector('.review-submit');
  const content = input.value.trim();
  if (!content) return;

  if (!canSendReview()) {
    setReviewStatus(t('reviews.too_fast'));
    return;
  }

  button.disabled = true;
  try {
    await postReview(filmId, content);
    recordReviewTime();
    input.value = '';
    setReviewStatus(t('reviews.sent'));
    await showReviews(filmId);
  } catch {
    setReviewStatus(t('reviews.error'));
  } finally {
    button.disabled = false;
  }
}
