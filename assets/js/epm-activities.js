/**
 * Status of Activities (#status) - today's date in the header, and each EPM card opens / closes
 * its updates. The cards in the page are sample entries; the React app fills them from the API
 * (see MyEpmActivities.jsx). Its links to the EPM pages go through data-route (config.js).
 * (behaviour ported from src/components/dashboard/MyEpmActivities.jsx)
 */
(function (FEED) {
  'use strict';

  const { $ } = FEED.utils;

  function init() {
    const view = $('#view-status');
    if (!view) return;

    const now = new Date();
    $('[data-today-date]', view).textContent = FEED.utils.formatDate(now);
    $('[data-today-day]', view).textContent = now.toLocaleDateString('en-US', { weekday: 'long' });

    view.addEventListener('click', (event) => {
      const toggle = event.target.closest('.mea-card-main');
      if (!toggle) return;
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.closest('.mea-card').classList.toggle('is-open', open);
      document.getElementById(toggle.getAttribute('aria-controls')).hidden = !open;
    });
  }

  FEED.epmActivities = { init };
})(window.FEED = window.FEED || {});
