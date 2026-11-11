/**
 * My Profile → My Details (#profile-details): the organisation's identity, statutory, bank and
 * payment-QR details, with the "Profile strength" ring, logo / QR previews, the registration
 * certificate chip, Save (with its confirmation) and Discard.
 *
 * The React form keeps its values only while it is open. Here, Save keeps the text fields in this
 * browser (localStorage) so they are still there next time; pictures are previewed, not uploaded.
 * Connect your API in persist().
 * (behaviour ported from src/components/MyDetailsForm.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, $$ } = FEED.utils;
  const TEXT_FIELDS = ['name', 'website', 'gstNo', 'pan', 'accountHolder', 'accountNumber', 'ifsc', 'bankName'];
  const FILE_FIELDS = ['regCertificate', 'logo', 'qrCode'];
  const TOTAL = TEXT_FIELDS.length + FILE_FIELDS.length;
  const KEY = FEED.config.storageKeys.details;
  const TOAST_MS = 2600;

  let form;
  let files = { logo: null, qrCode: null, regCertificate: null };
  let saved = null; // the last saved values, for Discard
  let toastTimer = 0;
  const placeholders = {};

  const field = (name) => form.elements.namedItem(name);

  /* ------------------------------------------------------------ values */
  function readValues() {
    const values = {};
    TEXT_FIELDS.forEach((name) => { values[name] = field(name).value.trim(); });
    return values;
  }

  function writeValues(values) {
    TEXT_FIELDS.forEach((name) => { field(name).value = values[name] || ''; });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function persist(values) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...values, regCertificate: files.regCertificate }));
    } catch (e) {
      /* not kept - the values stay on screen */
    }
  }

  /* ------------------------------------------------------------ profile strength */
  function updateStrength() {
    const values = readValues();
    const filled = TEXT_FIELDS.filter((name) => values[name]).length + FILE_FIELDS.filter((name) => files[name]).length;
    const pct = Math.round((filled / TOTAL) * 100);
    $('[data-mdf-ring]', form).style.setProperty('--pct', pct);
    $('[data-mdf-pct]', form).textContent = `${pct}%`;
    $('[data-mdf-strength]', form).textContent = pct < 100 ? 'A few details are missing' : 'All set — looking great!';
  }

  /* ------------------------------------------------------------ uploads */
  function setImage(key, file, slot) {
    const preview = $(`[data-upload-preview="${slot}"]`, form);
    if (files[key] && files[key].url) URL.revokeObjectURL(files[key].url);
    if (!file) {
      files[key] = null;
      preview.innerHTML = placeholders[slot];
    } else {
      const url = URL.createObjectURL(file);
      files[key] = { name: file.name, url };
      preview.innerHTML = `<img src="${url}" alt="${slot === 'logo' ? 'Organization logo' : 'Payment QR code'}">`;
    }
    updateStrength();
  }

  function setCertificate(meta) {
    files.regCertificate = meta;
    $('[data-cert-chip]', form).hidden = !meta;
    $('[data-upload-trigger="cert"]', form).hidden = !!meta;
    if (meta) {
      $('[data-cert-name]', form).textContent = meta.name;
      $('[data-cert-size]', form).textContent = meta.size;
    }
    updateStrength();
  }

  /* ------------------------------------------------------------ save / discard */
  function showToast(message) {
    const toast = $('[data-mdf-toast]', form);
    $('[data-mdf-toast-text]', form).textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_MS);
  }

  function init() {
    form = $('[data-my-details]');
    if (!form) return;
    $$('[data-upload-preview]', form).forEach((slot) => { placeholders[slot.getAttribute('data-upload-preview')] = slot.innerHTML; });

    const stored = load();
    if (stored) {
      writeValues(stored);
      if (stored.regCertificate) setCertificate(stored.regCertificate);
    }
    saved = { values: readValues(), regCertificate: files.regCertificate };
    updateStrength();

    form.addEventListener('input', (event) => {
      const input = event.target;
      // GST, PAN and IFSC are upper-case; the account number is digits only
      if (input.hasAttribute('data-uppercase') || input.hasAttribute('data-digits-only')) {
        const start = input.selectionStart;
        const next = input.hasAttribute('data-digits-only') ? input.value.replace(/\D/g, '') : input.value.toUpperCase();
        if (next !== input.value) {
          const removed = input.value.length - next.length;
          input.value = next;
          if (start != null) input.setSelectionRange(start - removed, start - removed);
        }
      }
      updateStrength();
    });

    form.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-upload-trigger]');
      if (trigger) $(`[data-upload-input="${trigger.getAttribute('data-upload-trigger')}"]`, form).click();
      if (event.target.closest('[data-cert-remove]')) {
        setCertificate(null);
        $('[data-upload-trigger="cert"]', form).focus();
      }
      if (event.target.closest('[data-mdf-discard]')) {
        writeValues(saved.values);
        setCertificate(saved.regCertificate);
        setImage('logo', null, 'logo');
        setImage('qrCode', null, 'qr');
      }
    });

    form.addEventListener('change', (event) => {
      const slot = event.target.getAttribute('data-upload-input');
      if (!slot) return;
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file) return;
      if (slot === 'cert') setCertificate({ name: file.name, size: `${(file.size / 1024).toFixed(0)} KB` });
      else setImage(slot === 'logo' ? 'logo' : 'qrCode', file, slot);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const website = field('website');
      if (website.value && !website.checkValidity()) {
        website.reportValidity();
        return;
      }
      const values = readValues();
      persist(values);
      saved = { values, regCertificate: files.regCertificate };
      showToast('Profile updated successfully');
    });
  }

  FEED.myDetails = { init };
})(window.FEED = window.FEED || {});
