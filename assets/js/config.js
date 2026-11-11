/**
 * Site configuration - the one place to edit when connecting this dashboard to the rest of the
 * FEED site.
 *
 * routes: the pages outside this dashboard that its links lead to (navbar, footer, notifications,
 *   FEED Updates, Status of Activities). Links carry data-route="<key>". Set each
 *   to its URL; a key left empty shows a short notice instead of navigating, because that page is
 *   not part of this export. The 16 FEED services are shown for reference only and have no links.
 *
 * user: the signed-in member shown in the banner, the account menu and Status of Activities
 *   (the React app reads it from GET /api/auth/me). An empty name shows "FEED Member".
 */
(function (FEED) {
  'use strict';

  FEED.config = {
    routes: {
      home: '',            // FEED home page (logo, Home)
      about: '',           // About Us section of the home page
      events: '',          // Events & Updates
      roadmap: '',         // Export Road Map
      how: '',             // How Feed Works
      fpo: '',             // FPO
      exports: '',         // Exports
      contact: '',         // Contact Us
      epm: '',             // EPM page (notifications, FEED Updates)
      'epm-details': '',   // all upcoming EPMs (Status of Activities)
      'epm-volunteer': '', // volunteer for an EPM (Status of Activities)
      'safe-mission': '',  // Safe Mission page
      feedworld: '',       // FEED World page
      logout: ''           // where Logout lands; falls back to `home`
    },

    // Names of the pages above, for the notice shown while a route is not set
    routeNames: {
      home: 'Home', about: 'About Us', events: 'Events & Updates', roadmap: 'Export Road Map',
      how: 'How Feed Works', fpo: 'FPO', exports: 'Exports', contact: 'Contact Us', epm: 'EPM',
      'epm-details': 'All EPMs', 'epm-volunteer': 'Volunteer for an EPM', 'safe-mission': 'Safe Mission',
      feedworld: 'FEED World'
    },

    user: {
      firstName: '',
      lastName: '',
      email: 'member@example.com'
    },

    // Browser storage used by this export in place of the React app's API calls
    storageKeys: {
      ers: 'feed-dashboard-ers',
      details: 'feed-dashboard-my-details'
    }
  };
})(window.FEED = window.FEED || {});
