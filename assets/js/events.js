const EVENT_ROUTE = '#event';

const TICKET_PRIZES = [
  { rank: 1, amount: 30000, winners: 1 },
  { rank: 2, amount: 5000, winners: 4 }
];

const STAMP_SLOTS = 6;
const BONUS_SLOT_INDEX = 5;
const STAMP_REWARDS = [
  { count: 1, key: 'jelly' },
  { count: 3, key: 'badge' },
  { count: 5, key: 'voucher', amount: 5000 }
];

function formatWon(amount) {
  return amount.toLocaleString('ko-KR');
}

function renderGummyBear(color) {
  return `
    <svg class="gummy-bear" viewBox="0 0 64 72" aria-hidden="true">
      <g fill="${color}" stroke="#111" stroke-width="2.5">
        <circle cx="18" cy="12" r="8"/>
        <circle cx="46" cy="12" r="8"/>
        <ellipse cx="32" cy="26" rx="18" ry="16"/>
        <ellipse cx="14" cy="44" rx="7" ry="9"/>
        <ellipse cx="50" cy="44" rx="7" ry="9"/>
        <ellipse cx="32" cy="50" rx="17" ry="18"/>
        <ellipse cx="20" cy="66" rx="8" ry="5"/>
        <ellipse cx="44" cy="66" rx="8" ry="5"/>
      </g>
      <circle cx="26" cy="24" r="2" fill="#111"/>
      <circle cx="38" cy="24" r="2" fill="#111"/>
      <ellipse cx="25" cy="44" rx="4" ry="7" fill="#fff" opacity="0.45"/>
    </svg>
  `;
}

function renderJellyArt() {
  return `
    <div class="prize-art jelly-art">
      ${renderGummyBear('#ff3b1f')}
      ${renderGummyBear('#ffe14d')}
      ${renderGummyBear('#7cc45a')}
    </div>
  `;
}

function renderBadgeArt() {
  return `
    <div class="prize-art badge-art">
      <span class="acrylic-badge">
        <img src="assets/img/logo/bslate_logo_dark.png" alt="" onerror="this.remove();">
        <span class="acrylic-shine"></span>
      </span>
    </div>
  `;
}

function renderVoucherArt(amount, size = '') {
  return `
    <div class="voucher-card ${size}">
      <span class="voucher-brand">${t('event.voucher_brand')}</span>
      <b class="voucher-amount">₩${formatWon(amount)}</b>
      <span class="voucher-label">GIFT CARD</span>
    </div>
  `;
}

function renderStampRewardArt(reward) {
  if (reward.key === 'jelly') return renderJellyArt();
  if (reward.key === 'badge') return renderBadgeArt();
  return `<div class="prize-art">${renderVoucherArt(reward.amount, 'small')}</div>`;
}

function renderEventIntro() {
  return `
    <section class="event-intro">
      <p class="event-kicker">EVENT ; 11.18 – 11.20</p>
      <h2 class="event-title">${t('event.intro_title')}</h2>
      <p class="event-lead">${t('event.intro_lead')}</p>
      <div class="event-jump-row">
        <a class="event-jump ticket" href="#event-ticket" onclick="scrollToEventSection('event-ticket', event)">
          <span class="jump-icon">🎟️</span>
          <span class="jump-name">${t('event.ticket_name')}</span>
          <span class="jump-prize">${t('event.ticket_jump_prize')}</span>
        </a>
        <a class="event-jump stamp" href="#event-stamp" onclick="scrollToEventSection('event-stamp', event)">
          <span class="jump-icon">🖍️</span>
          <span class="jump-name">${t('event.stamp_name')}</span>
          <span class="jump-prize">${t('event.stamp_jump_prize')}</span>
        </a>
      </div>
    </section>
  `;
}

function renderEntrySlipHalf(kind) {
  return `
    <div class="slip-half slip-${kind}">
      <span class="slip-label">${t(`event.slip_${kind}`)}</span>
      <b class="slip-no">No.042</b>
      <span class="slip-brand">${kind === 'keep' ? '낭만 ;' : 'B_SLATE'}</span>
    </div>
  `;
}

function renderTicketArt() {
  return `
    <div class="ticket-art-wrap" aria-hidden="true">
      <div class="entry-slip">
        ${renderEntrySlipHalf('keep')}
        ${renderEntrySlipHalf('drop')}
        <span class="slip-scissors">✂️</span>
      </div>
      <span class="staff-tag">🙋 ${t('event.ticket_staff')}</span>
    </div>
  `;
}

