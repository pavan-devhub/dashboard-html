# FEED Dashboard - static HTML/CSS/JS

The member dashboard (opened from **My Account → Dashboard** on the home page), rebuilt as a
standard static page: semantic HTML, component CSS files, and small plain-JavaScript files.
No build step and no dependencies.

**Open it:** double-click `dashbaordhtml.html`, or serve the folder with any static server
(for example `npx serve .`). Fonts load from Google Fonts, so they need an internet connection;
everything else is local.

## Folder structure

```
dashbaordhtml/
├── dashbaordhtml.html          the page
├── README.md
└── assets/
    ├── css/
    │   ├── base/               variables.css (tokens, breakpoints), reset.css, base.css (icons, a11y helpers)
    │   ├── layout/             navbar.css, dashboard.css (page grid), footer.css
    │   └── components/         one file per component (see the table below)
    ├── js/
    │   ├── config.js           URLs of the rest of the FEED site, member name/e-mail, storage keys
    │   ├── utils.js            shared helpers (window.FEED.utils), FEED.toast
    │   ├── data/ers-data.js    ERS sections, questions, gap advice and scoring (same as the React app)
    │   ├── ers-store.js        the member's ERS result (localStorage here; the API in React)
    │   ├── navbar.js           mega menu, notifications, My Account, mobile menu, hide-on-scroll
    │   ├── devices.js          My Account → Devices panel
    │   ├── sidebar.js          dashboard menu accordion, selected section, drawer below 1200px
    │   ├── router.js           shows one view at a time from the URL hash
    │   ├── widgets.js          scrolling lists, Krishi Coins counter, services entrance
    │   ├── summary-cards.js    ERS card state; the whole card opens the assessment
    │   ├── ers-assessment.js   ERS wizard and results
    │   ├── plans.js            Membership Plans upgrade requests
    │   ├── my-details.js       My Profile → My Details form
    │   ├── epm-activities.js   Status of Activities cards
    │   └── main.js             starts everything; site links, Logout, subscribe form, year
    └── images/
        ├── brand/  menu/  services/  quick-access/  backgrounds/  footer/
        └── dashboard/          welcome banner, art/ (SVG artwork), widgets/ (+ market/)
```

Scripts are plain `defer` scripts on one `window.FEED` namespace (not ES modules), so the page
also works when opened straight from disk.

## Page structure

```
<body>
  skip link → #main-content
  inline SVG icon sprite
  <header class="site-header">     navbar (<nav aria-label="Main">), mega menu, mobile menu dialog
  <main id="main-content" class="db-layout">
    .db-toolbar                     "Dashboard menu" button + breadcrumb (below 1200px)
    <section class="db-hero">       <h1> Welcome, FEED Member + FEED logo
    .db-left-col
      <section class="db-updates">  FEED Updates
      <aside class="db-sidebar">    dashboard menu (<nav>), drawer below 1200px
      <section class="db-summary-grid">  ERS, Krishi Coins, Plan (<article> each)
    .db-main                        one view at a time (router.js)
      #view-home                    FEED Services (display only), Quick Access, widgets
      #view-profile                 My Profile tabs + My Details form
      #view-status                  Status of Activities
      #view-ers                     ERS assessment (drawn by ers-assessment.js)
      #view-plans                   Membership Plans
  </main>
  devices dialog, toast region
  <footer class="new-footer">
```

Heading outline: one `<h1>` (the greeting), `<h2>` per section and widget, `<h3>` per card/item.

## Responsive behaviour

| Width | Name | Layout |
|---|---|---|
| 0 – 479 | xs | One column. Compact hero and FEED Updates header; services and quick access 2 across; widgets stacked and unclipped. |
| 480 – 767 | sm | One column. Overview cards stacked; services 2 across (4 from 700px); widgets stacked below 640px. |
| 768 – 1023 | md | Overview cards 2 across (Plan full width); services 4 across; quick access 3 across; widgets 2 across. |
| 1024 – 1199 | lg | Overview cards 3 across; quick access 5 across; widgets 3 across. |
| 1200 – 1535 | xl | Two columns as in the React app: left column (FEED Updates, menu, overview) beside the banner and main content. Full navbar. |
| 1536+ | 2xl | As xl; content capped at 1920px and centred. |

- Below 1200px the navbar collapses into the mobile menu (right) and the dashboard menu becomes a
  slide-in drawer (left), opened from the **Dashboard menu** button.
- The quick-access grid and the widgets choose their columns from the width of their own column
  (CSS container queries), so they fit whether or not the left column is beside them.
- On views other than Home, the view comes straight after the toolbar on phones and tablets, and
  the FEED Updates / overview cards follow it.
- Checked with no horizontal overflow at 320, 375, 390, 480, 600, 700, 768, 834, 1024, 1180, 1200,
  1280, 1366, 1440, 1920 and 2560px (Home), and at 320, 390, 768, 1024, 1200, 1440 and 1920px for
  every other view, including the ERS results.

## Components

