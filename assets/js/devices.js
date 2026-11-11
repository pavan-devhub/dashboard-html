/**
 * Logged-in devices (My Account → Devices): the devices signed in to this account, this one
 * marked "This device"; the others can be logged out. Closes on ×, Escape or a click outside.
 *
 * The React app reads them from GET /api/auth/sessions and logs one out with
 * DELETE /api/auth/sessions/{id}. This export lists this browser plus sample devices - replace
 * loadSessions() and revoke() to connect the API.
 * (behaviour ported from src/components/DevicesModal.jsx and DeviceRow.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, $$, icon, esc } = FEED.utils;
  let popover, list, opener;

  function thisBrowser() {
    const ua = navigator.userAgent;
    const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows'
      : /Mac OS X/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown OS';
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
      : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const mobile = os === 'Android' || os === 'iOS';
    return { id: 'current', deviceName: `${mobile ? 'Phone' : 'Computer'} (${os})`, browser, os, current: true, lastActiveAt: new Date().toISOString() };
  }

  function loadSessions() {
    const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
    return Promise.resolve([
      thisBrowser(),
      { id: 's2', deviceName: 'Samsung Galaxy A54', browser: 'Chrome', os: 'Android', lastActiveAt: hoursAgo(2) },
      { id: 's3', deviceName: 'Office PC', browser: 'Edge', os: 'Windows', lastActiveAt: hoursAgo(50) }
    ]);
  }

  function revoke(id) {
    return new Promise((resolve) => setTimeout(() => resolve(id), 500));
  }

  function timeAgo(iso) {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function rowHtml(s) {
    const mobile = s.os === 'Android' || s.os === 'iOS';
    return (
      `<li class="device-row${s.current ? ' is-current' : ''}" data-session="${esc(s.id)}">` +
        icon(mobile ? 'smartphone' : 'laptop', 20, { className: 'device-row-icon' }) +
        '<div class="device-row-info">' +
          `<div class="device-row-name">${esc(s.deviceName || 'Unknown device')}` +
            (s.current ? `<span class="device-row-current">${icon('shield-check', 12)} This device</span>` : '') +
          '</div>' +
          `<div class="device-row-meta">${esc(s.browser)} · ${esc(s.os)} · Last active ${esc(timeAgo(s.lastActiveAt))}</div>` +
        '</div>' +
        (s.current ? '' : `<button class="device-row-logout" type="button" data-revoke="${esc(s.id)}">${icon('log-out', 14)} <span>Log out</span></button>`) +
      '</li>'
    );
  }

  function render(sessions) {
    list.innerHTML = sessions.length
      ? sessions.map(rowHtml).join('')
      : '<li class="devices-empty">No active devices found.</li>';
  }

  function open(trigger) {
    opener = trigger;
    FEED.navbar.closeAll();
    list.innerHTML = '<li class="devices-empty">Loading…</li>';
    popover.hidden = false;
    $('[data-devices-close]', popover).focus();
    loadSessions().then(render);
  }

  function close() {
    if (popover.hidden) return;
    popover.hidden = true;
    // Back to the button that opened it - or, if its menu has closed, the menu's own button
    const target = [opener, $('[data-account-toggle]'), $('[data-mobile-toggle]')]
      .find((el) => el && el.isConnected && el.getClientRects().length);
    if (target) target.focus();
  }

  function init() {
    popover = $('[data-devices]');
    if (!popover) return;
    list = $('[data-devices-list]', popover);

    $$('[data-devices-open]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        open(button);
      });
    });
    $('[data-devices-close]', popover).addEventListener('click', close);

    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-revoke]');
      if (!button) return;
      button.disabled = true;
      $('span', button).textContent = 'Logging out…';
      revoke(button.getAttribute('data-revoke')).then(() => {
        const row = button.closest('.device-row');
        const name = $('.device-row-name', row).firstChild.textContent;
        row.remove();
        FEED.toast(`${name} has been logged out.`, { tone: 'success' });
      });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!popover.hidden && !popover.contains(event.target) && !event.target.closest('[data-devices-open]')) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !popover.hidden) close();
    });
  }

  FEED.devices = { init, close };
})(window.FEED = window.FEED || {});
