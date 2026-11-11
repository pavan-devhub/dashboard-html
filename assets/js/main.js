/**
 * Page entry point - starts each component, then wires the page-wide bits: links to the rest of
 * the FEED site (data-route, see config.js), Logout, the member's name, placeholder links, the
 * footer's subscribe form and the copyright year.
 */
(function (FEED) {
  'use strict';

  const { $, $$, userName } = FEED.utils;
  const { routes, routeNames } = FEED.config;

  /**
   * Links to pages outside this dashboard carry data-route="<key>". A configured URL becomes the
   * link's href; without one, the click shows a short notice instead of going nowhere.
   */
  function initRouteLinks() {
    $$('[data-route]').forEach((link) => {
      const url = routes[link.getAttribute('data-route')];
      if (url) link.setAttribute('href', url);
    });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-route]');
      if (!link) return;
      const key = link.getAttribute('data-route');
      if (routes[key]) return; // a real link - let the browser follow it
      event.preventDefault();
      FEED.navbar.closeAll();
      FEED.toast(`${routeNames[key] || 'This page'} is part of the main FEED site and is not included in this dashboard.`);
    });
  }

  /** Logout: the React app ends the session (POST /api/auth/logout) and returns to the home page. */
  function initLogout() {
    $$('[data-action="logout"]').forEach((button) => {
      button.addEventListener('click', () => {
        FEED.navbar.closeAll();
        const target = routes.logout || routes.home;
        if (target) window.location.assign(target);
        else FEED.toast('Logout returns you to the FEED home page, which is not included in this dashboard.');
      });
    });
  }

  /** In-page links in the navbar's menus close the menu they are in (e.g. My Account → Dashboard). */
  function initMenuLinks() {
    document.addEventListener('click', (event) => {
      if (event.target.closest('.fw-account-dropdown a[href^="#"], .nb-panel a[href^="#"]')) FEED.navbar.closeAll();
    });
  }

  /** Links with href="#" (actions the React dashboard also leaves unwired) don't jump to the top. */
  function initPlaceholderLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href="#"]');
      if (link && !link.hasAttribute('data-route')) event.preventDefault();
    });
    // The skip link and "Dashboard" move focus to the main content as well as scrolling to it
    document.addEventListener('click', (event) => {
      if (event.target.closest('a[href="#main-content"]')) $('#main-content').focus({ preventScroll: true });
    });
  }

  /** The member's name in the banner, Status of Activities and the account menu (config.user). */
  function initUser() {
    const name = userName();
    if (name) {
      $$('[data-user-name]').forEach((el) => { el.textContent = name; });
      const accountName = $('.fw-account-name');
      if (accountName) accountName.textContent = name;
      const label = $('.fw-account-label');
      // Above 12 characters the full name no longer fits the pill, so only the first name shows
      if (label) label.textContent = name.length > 12 ? name.split(/\s+/)[0] : name;
    }
    const email = $('.fw-account-email');
    if (email && FEED.config.user.email) email.textContent = FEED.config.user.email;
  }

  /** Footer subscribe form: checks the address in the browser; there is no back end in this export. */
  function initSubscribe() {
    const form = $('[data-subscribe]');
    const status = $('[data-subscribe-status]');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.reset();
      if (status) status.textContent = 'Thank you - you are subscribed to FEED updates.';
    });
  }

  function initYear() {
    const year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function init() {
    // Each screen opens at the top rather than where the browser last left it
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    initUser();
    FEED.navbar.init();
    FEED.devices.init();
    FEED.sidebar.init();
    FEED.router.init();
    FEED.widgets.init();
    FEED.summaryCards.init();
    FEED.ersAssessment.init();
    FEED.plans.init();
    FEED.myDetails.init();
    FEED.epmActivities.init();

    initRouteLinks();
    initLogout();
    initMenuLinks();
    initPlaceholderLinks();
    initSubscribe();
    initYear();
  }

  // Deferred scripts run after parsing, so the DOM is ready here
  init();
})(window.FEED = window.FEED || {});
