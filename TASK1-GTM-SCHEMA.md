# Task 1 — GTM Event Schema

This document defines the complete analytics event schema for the clinic landing page. It is written so that whoever configures Google Tag Manager (GTM) does not need to read the codebase — every trigger condition, variable, and parameter needed to wire up GA4 is specified here.

> **Convention used throughout this project:** event names are `snake_case` and follow the GA4 recommended-event style (verb_noun or noun_verb) so they read consistently in GA4's Events report and in Explorations.

---

## 1. Event Inventory

| # | Event Name | Trigger Type | Fires On |
|---|---|---|---|
| 1 | `landing_page_view` | Page View (DOM Ready) | Landing page loads |
| 2 | `clinic_page_view` | Page View (DOM Ready) | Any `/clinics/*` page loads |
| 3 | `form_start` | Custom Event (dataLayer push) | User focuses the first field of the appointment form |
| 4 | `booking_step_complete` (step 1) | Custom Event | User completes "Choose Specialty" step |
| 5 | `booking_step_complete` (step 2) | Custom Event | User completes "Patient Details" step |
| 6 | `booking_step_complete` (step 3) | Custom Event | User completes "Confirm Slot" step |
| 7 | `booking_complete` | Custom Event | Booking confirmation screen renders |
| 8 | `consultation_form_submitted` | Custom Event | Appointment form passes validation and is submitted |
| 9 | `phone_validation_error` | Custom Event | Phone field fails regex validation on blur/submit |
| 10 | `form_abandon` | Custom Event + Timer/Visibility trigger | User leaves page with a started, unsubmitted form |
| 11 | `call_now_click` | Click — Just Links / Trigger Group | User clicks any `tel:` link |
| 12 | `whatsapp_click` | Click — Just Links | User clicks the WhatsApp CTA |
| 13 | `download_patient_guide` | Click — Just Links | User clicks the PDF patient guide link |
| 14 | `blog_scroll_25` | Scroll Depth (25%) | Blog/article page, 25% scrolled |
| 15 | `blog_scroll_50` | Scroll Depth (50%) | Blog/article page, 50% scrolled |
| 16 | `blog_scroll_75` | Scroll Depth (75%) | Blog/article page, 75% scrolled |
| 17 | `blog_complete` | Scroll Depth (90%) or Element Visibility on footer | Blog/article page, effectively finished reading |

---

## 2. Detailed Schema (Trigger / Variables / Parameters / Reporting)

### 2.1 `landing_page_view`

| Field | Detail |
|---|---|
| **Trigger** | Trigger type: Page View → DOM Ready. Condition: `Page Path` equals `/` (or `/index.html`, matching whatever the production path is). |
| **Variables used** | `{{Page Path}}`, `{{Page URL}}`, `{{Referrer}}` |
| **Event Parameters** | `page_path`, `page_referrer`, `traffic_source` (derived from a Custom JS variable reading the `utm_source` query param, defaulting to `direct`) |
| **GA4 Report** | Reports → Engagement → Pages and screens (filtered to landing page path); also feeds the standard Acquisition reports via `traffic_source`. |
| **Audience** | "Landing Page Visitors" — used as the top of every funnel exploration build below. |
| **Conversion?** | No. This is a reach/awareness signal, not an outcome. |

### 2.2 `clinic_page_view`

| Field | Detail |
|---|---|
| **Trigger** | Page View → DOM Ready. Condition: `Page Path` contains `/clinics/`. |
| **Variables used** | `{{Page Path}}`, a Custom JS variable `clinic_location` that reads a `data-clinic` attribute on `<body>` (set per static clinic page) |
| **Event Parameters** | `clinic_location`, `page_path`, `specialty_focus` (also read from a `data-specialty` body attribute, since some clinic pages are specialty-specific, e.g. Orthopaedics) |
| **GA4 Report** | Custom Exploration: "Clinic Page Performance" — free-form table dimensioned by `clinic_location`. |
| **Audience** | "Clinic Page Visitors — [Location]" — built per-location for retargeting. |
| **Conversion?** | No. |

### 2.3 `form_start`

| Field | Detail |
|---|---|
| **Trigger** | Custom Event. Event name equals `form_start`. Fired from `script.js` on the first `focus` event inside the appointment form (fires once per session, guarded by a flag). |
| **Variables used** | `{{DLV - form_name}}` (Data Layer Variable reading `form_name`) |
| **Event Parameters** | `form_name`, `form_location` (e.g. `landing_page_hero`) |
| **GA4 Report** | Funnel Exploration step 1 (see §4). |
| **Audience** | "Form Starters, No Submission" — `form_start` fired AND `consultation_form_submitted` NOT fired in the same session. This is the primary remarketing audience for abandoned leads. |
| **Conversion?** | No — this is a micro-engagement signal, not in itself a business outcome. |

