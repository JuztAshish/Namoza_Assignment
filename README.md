# OrthoCare Clinics — Landing Page Developer Assignment

## Project Overview

A conversion-focused, fully responsive landing page for an orthopaedic/spine clinic group targeting working professionals (28–50) with knee or back pain. Built in plain HTML/CSS/vanilla JS (no frameworks) with a complete GTM/GA4 event schema, manual-integration placeholders for HubSpot, Google Ads, WhatsApp, and Karix, and documentation for a backend integration architecture.

This repository is split into three deliverables:

## Assessment Deliverables

✅ Task 1 – GTM Event Schema
TASK1-GTM-SCHEMA.md

✅ Task 2 – Landing Page
index.html
styles.css
script.js

✅ Task 3 – Integration Design
TASK3-INTEGRATION.md

1. **Task 1** — `TASK1-GTM-SCHEMA.md`: the full analytics event schema (triggers, variables, parameters, GA4 reporting, audiences, conversions).
2. **Task 2** — `index.html`, `styles.css`, `script.js`: the actual landing page, with `// MANUAL GTM IMPLEMENTATION` comments marking every spot that needs real GTM/CRM/WhatsApp wiring.
3. **Task 3** — `TASK3-INTEGRATION.md`: the backend integration architecture connecting the form to HubSpot, Karix WhatsApp, and Google Ads.

## Features

- Hero, trust/stats bar, reviews, patient-guide download, appointment form, and footer sections, all built for the stated audience and conversion goal.
- Inline, accessible form validation (Indian mobile number format) with no page reload on submit — form is swapped for a thank-you state via JS.
- Sticky mobile "Call Now / Book Now" bar that hides while the hero (which already has CTAs) is in view, using `IntersectionObserver` rather than a scroll listener.
- Every meaningful interaction is wired to a `window.dataLayer.push()` placeholder matching the schema in Task 1, ready for GTM to pick up once the container is published.
- Semantic HTML (`<header>`, `<main>`, `<footer>`, proper `<label>`/`aria-describedby` pairing), visible focus states, `prefers-reduced-motion` support, and a skip link.
- SEO meta tags (title, description, canonical, Open Graph, Twitter Card) in `index.html`.

## Folder Structure

```
Developer-Assignment/
├── index.html                 Landing page markup
├── styles.css                 All styling (no framework, mobile-first)
├── script.js                  Form validation + analytics dataLayer pushes
├── README.md                  This file
├── TASK1-GTM-SCHEMA.md        Full GTM/GA4 event schema
├── TASK3-INTEGRATION.md       Backend integration architecture
├── comments-explanation.md    Every manual configuration step, explained
└── assets/
    ├── icons/                 Place SVG/icon assets here
    ├── images/                Place photography/illustration assets here
    └── pagespeed-placeholder.png   Placeholder for the required PageSpeed screenshot
```

## How to Run

No build step or dependencies are required.

1. Clone or download this folder.
2. Open `index.html` directly in a browser, **or** serve it locally for a more production-accurate environment (recommended, since some browsers restrict `fetch`/module behaviour on `file://`):
   ```bash
   # Python 3
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```
3. To test the form, fill in a name and a valid 10-digit Indian mobile number and submit — the form will swap to a thank-you message without a page reload.
4. Open the browser console and type `window.dataLayer` after interacting with the page to confirm events are pushing correctly before GTM is wired up.

## Manual GTM Setup

GTM is intentionally **not** integrated in this codebase — only placeholder comments and the corresponding `dataLayer.push()` calls are in place. To go live:

1. Create a GTM container, get the container ID (`GTM-XXXXXXX`).
2. Paste the head snippet and `<noscript>` body snippet into `index.html` at the two marked locations (search for `MANUAL GTM IMPLEMENTATION` near `</head>` and right after `<body>`).
3. In GTM, build the triggers, variables, and tags exactly as specified in `TASK1-GTM-SCHEMA.md` — every event name, parameter, and condition needed is documented there.
4. Use GTM Preview mode against the locally served page to confirm each event fires with the correct parameters before publishing.

Full step-by-step manual configuration (GTM, HubSpot, Google Ads, WhatsApp, Karix, deployment, PageSpeed) is in `comments-explanation.md`.

## Performance Optimizations

- **No font loading**: the system font stack (`-apple-system, "Segoe UI", system-ui, sans-serif`) is used everywhere, eliminating font-loading network requests and the layout shift that comes from web font swap — directly protecting LCP and CLS.
- **No CSS/JS framework**: every rule and every function exists because this page uses it; nothing is shipped unused.
- **`fetchpriority="high"`** on the hero image (the likely LCP element) and explicit `width`/`height` attributes on all images to reserve layout space and prevent CLS.
- **`IntersectionObserver` instead of scroll listeners** for the sticky CTA visibility logic, and a **passive scroll listener** for the (dev-only) blog scroll fallback, keeping the main thread free during scroll.
- **Deferred script loading** (`defer` on `script.js`) so it doesn't block HTML parsing.
- **No render-blocking third-party requests** at initial load — GTM is added manually only once configured, by design, so this codebase's own Lighthouse/PageSpeed baseline is measured clean.

## Future Improvements

- Replace the simulated form submission in `script.js` with a real `fetch()` call to the backend lead endpoint described in `TASK3-INTEGRATION.md`.
- Add a real multi-step booking widget (the `booking_step_complete` / `booking_complete` events are already specified in the GTM schema for when this is built).
- Add a clinic locator with map integration once clinic sub-pages exist beyond placeholders.
- Add automated Lighthouse CI to catch Core Web Vitals regressions in PRs.
- Replace placeholder copy, phone numbers, and clinic names with the real business's details before launch.
