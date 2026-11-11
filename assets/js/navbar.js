/**
 * Site header - services mega menu, notifications, My Account menu, mobile menu and hide-on-scroll.
 * Markup: <header class="site-header"> in dashbaordhtml.html.
 * (behaviour ported from src/components/Navbar.jsx and NotificationBell.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, $$, onOutsidePointer, lockScroll, trapTab, focusables } = FEED.utils;
  const DESKTOP_NAV = '(min-width: 1200px)';

  const el = {};
  // Only one of the navbar's pop-ups is open at a time
  let openPopup = null;

  /* ------------------------------------------------------------ pop-ups (menu, bell, account) */
  const popups = {
    services: {
      open() {
        el.servicesItem.classList.add('open');
        el.servicesToggle.setAttribute('aria-expanded', 'true');
        el.servicesMenu.hidden = false;
        el.servicesOverlay.hidden = false;
        lockScroll('services', true);
      },
      close() {
        el.servicesItem.classList.remove('open');
        el.servicesToggle.setAttribute('aria-expanded', 'false');
        el.servicesMenu.hidden = true;
        el.servicesOverlay.hidden = true;
        lockScroll('services', false);
      },
      toggle: () => el.servicesToggle
    },
    notifications: {
      open() {
        el.bellToggle.setAttribute('aria-expanded', 'true');
        el.bellPanel.hidden = false;
        // Opening the panel marks the notifications as seen: the badge goes
        if (el.bellBadge) {
          el.bellBadge.remove();
          el.bellBadge = null;
          el.bellToggle.setAttribute('aria-label', 'Notifications');
        }
      },
      close() {
        el.bellToggle.setAttribute('aria-expanded', 'false');
        el.bellPanel.hidden = true;
        // ...and once it closes they are no longer new
        $$('.nb-item.is-unread', el.bellPanel).forEach((item) => item.classList.remove('is-unread'));
        $$('.nb-dot', el.bellPanel).forEach((dot) => dot.remove());
        if (el.bellPill) el.bellPill.hidden = true;
      },
      toggle: () => el.bellToggle
    },
    account: {
      open() {
        el.accountToggle.setAttribute('aria-expanded', 'true');
        el.accountMenu.hidden = false;
      },
      close() {
        el.accountToggle.setAttribute('aria-expanded', 'false');
        el.accountMenu.hidden = true;
      },
      toggle: () => el.accountToggle
    }
  };

  function setPopup(name) {
    if (openPopup === name) return;
    if (openPopup) popups[openPopup].close();
    openPopup = name;
    if (name) popups[name].open();
  }

  function togglePopup(name) {
    setPopup(openPopup === name ? null : name);
  }

  /* ------------------------------------------------------------ mobile menu (below 1200px) */
  let mobileOpen = false;

  function setMobileServices(open) {
    el.mobileServicesItem.classList.toggle('open', open);
    el.mobileServicesToggle.setAttribute('aria-expanded', String(open));
    el.mobileServicesList.hidden = !open;
  }

  function setMobile(open, { restoreFocus = true } = {}) {
    if (open === mobileOpen) return;
    mobileOpen = open;
    el.mobilePanel.hidden = !open;
    el.mobileBackdrop.hidden = !open;
    el.mobileToggle.setAttribute('aria-expanded', String(open));
    el.mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    lockScroll('mobile-menu', open);
    if (open) {
      setPopup(null);
      const first = focusables(el.mobilePanel)[0];
      if (first) first.focus();
    } else {
      setMobileServices(false);
      if (restoreFocus) el.mobileToggle.focus();
    }
  }

  /* ------------------------------------------------------------ avatar preview */
  // The React app uploads the picture to the API; here it is only previewed in this tab.
  function initAvatar() {
    const pick = $('[data-avatar-pick]');
    const input = $('[data-avatar-input]');
    const slots = [$('[data-avatar]'), $('.fw-account-icon')];
    let objectUrl = null;

    pick.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      slots.forEach((slot) => {
        const img = document.createElement('img');
        img.src = objectUrl;
        img.alt = '';
        slot.replaceChildren(img);
      });
    });
  }

  /* ------------------------------------------------------------ hide on scroll */
  // Slides away while scrolling down, comes back on the way up - never while a pop-up is open.
  function initHideOnScroll() {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (delta > 10 && y > 80 && !openPopup && !mobileOpen) el.root.classList.add('fw-nav-hidden');
      else if (delta < -10 || y <= 80) el.root.classList.remove('fw-nav-hidden');
      lastY = y;
    }, { passive: true });

    // Keyboard users tabbing into the hidden bar bring it back
    el.root.addEventListener('focusin', () => el.root.classList.remove('fw-nav-hidden'));
  }

  /* ------------------------------------------------------------ init */
  function init() {
    el.root = $('.fw-nav-root');
    if (!el.root) return;

    el.servicesItem = $('[data-services-item]');
    el.servicesToggle = $('[data-services-toggle]');
    el.servicesMenu = $('#services-menu');
    el.servicesOverlay = $('[data-services-overlay]');
    el.bell = $('[data-notifications]');
    el.bellToggle = $('[data-notifications-toggle]');
    el.bellPanel = $('#notifications-panel');
    el.bellBadge = $('[data-notifications-badge]');
    el.bellPill = $('[data-notifications-pill]');
    el.account = $('[data-account]');
    el.accountToggle = $('[data-account-toggle]');
    el.accountMenu = $('#account-menu');
    el.mobileToggle = $('[data-mobile-toggle]');
    el.mobilePanel = $('#mobile-menu');
    el.mobileBackdrop = $('[data-mobile-backdrop]');
    el.mobileServicesItem = $('[data-mobile-services]');
    el.mobileServicesToggle = $('[data-mobile-services-toggle]');
    el.mobileServicesList = $('#mobile-services');

    // Stagger index for the mega menu tiles' fly-in (see navbar.css)
    $$('.srv-card', el.servicesMenu).forEach((tile, i) => tile.style.setProperty('--i', i));

    el.servicesToggle.addEventListener('click', () => togglePopup('services'));
    el.servicesOverlay.addEventListener('click', () => setPopup(null));
    el.bellToggle.addEventListener('click', () => togglePopup('notifications'));
    el.accountToggle.addEventListener('click', () => togglePopup('account'));

    onOutsidePointer(el.servicesItem, (event) => {
      if (openPopup === 'services' && !el.servicesOverlay.contains(event.target)) setPopup(null);
    });
    onOutsidePointer(el.bell, () => { if (openPopup === 'notifications') setPopup(null); });
    onOutsidePointer(el.account, () => { if (openPopup === 'account') setPopup(null); });

    el.mobileToggle.addEventListener('click', () => setMobile(!mobileOpen));
    el.mobileBackdrop.addEventListener('click', () => setMobile(false));
    $$('[data-mobile-close]', el.mobilePanel).forEach((button) => {
      button.addEventListener('click', () => setMobile(false, { restoreFocus: false }));
    });
    el.mobileServicesToggle.addEventListener('click', () => {
      setMobileServices(el.mobileServicesToggle.getAttribute('aria-expanded') !== 'true');
    });
    el.mobilePanel.addEventListener('keydown', (event) => trapTab(el.mobilePanel, event));

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (mobileOpen) {
        setMobile(false);
      } else if (openPopup) {
        const toggle = popups[openPopup].toggle();
        setPopup(null);
        toggle.focus();
      }
    });

    // The desktop bar has room for every link from 1200px: the mobile menu closes there,
    // and the mega menu (desktop only) closes below it
    FEED.utils.watchMedia(DESKTOP_NAV, (desktop) => {
      if (desktop) setMobile(false, { restoreFocus: false });
      else if (openPopup === 'services') setPopup(null);
    });

    initAvatar();
    initHideOnScroll();
  }

  FEED.navbar = { init, closeAll: () => { setPopup(null); setMobile(false, { restoreFocus: false }); } };
})(window.FEED = window.FEED || {});