### 2.4 `booking_step_complete` (steps 1–3)

| Field | Detail |
|---|---|
| **Trigger** | Custom Event. Event name equals `booking_step_complete`. One trigger, differentiated in reporting by the `step_number` parameter — this avoids creating three near-identical triggers. |
| **Variables used** | `{{DLV - step_number}}`, `{{DLV - step_name}}`, `{{DLV - clinic_location}}`, `{{DLV - specialty}}` |
| **Event Parameters** | `step_number` (integer, 1–3), `step_name` (string, e.g. `choose_specialty`, `patient_details`, `confirm_slot`), `clinic_location`, `specialty` |
| **GA4 Report** | Funnel Exploration step 2–4 (see §4), plus a Free-form Exploration breaking down drop-off by `clinic_location` to find which clinic's booking flow underperforms. |
| **Audience** | "Booking Step 2+ — No Completion" (started patient details, no `booking_complete`). |
| **Conversion?** | Step 3 only ("Confirm Slot" reached) can optionally be marked as a micro-conversion if the business wants mid-funnel visibility in Google Ads bidding signals. Steps 1–2: No. |

**Real `dataLayer.push()` examples (not pseudocode):**

```javascript
// Step 1 — user selects a specialty (e.g. Orthopaedics)
window.dataLayer.push({
  event: "booking_step_complete",
  step_number: 1,
  step_name: "choose_specialty",
  clinic_location: "Koramangala",
  specialty: "Orthopaedics"
});

// Step 2 — user submits name/phone/preferred date on the patient details screen
window.dataLayer.push({
  event: "booking_step_complete",
  step_number: 2,
  step_name: "patient_details",
  clinic_location: "Koramangala",
  specialty: "Orthopaedics"
});

// Step 3 — user confirms the appointment slot before final submission
window.dataLayer.push({
  event: "booking_step_complete",
  step_number: 3,
  step_name: "confirm_slot",
  clinic_location: "Koramangala",
  specialty: "Orthopaedics"
});
```

### 2.5 `booking_complete`

| Field | Detail |
|---|---|
| **Trigger** | Custom Event. Event name equals `booking_complete`. Fired when the confirmation screen renders (i.e. after a successful backend acknowledgement, not just a client-side "submit click" — this distinction matters, see Task 3 on failure points). |
| **Variables used** | `{{DLV - booking_id}}`, `{{DLV - clinic_location}}`, `{{DLV - specialty}}`, `{{DLV - appointment_value}}` |
| **Event Parameters** | `booking_id`, `clinic_location`, `specialty`, `appointment_value` (a fixed estimated value per specialty, used for ROAS calculations in Ads) |
| **GA4 Report** | Funnel Exploration final step; also the primary row in the standard Conversions report. |
| **Audience** | "Converted Patients" — used as an *exclusion* audience on prospecting campaigns. |
| **Conversion?** | **Yes.** This is the macro-conversion. |

```javascript
window.dataLayer.push({
  event: "booking_complete",
  booking_id: "BK-20260630-0042",
  clinic_location: "Koramangala",
  specialty: "Orthopaedics",
  appointment_value: 500
});
```

### 2.6 `consultation_form_submitted`

| Field | Detail |
|---|---|
| **Trigger** | Custom Event. Event name equals `consultation_form_submitted`. |
| **Variables used** | `{{DLV - form_name}}`, `{{DLV - page}}`, `{{DLV - lead_source}}` |
| **Event Parameters** | `form_name`, `page`, `lead_source` |
| **GA4 Report** | Conversions report (primary KPI for the marketing team); also the GA4-side trigger for the GA4 → Google Ads conversion import. |
| **Audience** | "Form Submitters" — used to build a Customer Match seed/lookalike audience in Ads. |
| **Conversion?** | **Yes.** This is the form-fill macro-conversion (separate funnel from the multi-step booking widget, used on simpler landing pages without the full booking flow). |

### 2.7 `phone_validation_error`

| Field | Detail |
|---|---|
| **Trigger** | Custom Event. Event name equals `phone_validation_error`. |
| **Variables used** | `{{DLV - field_name}}`, `{{DLV - error_type}}` |
| **Event Parameters** | `field_name` (always `phone` here, kept generic for reuse), `error_type` (`invalid_format`, `too_short`, `empty`), `form_name` |
| **GA4 Report** | Free-form Exploration: "Form Friction" — counts of `phone_validation_error` segmented by `error_type`, used by UX to prioritise field-level fixes. |
| **Audience** | Not used for audiences — diagnostic event only. |
| **Conversion?** | No. |

