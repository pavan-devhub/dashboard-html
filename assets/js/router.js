/**
 * Dashboard router - shows one view in the main column, from the URL hash, as the React
 * dashboard's activeTab / ERS / Plans state did:
 *
 *   #home (or no hash)          Home: banner, FEED Services, Quick Access, widgets
 *   #profile-details|products|vendors|subscriptions   My Profile, on that tab
 *   #status                     Status of Activities
 *   #ers                        ERS - Export Readiness Assessment
 *   #plans                      Membership Plans
 *   #<any other menu entry>     Home content, with that entry selected (as in the React app)
 *   #<id of an element>         scrolls to it, opening the view that holds it (e.g. #db-alerts)
 *
 * Because views live in the hash, the browser's Back/Forward buttons and bookmarks work.
 * The left column (FEED Updates, menu, overview cards) stays on every view.
 */
(function (FEED) {
  'use strict';

  const { $, $$ } = FEED.utils;

  const TITLES = {
    home: null,
    profile: 'My Profile',
    status: 'Status of Activities',
    ers: 'ERS Assessment',
    plans: 'Membership Plans'
  };
  const PROFILE_TABS = ['profile-details', 'profile-products', 'profile-vendors', 'profile-subscriptions'];
  const BASE_TITLE = document.title;

  let layout, crumbs;
  let current = { view: 'home', key: 'home' };
  // Where "Back to Dashboard" on the ERS / Plans views returns to (the view they were opened from)
  let returnHash = '#home';

  /** Hash -> { view, key, nav, anchor } */
  function resolve(hash) {
    const id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id || id === 'home') return { view: 'home', key: 'home', nav: 'home' };
    if (PROFILE_TABS.includes(id)) return { view: 'profile', key: id, nav: id };
    if (id === 'status') return { view: 'status', key: id, nav: id };
    if (id === 'ers' || id === 'plans') return { view: id, key: id, nav: null };
    // Menu entries without a page of their own show the Home content
    if ($(`.db-nav a[href="#${CSS.escape(id)}"]`)) return { view: 'home', key: id, nav: id };
    const target = document.getElementById(id);
    if (target) {
      const panel = target.closest('[data-view-panel]');
      const view = panel ? panel.getAttribute('data-view-panel') : current.view;
      // Jumping into another view (e.g. FEED Updates' "See All" from My Profile) selects it in the menu
      if (view === current.view) return { view, key: current.key, nav: null, anchor: target };
      return { view, key: view, nav: view === 'home' ? 'home' : null, anchor: target };
    }
    return null;
  }

  function showView(view, key) {
    layout.setAttribute('data-view', view);
    $$('[data-view-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-view-panel') !== view;
    });
    if (view === 'profile') {
      $$('[data-profile-panel]').forEach((panel) => { panel.hidden = panel.getAttribute('data-profile-panel') !== key; });
      $$('.db-profile-tab').forEach((tab) => {
        if (tab.getAttribute('href') === `#${key}`) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
      });
    }
  }

  function updateBreadcrumb(view, key) {
    if (!crumbs) return;
    const tab = view === 'profile' ? $(`.db-profile-tab[href="#${key}"]`) : null;
    const trail = [];
    if (view !== 'home') trail.push(TITLES[view]);
    if (tab) trail.push(tab.textContent.trim());
    crumbs.innerHTML =
      '<li><a href="#" data-route="home">Home</a></li>' +
      (trail.length
        ? '<li><a href="#home">My Dashboard</a></li>' +
          trail.map((label, i) => (i === trail.length - 1
            ? `<li><span aria-current="page">${FEED.utils.esc(label)}</span></li>`
            : `<li><a href="#${view === 'profile' ? 'profile-details' : view}">${FEED.utils.esc(label)}</a></li>`)).join('')
        : '<li><span aria-current="page">My Dashboard</span></li>');
  }

  function updateTitle(view, key) {
    const tab = view === 'profile' ? $(`.db-profile-tab[href="#${key}"]`) : null;
    const name = tab ? tab.textContent.trim() : TITLES[view];
    document.title = name ? `${name} · ${BASE_TITLE}` : BASE_TITLE;
  }

  function apply(fromUser) {
    const route = resolve(location.hash);
    if (!route) return; // an unknown hash leaves the page as it is

    const changed = route.view !== current.view || route.key !== current.key;
    if (route.view !== 'ers' && route.view !== 'plans' && !route.anchor) returnHash = location.hash || '#home';

    showView(route.view, route.key);
    if (route.nav) FEED.sidebar.select(route.nav);
    current = { view: route.view, key: route.key };

    updateBreadcrumb(route.view, route.key);
    updateTitle(route.view, route.key);
    $$('[data-back-link]').forEach((link) => link.setAttribute('href', returnHash));
    document.dispatchEvent(new CustomEvent('feed:view', { detail: { view: route.view, key: route.key } }));

    if (route.anchor) {
      route.anchor.scrollIntoView({ behavior: fromUser ? 'smooth' : 'auto', block: 'start' });
      return;
    }
    if (changed || fromUser) {
      if (fromUser) {
        // A choice in the dashboard menu (or any link) lands on the top of the content it opened in
        // the main column, just below the navbar - not on the top of the page, which would scroll
        // the menu away and show the banner instead
        const content = $(`.db-main > [data-view-panel="${route.view}"]`);
        if (content) content.scrollIntoView({ block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        // The first load opens at the top of the page
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      // ...and screen-reader and keyboard users land on its heading
      if (fromUser) {
        const panel = route.view === 'profile'
          ? $(`[data-profile-panel="${route.key}"]`)
          : $(`[data-view-panel="${route.view}"]:not([hidden])`);
        const heading = panel && $('[data-view-focus]', panel);
        if (heading) heading.focus({ preventScroll: true });
      }
    }
  }

  /** Goes to a view by hash ('#plans'); a click on an <a href="#..."> does the same by itself. */
  function go(hash) {
    if (location.hash === hash) apply(true);
    else location.hash = hash;
  }

  function init() {
    layout = $('.db-layout');
    crumbs = $('[data-breadcrumb]');
    if (!layout) return;
    window.addEventListener('hashchange', () => apply(true));
    // Re-selecting the view you're on (e.g. Home while on Home) still scrolls back to its top
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (link && link.getAttribute('href') === location.hash && resolve(location.hash)) apply(true);
    });
    apply(false);
  }

  FEED.router = { init, go, current: () => current };
})(window.FEED = window.FEED || {});
