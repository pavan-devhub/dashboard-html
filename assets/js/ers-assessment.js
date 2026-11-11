/**
 * ERS - Export Readiness Assessment (#ers).
 * A 7-section wizard (questions from data/ers-data.js), then the results: a score gauge, pass /
 * not passed, the readiness tier, a bar per dimension and the priority gap list, with "Reassess".
 * A member who has already taken it opens straight on their results, as in the React app.
 * Results are kept by ers-store.js, which also updates the ERS card.
 * (behaviour ported from src/components/ers/ErsAssessmentPanel.jsx)
 */
(function (FEED) {
  'use strict';

  const { $, $$, icon, esc } = FEED.utils;

  const SECTION_ICONS = {
    landmark: 'landmark', award: 'award', package: 'package', sprout: 'sprout',
    rupee: 'indian-rupee', globe: 'globe', file: 'file-text'
  };
  // Semi-circle gauge geometry (same as the React panel)
  const R = 108, CX = 140, CY = 140, STROKE = 18;
  const CIRC = Math.PI * R;
  const SCORING_MS = 600;

  let stage;
  let data;
  const state = { phase: 'quiz', section: 0, answers: {}, submitting: false };

  /* ------------------------------------------------------------ quiz */
  const sectionComplete = (i) => data.sections[i].questions.every((q) => state.answers[q.id] !== undefined);
  const answeredIn = (section) => section.questions.filter((q) => state.answers[q.id] !== undefined).length;

  function overallPct() {
    const section = data.sections[state.section];
    return Math.round(((state.section + answeredIn(section) / section.questions.length) / data.sections.length) * 100);
  }

  function questionHtml(section, q) {
    const labelId = `ers-q-${q.id}`;
    const options = q.options.map((opt) => {
      const selected = state.answers[q.id] === opt.value;
      return (
        `<label class="ers-opt${selected ? ' selected' : ''}">` +
          `<input class="visually-hidden" type="radio" name="ers-${q.id}" value="${opt.value}" data-question="${q.id}"${selected ? ' checked' : ''}>` +
          '<span class="ers-opt-radio" aria-hidden="true"><span class="ers-opt-radio-dot"></span></span>' +
          `<span class="ers-opt-text">${esc(opt.text)}</span>` +
          `<span class="ers-opt-pts" aria-label="${opt.value} points">${opt.value}</span>` +
        '</label>'
      );
    }).join('');
    return (
      `<div class="ers-q-card" role="radiogroup" aria-labelledby="${labelId}" aria-describedby="${labelId}-hint">` +
        '<div class="ers-q-top">' +
          `<div class="ers-q-label" id="${labelId}">${esc(q.label)}</div>` +
          `<span class="ers-q-weight" style="background:${section.iconBg};color:${section.iconColor}">${q.weight} pts</span>` +
        '</div>' +
        `<div class="ers-q-hint" id="${labelId}-hint">${esc(q.hint)}</div>` +
        `<div class="ers-opts">${options}</div>` +
      '</div>'
    );
  }

  function stepperHtml() {
    return data.sections.map((s, i) => {
      const active = i === state.section;
      const done = sectionComplete(i) && !active;
      return (
        `<button class="ers-step-dot${active ? ' active' : ''}${done ? ' done' : ''}" type="button" data-step="${i}"` +
        ` aria-label="Go to section ${i + 1}: ${esc(s.name)}${done ? ' (answered)' : ''}"${active ? ' aria-current="step"' : ''}>` +
        (done ? icon('check', 13) : i + 1) + '</button>'
      );
    }).join('');
  }

  function renderQuiz({ focus = false } = {}) {
    const section = data.sections[state.section];
    const isLast = state.section === data.sections.length - 1;
    const pct = overallPct();
    stage.innerHTML =
      '<div class="ers-progress-row">' +
        `<div class="ers-progress-track" role="progressbar" aria-label="Assessment progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">` +
          `<div class="ers-progress-fill" style="width:${pct}%" data-progress-fill></div>` +
        '</div>' +
        '<div class="ers-progress-labels">' +
          `<span>Section ${state.section + 1} of ${data.sections.length}</span>` +
          `<span data-progress-label>${pct}% complete</span>` +
        '</div>' +
      '</div>' +
      '<div class="ers-body">' +
        '<div class="ers-section-header">' +
          `<div class="ers-section-icon" style="background:${section.iconBg};color:${section.iconColor}" aria-hidden="true">${icon(SECTION_ICONS[section.icon], 20)}</div>` +
          '<div>' +
            `<h3 class="ers-section-title" tabindex="-1" data-section-title>${esc(section.name)}</h3>` +
            `<div class="ers-section-subtitle">Max ${section.max} pts · ${esc(section.subtitle)}</div>` +
          '</div>' +
        '</div>' +
        section.questions.map((q) => questionHtml(section, q)).join('') +
      '</div>' +
      `<nav class="ers-stepper" aria-label="Assessment sections" data-stepper>${stepperHtml()}</nav>` +
      '<footer class="ers-nav-row">' +
        `<button class="ers-btn" type="button" data-prev${state.section === 0 ? ' style="visibility:hidden"' : ''}>${icon('chevron-left', 16)} Previous</button>` +
        `<span class="ers-nav-status" data-answered>${answeredIn(section)}/${section.questions.length} answered</span>` +
        `<button class="ers-btn primary" type="button" data-next>` +
          (isLast ? `See my score ${icon('arrow-right', 16)}` : `Next ${icon('chevron-right', 16)}`) +
        '</button>' +
      '</footer>';
    if (focus) $('[data-section-title]', stage).focus({ preventScroll: true });
  }

  // An answer changes only what depends on it, so focus stays on the option
  function onAnswer(input) {
    state.answers[input.getAttribute('data-question')] = Number(input.value);
    $$(`input[name="${input.name}"]`, stage).forEach((radio) => {
      radio.closest('.ers-opt').classList.toggle('selected', radio.checked);
    });
    const section = data.sections[state.section];
    const pct = overallPct();
    $('[data-progress-fill]', stage).style.width = `${pct}%`;
    $('.ers-progress-track', stage).setAttribute('aria-valuenow', pct);
    $('[data-progress-label]', stage).textContent = `${pct}% complete`;
    $('[data-answered]', stage).textContent = `${answeredIn(section)}/${section.questions.length} answered`;
    $('[data-stepper]', stage).innerHTML = stepperHtml();
  }

  function goToSection(i) {
    state.section = Math.max(0, Math.min(data.sections.length - 1, i));
    renderQuiz({ focus: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function submit() {
    if (state.submitting) return;
    state.submitting = true;
    const next = $('[data-next]', stage);
    next.disabled = true;
    next.innerHTML = `${icon('loader-circle', 16, { className: 'ers-spin' })} Scoring…`;
    setTimeout(() => {
      state.submitting = false;
      FEED.ersStore.submit(state.answers);
      state.phase = 'results';
      renderResults({ focus: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, SCORING_MS);
  }

  /* ------------------------------------------------------------ results */
  function renderResults({ focus = false } = {}) {
    const status = FEED.ersStore.get();
    const answers = status.answers || {};
    const pct = Math.max(0, Math.min(100, status.percentage || 0));
    const tier = data.getTier(pct);
    const dims = data.scoreSections(answers);
    const gaps = data.computeGaps(answers);
    const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

    const gapItems = gaps.length === 0
      ? '<li class="ers-gap-item minor"><span class="ers-gap-badge minor">Excellent</span>' +
        '<div class="ers-gap-text">No significant gaps found. You are well-prepared to export.</div></li>'
      : gaps.map((g) => (
        `<li class="ers-gap-item ${g.severity}"><span class="ers-gap-badge ${g.severity}">${g.severity}</span>` +
        `<div><div class="ers-gap-text">${esc(g.label)}</div><div class="ers-gap-action">${esc(g.action)}</div></div></li>`
      )).join('');

    stage.innerHTML =
      '<div class="ers-body ers-results">' +
        '<div class="ers-dial-wrap">' +
          `<svg class="ers-dial-svg" width="280" height="176" viewBox="0 0 280 176" role="img" aria-label="Your score: ${Math.round(pct)}%">` +
            `<path d="${arc}" fill="none" stroke="#EDEBE3" stroke-width="${STROKE}" stroke-linecap="round"/>` +
            `<path d="${arc}" fill="none" stroke="url(#ersDialGrad)" stroke-width="${STROKE}" stroke-linecap="round" ` +
              `stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" style="transition:stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" data-dial/>` +
            '<defs><linearGradient id="ersDialGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
              '<stop offset="0%" stop-color="#E24B4A"/><stop offset="50%" stop-color="#EF9F27"/><stop offset="100%" stop-color="#1D9E75"/>' +
            '</linearGradient></defs>' +
            `<line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R + 30}" stroke="#1E293B" stroke-width="3" stroke-linecap="round" ` +
              `style="transform-origin:${CX}px ${CY}px;transform:rotate(-90deg);transition:transform 1.1s cubic-bezier(.22,1,.36,1)" data-needle/>` +
            `<circle cx="${CX}" cy="${CY}" r="6" fill="#1E293B"/>` +
            `<text x="${CX}" y="${CY - 22}" text-anchor="middle" font-size="34" font-weight="800" fill="#0f172a">${Math.round(pct)}%</text>` +
            `<text x="${CX - R}" y="${CY + 22}" font-size="11" fill="#94a3b8" text-anchor="middle">0</text>` +
            `<text x="${CX + R}" y="${CY + 22}" font-size="11" fill="#94a3b8" text-anchor="middle">100</text>` +
          '</svg>' +
          `<div class="ers-pass-badge ${status.passed ? 'pass' : 'fail'}">` +
            (status.passed ? `${icon('circle-check', 15)} Passed` : `${icon('circle-x', 15)} Not Passed`) +
            `<span class="ers-pass-sub">· ${status.totalScore}/${data.TOTAL_MAX} pts</span>` +
          '</div>' +
          `<h3 class="ers-tier" style="color:${tier.color}" tabindex="-1" data-tier>${esc(tier.tier)}</h3>` +
          `<div class="ers-tier-desc">${esc(tier.desc)}</div>` +
        '</div>' +
        '<div class="ers-dim-grid">' +
          dims.map((d) => (
            '<div class="ers-dim-card">' +
              `<div class="ers-dim-name">${esc(d.name)}</div>` +
              `<div class="ers-dim-bar-track"><div class="ers-dim-bar-fill" style="width:0%;background:${d.color}" data-bar="${d.pct}"></div></div>` +
              `<div class="ers-dim-score">${d.raw}/${d.max} pts (${d.pct}%)</div>` +
            '</div>'
          )).join('') +
        '</div>' +
        '<div class="ers-gap-list">' +
          '<h4 class="ers-gap-title">Priority Gap List</h4>' +
          `<ul class="ers-gap-items">${gapItems}</ul>` +
        '</div>' +
        `<div class="ers-restart-row"><button class="ers-btn primary" type="button" data-restart>${icon('rotate-ccw', 16)} Reassess</button></div>` +
      '</div>';

    // The gauge sweeps and the bars fill in just after the results appear
    setTimeout(() => {
      const dial = $('[data-dial]', stage);
      if (!dial) return;
      dial.setAttribute('stroke-dashoffset', CIRC * (1 - pct / 100));
      $('[data-needle]', stage).style.transform = `rotate(${-90 + 180 * (pct / 100)}deg)`;
      $$('[data-bar]', stage).forEach((bar) => { bar.style.width = `${bar.getAttribute('data-bar')}%`; });
    }, 80);

    if (focus) $('[data-tier]', stage).focus({ preventScroll: true });
  }

  // "Reassess": a fresh wizard; the stored result stays until the new attempt is scored
  function restart() {
    state.answers = {};
    state.section = 0;
    state.phase = 'retake';
    renderQuiz({ focus: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ------------------------------------------------------------ init */
  // Opening the view: the results if there is an attempt (unless a retake is under way),
  // otherwise the wizard where it was left
  function open() {
    if (state.phase !== 'retake') state.phase = FEED.ersStore.get().attempted ? 'results' : 'quiz';
    if (state.phase === 'results') renderResults();
    else renderQuiz();
  }

  function init() {
    stage = $('[data-ers-stage]');
    data = FEED.data && FEED.data.ers;
    if (!stage || !data) return;

    stage.addEventListener('change', (event) => {
      if (event.target.matches('input[type="radio"][data-question]')) onAnswer(event.target);
    });
    stage.addEventListener('click', (event) => {
      const step = event.target.closest('[data-step]');
      if (step) return goToSection(Number(step.getAttribute('data-step')));
      if (event.target.closest('[data-prev]')) return goToSection(state.section - 1);
      if (event.target.closest('[data-next]')) {
        if (state.section === data.sections.length - 1) submit();
        else goToSection(state.section + 1);
        return;
      }
      if (event.target.closest('[data-restart]')) restart();
    });

    document.addEventListener('feed:view', (event) => {
      if (event.detail.view === 'ers') open();
    });
    if (FEED.router.current().view === 'ers') open();
  }

  FEED.ersAssessment = { init };
})(window.FEED = window.FEED || {});