### 2.8 `form_abandon`

| Field | Detail |
|---|---|
| **Trigger** | Custom Event, fired via a `visibilitychange`/`beforeunload` listener in `script.js` when `form_start` has fired but `consultation_form_submitted` has not, in the same session. |
| **Variables used** | `{{DLV - form_name}}`, `{{DLV - last_field_completed}}`, `{{DLV - time_on_form_seconds}}` |
| **Event Parameters** | `form_name`, `last_field_completed`, `time_on_form_seconds` |
| **GA4 Report** | Free-form Exploration: "Drop-off Point" — bar chart of `last_field_completed` counts, tells the team exactly which field causes the most abandonment. |
| **Audience** | "Form Abandoners" — same population as "Form Starters, No Submission" but with the added field-level detail; used for SMS/WhatsApp re-engagement, not ad remarketing. |
| **Conversion?** | No. |

### 2.9 `call_now_click`

| Field | Detail |
|---|---|
| **Trigger** | Click — Just Links. Condition: `Click URL` starts with `tel:`. |
| **Variables used** | `{{Click URL}}`, `{{Click Text}}`, `{{Page Path}}` |
| **Event Parameters** | `phone_number` (parsed from `Click URL`), `click_location` (e.g. `header`, `hero`, `sticky_footer` — read from a `data-cta-location` attribute on the link) |
| **GA4 Report** | Standard Engagement → Events report, plus a Free-form table by `click_location` to compare CTA placements. |
| **Audience** | "High-Intent — Called" — combined later with Ads call-tracking data if a call-tracking number is layered on. |
| **Conversion?** | **Yes.** Phone calls from a clinic landing page are a primary conversion path for this audience (28–50, likely to prefer calling over filling a form). |

### 2.10 `whatsapp_click`

| Field | Detail |
|---|---|
| **Trigger** | Click — Just Links. Condition: `Click URL` contains `wa.me` or `api.whatsapp.com`. |
| **Variables used** | `{{Click URL}}`, `{{Page Path}}` |
| **Event Parameters** | `click_location`, `prefilled_message` (boolean — whether the wa.me link included a `text=` param) |
| **GA4 Report** | Engagement → Events, segmented by `click_location`. |
| **Audience** | "High-Intent — WhatsApp" — feeds the Karix WhatsApp follow-up flow described in Task 3. |
| **Conversion?** | **Yes**, marked as a secondary conversion (WhatsApp is a real lead channel for this clinic, but slightly lower-intent than a completed booking or call). |

### 2.11 `download_patient_guide`

| Field | Detail |
|---|---|
| **Trigger** | Click — Just Links. Condition: `Click URL` ends with `.pdf` AND `Click URL` contains `patient-guide`. |
| **Variables used** | `{{Click URL}}`, `{{Page Path}}` |
| **Event Parameters** | `file_name`, `link_text` |
| **GA4 Report** | Engagement → Events. |
| **Audience** | "Guide Downloaders" — top-of-funnel nurture audience, lower commercial intent than calls/WhatsApp/bookings. |
| **Conversion?** | No — informational engagement, not a lead. |

### 2.12 `blog_scroll_25` / `blog_scroll_50` / `blog_scroll_75` / `blog_complete`

| Field | Detail |
|---|---|
| **Trigger** | Built-in GTM **Scroll Depth** trigger. Vertical Percentages: `25,50,75,90`. Condition: `Page Path` matches RegEx `^/blog/`. GTM auto-fires `gtm.scrollDepth` once per threshold; these four custom events are split out of that single trigger using the built-in `{{Scroll Depth Threshold}}` variable in four separate tags (or one tag with a Lookup Table mapping threshold → event name). |
| **Variables used** | `{{Scroll Depth Threshold}}`, `{{Page Path}}`, `{{Page Title}}` |
| **Event Parameters** | `article_title`, `scroll_percentage` |
| **GA4 Report** | Engagement → Pages and screens, with `scroll_percentage` as a secondary dimension; used to compute read-through rate per article. |
| **Audience** | "Engaged Readers — 75%+" (fired `blog_scroll_75` or `blog_complete`) — used as a content-based remarketing audience, since this user has demonstrated genuine interest in a specific condition (e.g. an article about knee pain). |
| **Conversion?** | No. `blog_complete` can optionally be set as a soft/secondary conversion if content marketing is being measured on its own KPI separate from lead gen. |

---

## 3. Funnel Drop-off — Explanation

The two funnels on this site are:

**Funnel A (form-based lead gen):** `landing_page_view` → `form_start` → `consultation_form_submitted`
**Funnel B (multi-step appointment booking):** `landing_page_view` → `form_start` (or `booking_step_complete` step 1) → `booking_step_complete` (step 2) → `booking_step_complete` (step 3) → `booking_complete`

