# OpenAPI Wave 10 Handoff (2026-04-13)

## What shipped in this wave

Wave 10 adds large-surface OpenAPI coverage for `mastermind/*` and `patient/*` endpoints.

## Paths added

Mastermind:

1. `GET + POST /api/mastermind/aura-import`
2. `POST /api/mastermind/complete`
3. `GET + POST /api/mastermind/consent`
4. `POST /api/mastermind/copilot`
5. `GET + POST /api/mastermind/follow-up`
6. `POST /api/mastermind/pdf`
7. `GET /api/mastermind/pdf/serve`
8. `POST /api/mastermind/plan`
9. `POST /api/mastermind/plan-send`
10. `POST /api/mastermind/scan`
11. `GET + POST /api/mastermind/sessions`
12. `GET + PATCH /api/mastermind/sessions/{id}`
13. `POST /api/mastermind/sessions/{id}/validate`
14. `POST /api/mastermind/share`
15. `GET /api/mastermind/share/{token}`
16. `POST /api/mastermind/share/interest`
17. `POST /api/mastermind/simulate`

Patient:

18. `GET /api/patient/appointments`
19. `GET /api/patient/loyalty`
20. `GET /api/patient/membership`
21. `GET /api/patient/membership/billing`
22. `GET /api/patient/plan`
23. `GET /api/patient/referrals`
24. `GET /api/patient/treatments`

## Notes

- Used templated path parameters for dynamic routes (`{id}`, `{token}`).
- Preserved public-vs-auth intent (e.g., `share/{token}` public read, `share/interest` public write).
- Kept this wave OpenAPI-only; no application logic edits.

## Suggested next wave (Wave 11)

Close remaining documentation gaps:

1. dashboard operational routes still missing from spec (`pricing`, `phone-agent`, `social`, `inventory`, `kpis`, `finance/pnl`, `agents/*`)
2. low-risk AI stubs (`/ai/advisor`, `/ai/outcome`, `/ai/protocols`, `/ai/quiz`, `/ai/skin-analysis`)
3. final reconciliation pass to ensure route-map parity is near 100%

## Paste-ready update for Claude

```text
Wave 10 OpenAPI is done.

Added 24 paths in openapi.yaml covering mastermind and patient surfaces:
- Mastermind: aura-import, complete, consent, copilot, follow-up, pdf, pdf/serve, plan, plan-send, scan, sessions, sessions/{id}, sessions/{id}/validate, share, share/{token}, share/interest, simulate
- Patient: appointments, loyalty, membership, membership/billing, plan, referrals, treatments

Handoff doc: docs/codex-handoff/OPENAPI-WAVE-10-HANDOFF-2026-04-13.md

OpenAPI-only scope; no app logic changes in this wave.
```
