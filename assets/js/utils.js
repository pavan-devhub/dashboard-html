/**
 * Shared helpers on the window.FEED namespace.
 * Plain (non-module) scripts, loaded with `defer`, so the page also works when opened from disk.
 */
(function (FEED) {
  'use strict';

  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const scrollLocks = new Set();

  FEED.utils = {
    $(selector, root) {
      return (root || document).querySelector(selector);
    },

    $$(selector, root) {
      return Array.from((root || document).querySelectorAll(selector));
    },

    /** True when the visitor asked the OS for less motion. */
    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /** Runs `callback` when a pointer goes down outside `element`. */
    onOutsidePointer(element, callback) {
      document.addEventListener('pointerdown', (event) => {
        if (!element.contains(event.target)) callback(event);
      });
    },

    /**
     * Locks page scrolling while any owner holds a lock (menus, drawers). The reserved
     * scrollbar gutter stops the page jumping sideways when the scrollbar disappears.
     */
    lockScroll(owner, locked) {
      if (locked) scrollLocks.add(owner);
      else scrollLocks.delete(owner);
      const on = scrollLocks.size > 0;
      document.documentElement.style.scrollbarGutter = on ? 'stable' : '';
      document.body.classList.toggle('is-scroll-locked', on);
    },

    /** Visible, focusable elements inside `container`. */
    focusables(container) {
      return Array.from(container.querySelectorAll(FOCUSABLE))
        .filter((el) => el.getClientRects().length > 0 && !el.closest('[hidden], [inert]'));
    },

    /** Keeps Tab / Shift+Tab inside `container` (for modal drawers). Call from a keydown handler. */
    trapTab(container, event) {
      if (event.key !== 'Tab') return;
      const items = FEED.utils.focusables(container);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },

    /** Calls `callback(matches)` now and whenever the media query starts or stops matching. */
    watchMedia(query, callback) {
      const mql = window.matchMedia(query);
      callback(mql.matches);
      mql.addEventListener('change', (event) => callback(event.matches));
      return mql;
    },

    /** Escapes text for use inside HTML built with template strings. */
    esc(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /**
     * Markup for a sprite icon, for scripts that draw HTML:
     * icon('arrow-right', 16, { stroke: 2.4, className: 'x', fill: true })
     */
    icon(name, size = 24, { stroke, className = '', fill = false } = {}) {
      return `<svg class="icon${className ? ' ' + className : ''}" width="${size}" height="${size}"` +
        (stroke ? ` stroke-width="${stroke}"` : '') + (fill ? ' fill="currentColor"' : '') +
        ` aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
    },

    /** "11 Nov 2026" */
    formatDate(value) {
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    /** The member's full name, or '' (callers fall back to "FEED Member"). */
    userName() {
      const user = (FEED.config && FEED.config.user) || {};
      return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    }
  };

  /** Shows a short message at the bottom of the screen (and reads it to screen readers). */
  FEED.toast = function (message, { tone = 'info', duration = 3200 } = {}) {
    const region = document.querySelector('[data-toast-region]');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${tone}`;
    toast.innerHTML = FEED.utils.icon(tone === 'success' ? 'circle-check' : 'info', 16) +
      `<span>${FEED.utils.esc(message)}</span>`;
    region.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };
})(window.FEED = window.FEED || {});