function renderSteps(stepKeys) {
  return `
    <ol class="event-steps">
      ${stepKeys.map((key, index) => `
        <li class="event-step">
          <span class="step-no">${index + 1}</span>
          <span class="step-icon">${t(`event.${key}_icon`)}</span>
          <span class="step-text">${t(`event.${key}`)}</span>
        </li>
      `).join('')}
    </ol>
  `;
}

function renderPrizeTier(prize) {
  const vouchers = Array.from({ length: prize.winners }, () => renderVoucherArt(prize.amount, prize.rank === 1 ? 'large' : 'small'));
  return `
    <div class="prize-tier rank-${prize.rank}">
      <div class="voucher-stack count-${prize.winners}">${vouchers.join('')}</div>
      <b class="prize-tier-label">${t('event.rank_winners', { rank: prize.rank, count: prize.winners })}</b>
    </div>
  `;
}

function renderTicketEvent() {
  return `
    <section class="event-card" id="event-ticket">
      <div class="event-card-head">
        <span class="event-tag">EVENT 01</span>
        <h3>🎟️ ${t('event.ticket_title')}</h3>
        <p>${t('event.ticket_summary')}</p>
      </div>

      ${renderTicketArt()}
      ${renderSteps(['ticket_step_1', 'ticket_step_2', 'ticket_step_3'])}

      <div class="event-highlight">${t('event.ticket_more')}</div>

      <h4 class="event-subhead">🏆 ${t('event.ticket_prize_title')}</h4>
      <div class="prize-row">${TICKET_PRIZES.map(renderPrizeTier).join('')}</div>

      <div class="event-notice">
        <p>📣 ${t('event.ticket_draw')}</p>
        <p>⚠️ ${t('event.ticket_attend')}</p>
      </div>
    </section>
  `;
}

function renderSlotLabel(index) {
  return index === BONUS_SLOT_INDEX
    ? '<span class="slot-bonus">★<br>BONUS</span>'
    : `<span class="slot-no">${index + 1}</span>`;
}

function renderStampSlot(index) {
  const isBonus = index === BONUS_SLOT_INDEX;
  const reward = STAMP_REWARDS.find(item => item.count === index + 1);
  return `
    <div class="stamp-slot ${isBonus ? 'bonus' : ''}">
      ${renderSlotLabel(index)}
      ${reward ? `<span class="slot-gift">🎁</span>` : ''}
    </div>
  `;
}

function renderLeafletArt() {
  return `
    <div class="leaflet-art" aria-hidden="true">
      <div class="leaflet-head">
        <span>STAMP RALLY</span>
        <b>낭만 ;</b>
      </div>
      <div class="leaflet-slots">
        ${Array.from({ length: STAMP_SLOTS }, (_, index) => renderStampSlot(index)).join('')}
      </div>
    </div>
  `;
}

function renderStampReward(reward) {
  return `
    <li class="stamp-reward">
      <span class="reward-count">${t('event.stamp_count', { count: reward.count })}</span>
      ${renderStampRewardArt(reward)}
      <b class="reward-name">${t(`event.reward_${reward.key}`)}</b>
    </li>
  `;
}

function renderStampEvent() {
  return `
    <section class="event-card" id="event-stamp">
      <div class="event-card-head">
        <span class="event-tag">EVENT 02</span>
        <h3>🖍️ ${t('event.stamp_title')}</h3>
        <p>${t('event.stamp_summary')}</p>
      </div>

      ${renderLeafletArt()}
      ${renderSteps(['stamp_step_1', 'stamp_step_2', 'stamp_step_3'])}

      <h4 class="event-subhead">🎁 ${t('event.stamp_prize_title')}</h4>
      <ol class="stamp-rewards">${STAMP_REWARDS.map(renderStampReward).join('')}</ol>

      <div class="event-highlight">${t('event.stamp_all')}</div>
      <div class="event-highlight bonus-note">★ ${t('event.stamp_bonus')}</div>

      <div class="event-notice">
        <p>📍 ${t('event.stamp_where')}</p>
        <p>✔️ ${t('event.stamp_rule')}</p>
      </div>
    </section>
  `;
}

function renderEventCta() {
  return `
    <div class="event-cta">
      <p>${t('event.cta_text')}</p>
      <button type="button" class="event-cta-btn" onclick="switchTab('schedule')">📅 ${t('event.cta_button')}</button>
    </div>
  `;
}

function renderEventView() {
  return `
    <div class="event-view">
      ${renderEventIntro()}
      ${renderTicketEvent()}
      ${renderStampEvent()}
      ${renderEventCta()}
    </div>
    ${renderFooter(`<span>2026 B_SLATE FILM FESTIVAL '낭만 ; 浪漫 ;' · DGIST E7</span>`)}
  `;
}

function scrollToEventSection(id, event) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
