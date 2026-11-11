/**
 * Membership Plans (#plans) - "Upgrade to …" sends an upgrade request: the button shows
 * "Sending request…", then "Request Sent". Subscriptions are activated after admin approval.
 * In the React app this is also a front-end only step; hook your API into sendRequest().
 * (behaviour ported from src/components/plans/PlansPage.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, icon } = FEED.utils;
  const SENDING_MS = 900;
  let busy = false;

  function sendRequest(planName) {
    return new Promise((resolve) => setTimeout(() => resolve(planName), SENDING_MS));
  }

  function init() {
    const grid = $('[data-plans]');
    if (!grid) return;
    grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-plan-upgrade]');
      if (!button || button.disabled || busy) return;
      const plan = button.getAttribute('data-plan-upgrade');
      busy = true;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `${icon('loader-circle', 16, { className: 'plan-spin' })} Sending request…`;
      sendRequest(plan).then(() => {
        busy = false;
        button.removeAttribute('aria-busy');
        button.innerHTML = `${icon('circle-check', 16)} Request Sent`;
        FEED.toast(`Upgrade request for ${plan} sent. You'll be notified once it's approved.`, { tone: 'success' });
      });
    });
  }

  FEED.plans = { init };
})(window.FEED = window.FEED || {});