Drop-off is simply the percentage of users present at step *n* who do not appear at step *n+1* within the same session. GA4's Funnel Exploration computes this automatically once the steps are defined as events with the right conditions — it does not require any additional tagging, **provided every step event reliably fires in the correct order**. This is why `step_number` is sent as an explicit parameter on `booking_step_complete` rather than relying on event order in GA4's raw event stream: GA4 ingests events asynchronously and an out-of-order arrival (e.g. due to a slow network on step 2) could otherwise corrupt a sequential, non-parameter-based funnel.

The most actionable drop-off in this schema is almost always between `booking_step_complete` (step 1, "choose specialty") and step 2 ("patient details") — that's the point where the user has expressed light interest but is now asked to actually identify themselves, which is the highest-friction moment in the flow. The `form_abandon` event with `last_field_completed` exists specifically to give qualitative detail on *why* that drop-off happens (e.g. if `last_field_completed` clusters on "phone", the phone field itself — not the concept of giving contact info — is the blocker).

## 4. How the GTM Trigger Mechanism Works (exact mechanics)

1. `script.js` pushes a plain JavaScript object onto `window.dataLayer` — an array that GTM's container snippet has already initialised on page load (`window.dataLayer = window.dataLayer || []`).
2. GTM's container listens to that array via an overridden `push` method. The moment a new object lands, GTM evaluates every **Custom Event trigger** in the container against the `event` key of that object.
3. If a trigger's "Event name" field matches the pushed `event` value (and any additional trigger conditions, e.g. a Page Path filter, also evaluate true), every tag wired to that trigger fires **in the same execution tick**, synchronously, before the next line of page JavaScript runs (this matters for things like the Google Ads conversion tag, which needs to fire before a user can navigate away).
4. Tags read the rest of the pushed object's keys using **Data Layer Variables (DLVs)** — a DLV named `step_number`, for instance, is simply configured in GTM to read `step_number` from the most recent `dataLayer` push.
5. The GA4 Event tag then maps those DLVs into GA4 Event Parameters, and the GA4 Configuration tag (fired once on page load) ensures the GA4 client ID and session context are already attached to every subsequent event in the page's lifetime.

In short: **dataLayer push → trigger match → tag fires → tag reads DLVs → tag sends data to GA4 (or Ads, or both).** Nothing in this chain requires a page reload, which is why this architecture supports a single-page-feeling multi-step booking form.

## 5. GA4 Funnel Exploration — Configuration Steps

1. In GA4, go to **Explore → Funnel Exploration** (blank template).
2. Set **Step 1**: Event = `form_start` (or `landing_page_view` if you want to measure from the very top, including users who never touch the form).
3. Add **Step 2**: Event = `booking_step_complete`, condition `step_number = 2` (using the "Add condition" option scoped to the event parameter, not just the event name — this is what makes the funnel step-specific rather than counting any `booking_step_complete`).
4. Add **Step 3**: Event = `booking_step_complete`, condition `step_number = 3`.
5. Add **Step 4 (final)**: Event = `booking_complete`.
6. Set funnel type to **Open funnel** initially (so you can see entries at any step, useful for diagnosing where paid traffic actually lands users), then duplicate as a **Closed funnel** for a stricter "started at step 1" view.
7. Enable **"Show elapsed time"** to see how long users take between steps — combined with `time_on_form_seconds` from `form_abandon`, this tells you whether drop-off is about confusion (slow) or rejection (fast).
8. Add a breakdown dimension of `clinic_location` to see whether the drop-off pattern is consistent across clinics or specific to one location's flow.

## 6. Why `consultation_form_submitted` Should Be Imported Into Google Ads

`consultation_form_submitted` is the cleanest, highest-confidence "this person wants a consultation" signal the page produces (separate from the multi-step `booking_complete`, which only exists on pages using the full booking widget). Importing it into Google Ads as a conversion action matters for two concrete reasons:

1. **Smart Bidding needs a conversion signal to optimise against.** Target CPA / Maximize Conversions bidding strategies adjust bids in real time using the conversion events Ads is told about. Without this import, Ads has no idea which clicks actually became leads, and will optimise toward generic engagement (clicks, sessions) instead of toward people who actually filled out the form — which on a healthcare landing page is a meaningfully different audience than "anyone who clicked."
2. **It enables accurate ROAS/CPA reporting against ad spend**, since the import carries through GCLID-based attribution, letting the marketing team see cost-per-form-submission by campaign, ad group, and even keyword — which is what justifies (or kills) budget at the campaign level. Without the import, GA4 sees the conversion but Ads — where the spend decisions actually get made — does not.
