/**
 * Dashboard menu - nested accordion, the selected section, and the slide-in drawer below 1200px.
 * Markup: <aside class="db-sidebar" id="db-sidebar"> in dashbaordhtml.html.
 * (behaviour ported from the sidebar in src/pages/Dashboard.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, $$, lockScroll, trapTab } = FEED.utils;
  const DRAWER_MODE = '(max-width: 1199.98px)';

  let sidebar, nav, toggle, backdrop, closeButton;
  let drawerMode = false;
  let drawerOpen = false;

  /* ------------------------------------------------------------ accordion */
  function setBranch(button, open) {
    const list = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(open));
    if (list) list.hidden = !open;
    // Closing a branch closes everything inside it too
    if (!open && list) $$('[aria-expanded="true"]', list).forEach((inner) => setBranch(inner, false));
  }

  // One open branch per level, as in the React app
  function toggleBranch(button) {
    const open = button.getAttribute('aria-expanded') !== 'true';
    if (open) {
      const level = button.closest('ul');
      $$(':scope > li > [aria-expanded="true"]', level).forEach((other) => {
        if (other !== button) setBranch(other, false);
      });
    }
    setBranch(button, open);
  }

  /* ------------------------------------------------------------ selected section */
  // The branch buttons above a row, outermost first
  function ownersOf(link) {
    const owners = [];
    let list = link.closest('.db-nav-sublist');
    while (list) {
      const owner = nav.querySelector(`[aria-controls="${list.id}"]`);
      if (!owner) break;
      owners.unshift(owner);
      list = owner.closest('.db-nav-sublist');
    }
    return owners;
  }

  function selectLink(link, { reveal }) {
    $$('.is-active, .has-active', nav).forEach((item) => item.classList.remove('is-active', 'has-active'));
    $$('[aria-current]', nav).forEach((item) => item.removeAttribute('aria-current'));

    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
    // Every branch above the chosen row is highlighted as holding it - and, when the choice was
    // made outside the menu (a tab, a card, a link), opened so the row can be seen
    ownersOf(link).forEach((owner) => {
      owner.classList.add('has-active');
      if (reveal && owner.getAttribute('aria-expanded') !== 'true') toggleBranch(owner);
    });
  }

  /** Selects the menu entry for a section id ('profile-details'); called by the router. */
  function select(id) {
    const link = nav && $(`a[href="#${CSS.escape(id)}"]`, nav);
    if (!link || link.classList.contains('is-active')) return;
    selectLink(link, { reveal: true });
  }

  // The first page-like entry inside a branch (React's firstLeafId)
  function firstLeaf(branch) {
    const list = document.getElementById(branch.getAttribute('aria-controls'));
    return list && $('a.db-nav-item, a.db-nav-subitem', list);
  }

  /* ------------------------------------------------------------ drawer (below 1200px) */
  function setDrawer(open, { restoreFocus = true } = {}) {
    if (!drawerMode) open = false;
    if (open === drawerOpen) return;
    drawerOpen = open;
    sidebar.classList.toggle('is-open', open);
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    lockScroll('sidebar', open);
    if (open) {
      FEED.navbar.closeAll();
      // The drawer turns visible at once (only its slide is animated), so focus can move in now
      closeButton.focus({ preventScroll: true });
    } else if (restoreFocus) {
      toggle.focus();
    }
  }

  function syncMode(isDrawer) {
    drawerMode = isDrawer;
    setDrawer(false, { restoreFocus: false });
    // In drawer mode the menu is a modal dialog; on desktop it's a plain landmark
    if (isDrawer) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('aria-labelledby', 'db-sidebar-heading');
      sidebar.removeAttribute('aria-label');
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      sidebar.removeAttribute('aria-labelledby');
      sidebar.setAttribute('aria-label', 'Dashboard menu');
    }
  }

  /* ------------------------------------------------------------ init */
  function init() {
    sidebar = $('[data-sidebar]');
    if (!sidebar) return;
    nav = $('.db-nav', sidebar);
    toggle = $('[data-sidebar-toggle]');
    backdrop = $('[data-sidebar-backdrop]');
    closeButton = $('[data-sidebar-close]', sidebar);

    nav.addEventListener('click', (event) => {
      // A branch opens or closes, and - as in the React app - its first entry becomes the
      // selected section (My Profile opens My Details)
      const branch = event.target.closest('button[aria-controls]');
      if (branch) {
        toggleBranch(branch);
        const leaf = firstLeaf(branch);
        if (leaf) {
          selectLink(leaf, { reveal: false });
          FEED.router.go(leaf.getAttribute('href'));
        }
        return;
      }
      // A section: the link changes the URL hash and router.js shows it
      const link = event.target.closest('a.db-nav-item, a.db-nav-subitem');
      if (!link) return;
      selectLink(link, { reveal: false });
      if (drawerOpen) setDrawer(false, { restoreFocus: false });
    });

    toggle.addEventListener('click', () => setDrawer(!drawerOpen));
    closeButton.addEventListener('click', () => setDrawer(false));
    backdrop.addEventListener('click', () => setDrawer(false));
    sidebar.addEventListener('keydown', (event) => {
      if (!drawerOpen) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        setDrawer(false);
      } else {
        trapTab(sidebar, event);
      }
    });

    FEED.utils.watchMedia(DRAWER_MODE, syncMode);
  }

  FEED.sidebar = { init, select, open: () => setDrawer(true), close: () => setDrawer(false) };
})(window.FEED = window.FEED || {});
