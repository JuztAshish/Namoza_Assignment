# Manual Configuration Checklist

This document lists **every place** that needs manual setup before this project can go live. Each item explains exactly what to do and why — treat this as the launch checklist.

---

### 1. Replace the GTM Container ID

**Where:** `index.html`, two locations marked `MANUAL GTM IMPLEMENTATION` — one just before `</head>`, one just after `<body>`.
**What to do:** Create a GTM container at tagmanager.google.com, copy the issued `GTM-XXXXXXX` ID, and paste both the head `<script>` snippet and the body `<noscript>` snippet GTM gives you into those two spots, replacing the placeholder ID.
**Why it's manual:** The container ID is unique per GTM account and shouldn't be hardcoded by a developer who doesn't have access to the live account.

### 2. Implement the dataLayer Triggers in GTM

**Where:** Inside the GTM container itself (web UI), using `TASK1-GTM-SCHEMA.md` as the spec.
**What to do:** Build a Custom Event trigger for every event name listed in the schema (`form_start`, `booking_step_complete`, `consultation_form_submitted`, etc.), wire each to a GA4 Event tag, and map the listed parameters to Data Layer Variables.
**Why it's manual:** `script.js` already pushes the correct objects to `window.dataLayer` — GTM just needs to be configured to listen for them. This is intentionally kept out of the codebase so non-developers (the analytics/marketing team) can adjust tracking without a code deploy.

### 3. Connect the HubSpot API Key

**Where:** Backend service described in `TASK3-INTEGRATION.md` (not in this frontend repo — the frontend never talks to HubSpot directly, for security reasons: a private API key must never ship in client-side JavaScript).
**What to do:** Generate a HubSpot Private App token with `crm.objects.contacts.write` scope, store it as a backend environment variable (e.g. `HUBSPOT_API_KEY`), and use it in the backend's contact-upsert call.
**Why it's manual:** API keys are secrets and must never be committed to a frontend repository or hardcoded in `script.js`.

### 4. Configure the Google Ads Conversion ID

**Where:** Inside GTM, on the Google Ads Conversion Tracking tag, triggered off the `consultation_form_submitted` and `booking_complete` events.
**What to do:** In Google Ads, create a "Website" conversion action, copy the Conversion ID/Label pair, and enter it into the GTM tag's fields. Also enable GA4 → Google Ads conversion import as an alternative/complementary path (see `TASK1-GTM-SCHEMA.md` §6 for why).
**Why it's manual:** Conversion IDs are tied to a specific Google Ads account that the developer does not have access to.

### 5. Configure WhatsApp Business API

**Where:** The `wa.me` links in `index.html` (footer and any other WhatsApp CTA) and the `whatsapp_click` tracking block in `script.js`.
**What to do:** Replace the placeholder phone number `911234567890` in every `wa.me` link with the clinic's real WhatsApp Business number, and confirm the pre-filled message text matches what the support team wants to receive.
**Why it's manual:** The phone number is real business data the developer doesn't own, and message copy should be approved by whoever staffs WhatsApp support.

### 6. Configure Karix (WhatsApp Business Solution Provider)

**Where:** Backend service described in `TASK3-INTEGRATION.md`.
**What to do:** Sign up for a Karix account, get API credentials, and implement the backend job (queued, with retries as documented) that sends an automated WhatsApp confirmation message after a lead is captured.
**Why it's manual:** This requires a paid third-party account and credentials outside the scope of frontend code.

### 7. Deploy to GitHub Pages (or chosen host)

**Where:** Repository settings.
**What to do:** Push this folder to a GitHub repository, enable GitHub Pages on the `main` branch (root or `/docs`, depending on your repo layout), and confirm `index.html` loads correctly at the published URL. Update the `<link rel="canonical">` and Open Graph URLs in `index.html` to match the real deployed domain.
**Why it's manual:** Deployment requires repository/hosting access decisions (custom domain, branch, hosting provider) that are a business decision, not a code decision.

### 8. Run PageSpeed Insights

**Where:** pagespeed.web.dev, against the deployed URL from step 7.
**What to do:** Run both mobile and desktop reports, confirm Core Web Vitals (LCP, CLS, INP) are in the "Good" range, and address any flagged issues (commonly: unoptimised/uncompressed images once real photography replaces the placeholder hero image).
**Why it's manual:** PageSpeed can only meaningfully score a live, deployed URL — not local files — so this has to happen after step 7.

### 9. Capture the PageSpeed Screenshot

**Where:** `assets/pagespeed-placeholder.png` — replace this file.
**What to do:** Take a screenshot of the PageSpeed Insights results page from step 8 and save it over the placeholder file (keep the same filename so any documentation referencing it still resolves, or update the reference if you rename it).
**Why it's manual:** This is evidence of the live site's real performance, which only exists after deployment and testing — it can't be generated ahead of time.

---

## Additional items worth double-checking before launch

- Replace placeholder phone number `+911234567890` everywhere it appears (`index.html` header, hero, footer, sticky CTA, and the `tel:`/`wa.me` links).
- Replace placeholder clinic names/locations (`Koramangala`, `Indiranagar`, `Whitefield`) with real clinic data, and update the `data-clinic`/`data-specialty` body attributes referenced in `TASK1-GTM-SCHEMA.md` §2.2 on each real clinic sub-page.
- Add real photography to `assets/images/` (the hero currently references `hero-consultation.jpg`, which does not exist yet) and a real `assets/patient-guide.pdf`.
- Replace `https://www.example-clinic.com` throughout `index.html` with the real production domain.
