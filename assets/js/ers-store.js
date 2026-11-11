/**
 * The member's latest ERS assessment: { attempted, percentage, passed, totalScore, completedOn, answers }.
 *
 * The React app reads it from GET /api/ers/status and saves attempts with POST /api/ers/submit.
 * This export keeps it in the browser (localStorage). To connect the backend, replace load() and
 * save() - the rest of the page only uses get(), save() and the 'feed:ers-status' event.
 */
(function (FEED) {
  'use strict';

  const EMPTY = { attempted: false, percentage: 0, passed: false, totalScore: 0, completedOn: null, answers: {} };
  const KEY = FEED.config.storageKeys.ers;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.attempted) return { ...EMPTY, ...saved };
    } catch (e) {
      /* storage unavailable - start fresh */
    }
    return { ...EMPTY };
  }

  let status = load();

  FEED.ersStore = {
    get: () => status,

    /** Scores `answers`, stores the attempt and tells the page. Returns the new status. */
    submit(answers) {
      const { TOTAL_MAX, PASS_THRESHOLD } = FEED.data.ers;
      const totalScore = Object.values(answers).reduce((sum, value) => sum + (value || 0), 0);
      const percentage = (totalScore / TOTAL_MAX) * 100;
      return this.save({
        attempted: true,
        answers: { ...answers },
        totalScore,
        percentage,
        passed: percentage >= PASS_THRESHOLD,
        completedOn: new Date().toISOString()
      });
    },

    save(next) {
      status = { ...EMPTY, ...next };
      try {
        localStorage.setItem(KEY, JSON.stringify(status));
      } catch (e) {
        /* not kept - the page still shows it until it is reloaded */
      }
      document.dispatchEvent(new CustomEvent('feed:ers-status', { detail: status }));
      return status;
    }
  };
})(window.FEED = window.FEED || {});
