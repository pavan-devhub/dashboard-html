/**
 * Overview cards in the left column:
 * - ERS: shows where the member stands (not started / passed / not passed, score ring, date) and
 *   opens the assessment from anywhere on the card;
 * - Plan: "Manage Plan" opens the plans (a plain link to #plans).
 * (behaviour ported from src/pages/Dashboard.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, icon, esc, formatDate } = FEED.utils;
  const RING_RADIUS = 36;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  let card;

  function render(status) {
    const attempted = status.attempted;
    const tone = !attempted ? 'pending' : status.passed ? 'pass' : 'fail';
    const pct = Math.round(status.percentage || 0);

    // Left: the hexagon until there is a score, then the score ring
    const visual = $('.db-ers-hex, .db-ers-ring', card);
    if (attempted) {
      const offset = RING_CIRCUMFERENCE * (1 - pct / 100);
      visual.outerHTML =
        `<div class="db-ers-ring" role="img" aria-label="Score ${pct}%">` +
          '<svg viewBox="0 0 100 100" aria-hidden="true">' +
            '<defs><linearGradient id="ersRingGrad2" x1="0%" y1="100%" x2="100%" y2="0%">' +
              '<stop offset="0%" stop-color="#4338ca"/><stop offset="100%" stop-color="#a855f7"/>' +
            '</linearGradient></defs>' +
            `<circle class="db-ers-ring-track" cx="50" cy="50" r="${RING_RADIUS}"/>` +
            `<circle class="db-ers-ring-fill" cx="50" cy="50" r="${RING_RADIUS}" style="stroke-dasharray:${RING_CIRCUMFERENCE};stroke-dashoffset:${offset}"/>` +
          '</svg>' +
          `<div class="db-ers-ring-center"><span class="db-ers-ring-value">${pct}%</span></div>` +
        '</div>';
    } else if (visual.classList.contains('db-ers-ring')) {
      visual.outerHTML =
        '<div class="db-ers-hex" aria-hidden="true">' +
          '<img class="db-ers-hex-shape" src="assets/images/dashboard/art/ers-hex.svg" alt="" width="100" height="110">' +
          icon('users', 22, { stroke: 2.2 }) +
        '</div>';
    }

    $('.db-ers-encourage-title', card).textContent =
      !attempted ? "Let's Begin!" : status.passed ? 'Great Progress!' : 'Keep Going!';

    // Right: the status pill, and the date once there is one
    const column = $('.db-ers-status-col', card);
    const pillIcon = !attempted ? 'clock' : status.passed ? 'badge-check' : 'circle-alert';
    const pillText = !attempted ? 'Not Started' : status.passed ? 'Passed' : 'Not Passed';
    const date = status.completedOn ? formatDate(status.completedOn) : '';
    column.innerHTML =
      '<span class="db-ers-status-eyebrow">Assessment Status</span>' +
      `<span class="db-ers-status-pill is-${tone}">${icon(pillIcon, 15, { stroke: 2.4 })} ${esc(pillText)}</span>` +
      (date ? `<span class="db-ers-status-date">${icon('calendar', 11)} ${esc(date)}</span>` : '');

    $('.db-ers-cta-text', card).textContent =
      !attempted ? 'Start Assessment' : status.passed ? 'View Results' : 'Retake Assessment';
  }

  function init() {
    card = $('[data-ers-card]');
    if (!card) return;
    render(FEED.ersStore.get());
    document.addEventListener('feed:ers-status', (event) => render(event.detail));

    // The whole ERS card opens the assessment, as in the React app (the link inside is the
    // keyboard / screen-reader way in)
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      FEED.router.go('#ers');
    });
  }

  FEED.summaryCards = { init };
})(window.FEED = window.FEED || {});
