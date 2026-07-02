# Task 3 — Integration Architecture

**Flow:** Landing Page → Backend API → HubSpot API → Karix WhatsApp API → Google Ads Conversion

## Why a Direct API, Not Zapier

Zapier is acceptable for low-volume internal tooling, but it's the wrong choice here for three reasons. First, **latency and reliability**: Zapier polls or webhooks through its own queue with no SLA on speed, and a delayed WhatsApp confirmation after a patient books a knee/back-pain consultation directly hurts conversion — patients in pain who don't get a fast confirmation often call a competitor. Second, **no control over retries or partial failure** — if HubSpot succeeds but Karix fails, Zapier's multi-step Zaps don't give fine-grained, conditional retry logic per downstream system. Third, **cost at scale**: per-task Zapier pricing becomes expensive once form volume grows, whereas a backend API service is a flat infrastructure cost. A thin Node/Express (or equivalent) service we own gives full control over ordering, retries, and observability.

## Failure Points & Mitigation

The chain has four points of failure: the lead-capture API call itself, the HubSpot contact upsert, the Karix WhatsApp send, and the Google Ads conversion import. Each is treated as **independent and idempotent** — a failure in Karix should never block the HubSpot write, and vice versa. This requires the backend to fan the lead out to each downstream system separately rather than chaining them synchronously.

## Retry, Queue & Logging

Each downstream call is pushed onto its own **message queue** (e.g. SQS or a Redis-backed queue) rather than called inline from the HTTP request handler. This decouples "the patient's form submission succeeded" from "every downstream system has been notified," so the landing page gets a fast response regardless of HubSpot/Karix latency. Failed jobs use **exponential backoff** (e.g. 1m, 5m, 30m, then dead-letter after 3 attempts), and every attempt — success or failure — is logged with a correlation ID tying it back to the original lead so a support engineer can trace one patient's record across all three systems.

## Deduplication, Monitoring & SLA

**Phone number deduplication** happens at the backend layer before any downstream call, normalising numbers (stripping `+91`/`0` prefixes) and checking against recent submissions (a 24-hour window) to prevent duplicate HubSpot contacts and duplicate WhatsApp messages from accidental double-submits. **Monitoring** tracks queue depth, per-system error rate, and end-to-end latency, alerting if HubSpot or Karix error rates exceed 2% or if the dead-letter queue grows — that threshold is the **SLA**: 98% of leads should reach HubSpot within 5 minutes, and any breach pages the on-call engineer.