| Component | CSS | JS |
|---|---|---|
| Navbar, mega menu, mobile menu | `layout/navbar.css` | `navbar.js` |
| Notifications panel | `components/notification-bell.css` | `navbar.js` |
| My Account dropdown | `components/account-menu.css` | `navbar.js` |
| Page grid, toolbar, breadcrumb | `layout/dashboard.css` | - |
| FEED Updates | `components/feed-updates.css` | `widgets.js` |
| Dashboard menu / drawer | `components/sidebar-nav.css` | `sidebar.js` |
| ERS, Krishi Coins, Plan | `summary-cards.css`, `ers-card.css`, `krishi-coins-card.css`, `plan-card.css` | `widgets.js` (counter) |
| Welcome banner | `components/welcome-hero.css` | - |
| FEED Services | `components/services.css` | `widgets.js` (entrance) |
| Quick Access | `components/quick-access.css` | - |
| Central & State Updates, Recent Activity | `components/widgets.css` | `widgets.js` |
| Market Prices | `components/market-prices.css` | - |
| Footer | `layout/footer.css` | `main.js` (form, year) |
| Views wrapper, My Profile tabs | `components/view-page.css` | `router.js` |
| My Details form | `components/my-details.css` | `my-details.js` |
| Status of Activities | `components/epm-activities.css` | `epm-activities.js` |
| ERS assessment | `components/ers-assessment.css` | `ers-assessment.js`, `ers-store.js` |
| Membership Plans | `components/plans.css` | `plans.js` |
| Devices panel, toasts | `components/devices.css`, `components/toast.css` | `devices.js`, `utils.js` |

## Views and navigation

The main column shows one view at a time, chosen by the URL hash (`router.js`), exactly as the
React dashboard switched its content. The left column stays on every view. Browser Back/Forward
and bookmarks work.

| Hash | View | Opened from |
|---|---|---|
| `#home` (or none) | Home: banner, FEED Services, Quick Access, widgets | Home in the menu, My Account → Dashboard, "Back to Dashboard" |
| `#profile-details`, `#profile-products`, `#profile-vendors`, `#profile-subscriptions` | My Profile with its tabs; My Details is a working form (strength ring, uploads, Save/Discard) | My Profile in the menu (opens My Details), the tabs, Quick Access |
| `#status` | Status of Activities: registered EPMs (cards open/close) and volunteering | Status of Activities in the menu |
| `#ers` | ERS assessment: 7-section wizard, then score gauge, pass/fail, tier, dimension bars, gap list, Reassess | the ERS card (anywhere on it), the banner's ERS update |
| `#plans` | Membership Plans with upgrade requests | Plan card → Manage Plan |
| other menu entries (`#org-about`, `#accounts-registers-purchase`, …) | Home content with that entry selected - as in the React app, which has no pages for them yet | the menu |
| `#db-alerts`, `#db-services` | scrolls to that block on Home | FEED Updates → See All, footer → Services |

As in React, opening a menu branch (My Profile, MY Org, …) also selects its first entry.
The ERS result updates the ERS card (ring, Passed / Not Passed, date, button label) and the
banner's ERS update, and is kept in this browser.

## Wiring it into the site

- **FEED services are display only** (mega menu, mobile menu, the Services section and the footer
  list): they have no links, as requested.
- **Links to the rest of the FEED site** (navbar, logo, footer Quick Links, notifications,
  FEED Updates, Status of Activities, Logout) carry `data-route="…"`. Set the URLs
  in `assets/js/config.js` → `routes`. Until a route is set, its link shows a short notice that the
  page is not part of this dashboard.
- **Member details:** `config.js` → `user` (name and e-mail in the banner, account menu and Status
  of Activities).
- **Back end:** the React app talks to an API where this export uses the browser:
  `ers-store.js` (ERS status / submit), `my-details.js` → `persist()`, `devices.js` →
  `loadSessions()` / `revoke()`, `plans.js` → `sendRequest()`. Each is a single function to swap.
- **Sample content:** notifications, Status of Activities cards, devices, the
  alerts, activity and market rows are sample data. Add or remove items freely - the scripts work
  with any count.
- **Left as in React (no action there either):** Search, Redeem Now, View All Updates / Activity,
  View Full Market and the footer's social icons.
- **Subscribe form:** validates the e-mail in the browser only; point `action` at your endpoint.

## Icons

Icons come from the inline sprite at the top of `<body>`:

```html
<svg class="icon" width="20" height="20" aria-hidden="true"><use href="#icon-house"></use></svg>
```

Size comes from `width`/`height`, stroke from `stroke-width` (default 2), colour from CSS `color`.
To add one, copy its paths from [lucide.dev](https://lucide.dev) into a new `<symbol id="icon-…">`.

## Accessibility

Skip link; landmarks (`header`, `nav`, `main`, `aside`, `footer`); one `h1`; disclosure buttons with
`aria-expanded` / `aria-controls`; mobile menu and dashboard drawer act as modal dialogs (focus moves
in, Tab is trapped, Escape closes, focus returns); visible focus rings; decorative images have empty
`alt`; looping copies of lists are hidden from screen readers and the Tab order; motion stops for
visitors who ask for reduced motion.

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses CSS container queries and `:has()`
(Chrome/Edge 105+, Safari 16+, Firefox 121+).

## Notes

- `assets/images/brand/feed-logo.avif` is 5799 × 5725 px (330 KB) - the same file the React app
  uses. A 256 px copy would make the page noticeably lighter.
- Icons: [Lucide](https://lucide.dev) (ISC licence); footer social icons: Font Awesome Free (CC BY 4.0).
