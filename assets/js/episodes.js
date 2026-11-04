/*
 * 에피소드(옴니버스) 상세 렌더링
 * - film JSON 에 `episodes` 배열이 있는 작품(예: 공포 영화 시리즈)만 사용.
 * - 목록/시간표 카드는 그대로 두고, 상세 화면의 SYNOPSIS / CAST & CREW 자리에
 *   에피소드별 독립 BOX 를 세로로 출력한다.
 * - util.js / i18n.js / main.js 의 전역 함수에 의존하므로 main.js 보다 먼저 로드해도 된다(호출 시점에 해석).
 */

function hasEpisodes(film) {
  return Array.isArray(film.episodes) && film.episodes.length > 0;
}

function renderEpisodeMeta(episode) {
  return [episode.year, localized(episode.genre), episode.running_time]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');
}

function renderEpisodeBox(episode, color) {
  const logline = localized(episode.logline);
  const synopsis = localized(episode.synopsis);

  return `
    <section class="detail-section ep-box">
      <div class="ep-box-header">
        <span class="ep-badge" style="background:${color};">EP.${episode.ep}</span>
        <h3 class="ep-box-title">${escapeHtml(localized(episode.title))}</h3>
        <span class="ep-meta">${renderEpisodeMeta(episode)}</span>
      </div>
      ${logline ? `<div class="ep-logline" style="border-left-color:${color};">"${escapeHtml(logline)}"</div>` : ''}
      ${synopsis ? `<p class="synopsis-text">${escapeHtml(synopsis)}</p>` : ''}
      <table class="credits-table">
        ${renderCreditRow(t('credit.director'), localized(episode.director))}
        ${renderCreditRow(t('credit.writer'), localized(episode.writer))}
        ${renderCreditRow(t('credit.cast'), localized(episode.cast))}
      </table>
    </section>
  `;
}

function renderEpisodes(film) {
  const color = sectionOf(film).hex;
  return `
    <div class="ep-series-header sgs-header"><span class="sgs-title">🎬 EPISODES</span></div>
    ${film.episodes.map(episode => renderEpisodeBox(episode, color)).join('')}
  `;
}
