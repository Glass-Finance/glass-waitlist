# Incident rollback & payments kill switch

Frontend-only runbook for "something is wrong in production, stop the bleeding
now." Backend/infra incidents (ledger, Paystack outage, key compromise) are
out of scope here — those live with the Spring Boot service.

## Severity guide

| Symptom                                      | Severity | First action                                              |
| -------------------------------------------- | -------- | --------------------------------------------------------- |
| Payments double-charging or failing en masse | SEV-1    | Disable payments (below), page backend on-call            |
| Auth loop / everyone logged out              | SEV-1    | Roll back deploy (below), check `api.glasspay.app` status |
| Broken page for one route                    | SEV-2    | Roll back deploy                                          |
| Cosmetic bug                                 | SEV-3    | Fix-forward on a branch                                   |

## 1. Disable payments without a code change (kill switch)

`VITE_FLAGS` inlines a JSON flag map at build time. Setting
`paymentsDisabled: true` blocks the pay buttons on both the member Payment
Summary and the admin payment modal (`src/lib/flags.js`).

1. Vercel → project **Glass** (`app.glasspay.app`) → Settings → Environment
   Variables.
2. Add/update `VITE_FLAGS` for **Production**:
   ```json
   { "paymentsDisabled": true }
   ```
3. Deployments → redeploy the current Production deployment (Promote/Redeploy).
   Build-time inline means the flag takes effect only after this redeploy
   (~30–60s on Vercel).
4. Verify: open a payment link in an incognito window — the pay button shows
   the disabled/"temporarily unavailable" state.
5. When clear, set `VITE_FLAGS` back to `{}` (or delete it) and redeploy.

This stops _new_ initiations from the UI. It does not cancel in-flight
Paystack checkouts or stop backend-initiated charges/auto-pay — for those,
the backend team must disable authorisations/mandates server-side.

## 2. Roll back a bad deploy

Vercel keeps every deployment. No git revert needed for an emergency:

1. Vercel → Deployments → find the last good Production deployment
   (⋯ menu) → **Promote to Production**.
2. Instant routing swap; no rebuild required.
3. After the incident, still land a `fix/` branch so `main` matches what's
   running — otherwise the next deploy re-introduces the bug.

## 3. Stale-bundle note

The app hard-reloads on `vite:preloadError` (stale chunk hashes after a
deploy), so users pick up a rollback within one navigation. If a tab is
completely wedged, a hard refresh (`Ctrl/Cmd+Shift+R`) is the manual
equivalent.

## 4. Observability during an incident

- Sentry: set `VITE_SENTRY_DSN` in Vercel if not already set — without it
  production runs blind. `VITE_SENTRY_TRACES_SAMPLE_RATE` (default `0.1`)
  controls performance sampling.
- Vercel → Observability / Speed Insights for field data.
- Backend logs are the source of truth for anything money-related; this
  runbook cannot see them.

## 5. Backend-owned switches (coordinate, not in this repo)

These must exist server-side and are referenced here only so frontend
on-call knows to ask for them:

- Reject new `POST /payments/pay/...` (hard pay stop that also covers
  auto-pay mandates).
- Pause settlement / reconciliation runs.
- Revoke compromised refresh-token families.
