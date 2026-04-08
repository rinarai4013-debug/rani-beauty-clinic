# Route Readiness Generated Report

Generated: 2026-04-08T04:31:06.064Z

## Totals

- API route files: 251
- Stub route files: 199
- Real/proxy route files: 52
- Dashboard route files: 134
- Dashboard routes with auth markers: 19
- Dashboard routes without auth markers: 115
- Routes accepting body/form data: 19
- Routes with validation markers: 22
- Non-webhook public mutation candidates: 3
- Non-webhook public mutation candidates with rate limits: 3

## Critical And High Risk Candidates

| Risk | Route | Methods | Stub | Auth | Permission | Body | Validation | Rate Limit | Signature | Services | File | Line |
|---|---|---:|---|---|---|---|---|---|---|---|---|---:|
| high | `/api/booking/intake` | GET, PATCH, POST | no | no | no | yes | yes | yes | yes | Airtable | `src/app/api/booking/intake/route.ts` | 81 |
| high | `/api/consultation/submit` | GET, POST | no | no | no | yes | yes | yes | no | Airtable, Cherry | `src/app/api/consultation/submit/route.ts` | 68 |
| high | `/api/contact` | POST | no | no | no | yes | yes | yes | no | Airtable, Resend, n8n | `src/app/api/contact/route.ts` | 22 |
| high | `/api/dashboard/loyalty` | GET, POST | no | yes | yes | yes | no | no | yes | Airtable | `src/app/api/dashboard/loyalty/route.ts` | 2 |
| high | `/api/patient/auth/magic-link` | POST | no | no | no | yes | yes | yes | no | Airtable, Resend | `src/app/api/patient/auth/magic-link/route.ts` | 25 |
| high | `/api/photo/upload` | POST | no | no | no | yes | no | yes | no | - | `src/app/api/photo/upload/route.ts` | 19 |
| high | `/api/skin-analysis` | GET, POST | no | no | no | yes | no | yes | no | - | `src/app/api/skin-analysis/route.ts` | 24 |
| high | `/api/templates/pdf` | GET, POST | no | no | no | yes | no | yes | no | n8n | `src/app/api/templates/pdf/route.ts` | 59 |

## All Routes

| Risk | Route | Methods | Stub | Auth | Permission | Body | Validation | Rate Limit | Signature | Airtable | Mutates | File |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| low | `/api/ads/auto-scale` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ads/auto-scale/route.ts` |
| low | `/api/ads/demand` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ads/demand/route.ts` |
| low | `/api/ai/advisor` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/advisor/route.ts` |
| low | `/api/ai/chat` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/chat/route.ts` |
| low | `/api/ai/intake` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/intake/route.ts` |
| low | `/api/ai/outcome` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/outcome/route.ts` |
| low | `/api/ai/protocols` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/protocols/route.ts` |
| low | `/api/ai/quiz` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/quiz/route.ts` |
| low | `/api/ai/recommend` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ai/recommend/route.ts` |
| medium | `/api/ai/skin-analysis` | - | no | no | no | no | no | no | no | no | no | `src/app/api/ai/skin-analysis/route.ts` |
| medium | `/api/booking/availability` | GET | no | no | no | no | yes | no | no | no | no | `src/app/api/booking/availability/route.ts` |
| medium | `/api/booking/book` | GET, POST | no | no | no | yes | yes | no | no | no | no | `src/app/api/booking/book/route.ts` |
| medium | `/api/booking/calendar` | GET | no | no | no | no | yes | no | no | no | no | `src/app/api/booking/calendar/route.ts` |
| high | `/api/booking/intake` | GET, PATCH, POST | no | no | no | yes | yes | yes | yes | yes | yes | `src/app/api/booking/intake/route.ts` |
| medium | `/api/booking/reminders` | GET | no | no | no | no | no | no | no | no | no | `src/app/api/booking/reminders/route.ts` |
| medium | `/api/booking/waitlist` | DELETE, GET, POST | no | no | no | yes | yes | no | no | no | no | `src/app/api/booking/waitlist/route.ts` |
| low | `/api/checkout` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/checkout/route.ts` |
| high | `/api/consultation/submit` | GET, POST | no | no | no | yes | yes | yes | no | yes | yes | `src/app/api/consultation/submit/route.ts` |
| high | `/api/contact` | POST | no | no | no | yes | yes | yes | no | yes | yes | `src/app/api/contact/route.ts` |
| low | `/api/cron/daily-briefing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/cron/daily-briefing/route.ts` |
| low | `/api/cron/daily-kpi` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/cron/daily-kpi/route.ts` |
| low | `/api/dashboard/activity` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/activity/route.ts` |
| low | `/api/dashboard/alerts/[id]` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/alerts/[id]/route.ts` |
| low | `/api/dashboard/alerts` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/alerts/route.ts` |
| medium | `/api/dashboard/auth/login` | POST | no | yes | no | yes | yes | no | yes | no | no | `src/app/api/dashboard/auth/login/route.ts` |
| medium | `/api/dashboard/auth/logout` | POST | no | yes | no | no | no | no | no | no | no | `src/app/api/dashboard/auth/logout/route.ts` |
| medium | `/api/dashboard/auth/me` | GET | no | yes | no | no | no | no | no | no | no | `src/app/api/dashboard/auth/me/route.ts` |
| low | `/api/dashboard/behavioral-insights` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/behavioral-insights/route.ts` |
| low | `/api/dashboard/briefing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/briefing/route.ts` |
| low | `/api/dashboard/charting` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/charting/route.ts` |
| low | `/api/dashboard/clients/[id]/churn` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/clients/[id]/churn/route.ts` |
| low | `/api/dashboard/clients/[id]/recommend` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/clients/[id]/recommend/route.ts` |
| medium | `/api/dashboard/clients/[id]` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/clients/[id]/route.ts` |
| low | `/api/dashboard/clients/at-risk` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/clients/at-risk/route.ts` |
| low | `/api/dashboard/clients` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/clients/route.ts` |
| low | `/api/dashboard/communications/analytics` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/communications/analytics/route.ts` |
| low | `/api/dashboard/communications/campaigns` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/communications/campaigns/route.ts` |
| low | `/api/dashboard/communications/inbox` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/communications/inbox/route.ts` |
| low | `/api/dashboard/communications/preferences` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/communications/preferences/route.ts` |
| medium | `/api/dashboard/communications` | GET | no | yes | yes | no | no | no | no | no | no | `src/app/api/dashboard/communications/route.ts` |
| low | `/api/dashboard/communications/send` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/communications/send/route.ts` |
| low | `/api/dashboard/communications/templates` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/communications/templates/route.ts` |
| low | `/api/dashboard/competitor-intel` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/competitor-intel/route.ts` |
| low | `/api/dashboard/compliance` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/compliance/route.ts` |
| low | `/api/dashboard/consult` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/consult/route.ts` |
| low | `/api/dashboard/crm/automations` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/automations/route.ts` |
| low | `/api/dashboard/crm/lifecycle` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/lifecycle/route.ts` |
| low | `/api/dashboard/crm/notes` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/notes/route.ts` |
| low | `/api/dashboard/crm/overview` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/overview/route.ts` |
| low | `/api/dashboard/crm/pipeline` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/pipeline/route.ts` |
| low | `/api/dashboard/crm/segments` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/segments/route.ts` |
| low | `/api/dashboard/crm/tasks` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/crm/tasks/route.ts` |
| low | `/api/dashboard/entry/ceo-note` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/ceo-note/route.ts` |
| low | `/api/dashboard/entry/consult-notes` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/consult-notes/route.ts` |
| low | `/api/dashboard/entry/eod-recap` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/eod-recap/route.ts` |
| low | `/api/dashboard/entry/expense` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/expense/route.ts` |
| low | `/api/dashboard/entry/inventory` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/inventory/route.ts` |
| low | `/api/dashboard/entry/lead` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/lead/route.ts` |
| low | `/api/dashboard/entry/review` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/review/route.ts` |
| low | `/api/dashboard/entry/room-issue` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/room-issue/route.ts` |
| low | `/api/dashboard/entry/sale` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/sale/route.ts` |
| low | `/api/dashboard/entry/staff-note` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/entry/staff-note/route.ts` |
| low | `/api/dashboard/finance/cash-flow` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/cash-flow/route.ts` |
| low | `/api/dashboard/finance/expenses` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/expenses/route.ts` |
| low | `/api/dashboard/finance/forecast` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/forecast/route.ts` |
| low | `/api/dashboard/finance/investments` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/investments/route.ts` |
| low | `/api/dashboard/finance/overview` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/overview/route.ts` |
| low | `/api/dashboard/finance/pnl` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/pnl/route.ts` |
| low | `/api/dashboard/finance/pricing-intel` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/pricing-intel/route.ts` |
| low | `/api/dashboard/finance/tax` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/finance/tax/route.ts` |
| low | `/api/dashboard/funnel-health` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/funnel-health/route.ts` |
| low | `/api/dashboard/gamification/achievements` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/achievements/route.ts` |
| low | `/api/dashboard/gamification/briefing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/briefing/route.ts` |
| low | `/api/dashboard/gamification/challenges` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/challenges/route.ts` |
| low | `/api/dashboard/gamification/leaderboard` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/leaderboard/route.ts` |
| low | `/api/dashboard/gamification/score` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/score/route.ts` |
| low | `/api/dashboard/gamification/snapshot` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/snapshot/route.ts` |
| low | `/api/dashboard/gamification/wins` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/gamification/wins/route.ts` |
| low | `/api/dashboard/glp1` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/glp1/route.ts` |
| low | `/api/dashboard/integrations/jotform` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/integrations/jotform/route.ts` |
| low | `/api/dashboard/integrations/mangomint` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/integrations/mangomint/route.ts` |
| low | `/api/dashboard/integrations/square` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/integrations/square/route.ts` |
| low | `/api/dashboard/integrations/sync-all` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/integrations/sync-all/route.ts` |
| low | `/api/dashboard/integrations/test-connection` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/integrations/test-connection/route.ts` |
| low | `/api/dashboard/inventory/analytics` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/inventory/analytics/route.ts` |
| low | `/api/dashboard/inventory/products` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/inventory/products/route.ts` |
| low | `/api/dashboard/inventory/purchase-orders` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/inventory/purchase-orders/route.ts` |
| low | `/api/dashboard/inventory/receiving` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/inventory/receiving/route.ts` |
| medium | `/api/dashboard/inventory` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/inventory/route.ts` |
| low | `/api/dashboard/inventory/suppliers` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/inventory/suppliers/route.ts` |
| low | `/api/dashboard/inventory/waste` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/inventory/waste/route.ts` |
| low | `/api/dashboard/knowledge-base` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/knowledge-base/route.ts` |
| low | `/api/dashboard/kpis` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/kpis/route.ts` |
| medium | `/api/dashboard/leads` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/leads/route.ts` |
| low | `/api/dashboard/leads/stats` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/leads/stats/route.ts` |
| low | `/api/dashboard/loyalty/redeem` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/loyalty/redeem/route.ts` |
| high | `/api/dashboard/loyalty` | GET, POST | no | yes | yes | yes | no | no | yes | yes | no | `src/app/api/dashboard/loyalty/route.ts` |
| low | `/api/dashboard/marketing/attribution` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/marketing/attribution/route.ts` |
| low | `/api/dashboard/marketing/content` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/marketing/content/route.ts` |
| low | `/api/dashboard/marketing/leads` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/marketing/leads/route.ts` |
| low | `/api/dashboard/marketing/reviews` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/marketing/reviews/route.ts` |
| medium | `/api/dashboard/marketing` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/marketing/route.ts` |
| low | `/api/dashboard/marketing/seo` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/marketing/seo/route.ts` |
| low | `/api/dashboard/membership/members/[id]` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/membership/members/[id]/route.ts` |
| low | `/api/dashboard/membership` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/membership/route.ts` |
| low | `/api/dashboard/meta-ads/optimize` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/meta-ads/optimize/route.ts` |
| medium | `/api/dashboard/meta-ads` | GET | no | yes | yes | no | no | no | no | no | no | `src/app/api/dashboard/meta-ads/route.ts` |
| low | `/api/dashboard/payments` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/payments/route.ts` |
| low | `/api/dashboard/phone-agent` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/phone-agent/route.ts` |
| low | `/api/dashboard/plaid/accounts` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/accounts/route.ts` |
| low | `/api/dashboard/plaid/disconnect` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/disconnect/route.ts` |
| low | `/api/dashboard/plaid/exchange-token` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/exchange-token/route.ts` |
| low | `/api/dashboard/plaid/link-token` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/link-token/route.ts` |
| low | `/api/dashboard/plaid/sandbox-connect` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/sandbox-connect/route.ts` |
| low | `/api/dashboard/plaid/summary` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/summary/route.ts` |
| low | `/api/dashboard/plaid/transactions/[id]/reconcile` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/transactions/[id]/reconcile/route.ts` |
| low | `/api/dashboard/plaid/transactions/matches` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/transactions/matches/route.ts` |
| medium | `/api/dashboard/plaid/transactions` | GET | no | yes | yes | no | no | no | no | no | no | `src/app/api/dashboard/plaid/transactions/route.ts` |
| low | `/api/dashboard/plaid/transactions/sync` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/plaid/transactions/sync/route.ts` |
| medium | `/api/dashboard/plan-builder/export-pdf` | POST | no | yes | no | yes | yes | no | no | yes | no | `src/app/api/dashboard/plan-builder/export-pdf/route.ts` |
| medium | `/api/dashboard/plan-builder` | DELETE, GET, PATCH, POST | no | yes | no | yes | yes | no | no | yes | yes | `src/app/api/dashboard/plan-builder/route.ts` |
| medium | `/api/dashboard/plan-builder/send` | POST | no | yes | no | yes | yes | no | yes | yes | yes | `src/app/api/dashboard/plan-builder/send/route.ts` |
| low | `/api/dashboard/pricing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/pricing/route.ts` |
| low | `/api/dashboard/providers/[name]` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/providers/[name]/route.ts` |
| low | `/api/dashboard/providers/compensation` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/providers/compensation/route.ts` |
| low | `/api/dashboard/providers/development` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/providers/development/route.ts` |
| low | `/api/dashboard/providers/goals` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/providers/goals/route.ts` |
| low | `/api/dashboard/providers/performance` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/providers/performance/route.ts` |
| medium | `/api/dashboard/providers` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/providers/route.ts` |
| low | `/api/dashboard/providers/schedule` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/providers/schedule/route.ts` |
| low | `/api/dashboard/reactivation` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/reactivation/route.ts` |
| low | `/api/dashboard/referrals/generate` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/referrals/generate/route.ts` |
| low | `/api/dashboard/referrals` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/referrals/route.ts` |
| low | `/api/dashboard/revenue-optimizer/actions` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/actions/route.ts` |
| low | `/api/dashboard/revenue-optimizer/forecast` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/forecast/route.ts` |
| low | `/api/dashboard/revenue-optimizer/gaps` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/gaps/route.ts` |
| low | `/api/dashboard/revenue-optimizer/opportunities` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/opportunities/route.ts` |
| low | `/api/dashboard/revenue-optimizer/pricing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/pricing/route.ts` |
| low | `/api/dashboard/revenue-optimizer/retention` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/retention/route.ts` |
| medium | `/api/dashboard/revenue-optimizer` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/revenue-optimizer/route.ts` |
| low | `/api/dashboard/revenue-optimizer/upsells` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue-optimizer/upsells/route.ts` |
| low | `/api/dashboard/revenue/anomalies` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue/anomalies/route.ts` |
| medium | `/api/dashboard/revenue` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/revenue/route.ts` |
| low | `/api/dashboard/revenue/trends` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/revenue/trends/route.ts` |
| low | `/api/dashboard/reviews` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/reviews/route.ts` |
| low | `/api/dashboard/save-queue/reminder` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/save-queue/reminder/route.ts` |
| low | `/api/dashboard/schedule/no-show-risk` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/schedule/no-show-risk/route.ts` |
| low | `/api/dashboard/schedule/optimize` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/schedule/optimize/route.ts` |
| medium | `/api/dashboard/schedule` | GET | no | yes | yes | no | no | no | no | yes | no | `src/app/api/dashboard/schedule/route.ts` |
| low | `/api/dashboard/schedule/upcoming` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/schedule/upcoming/route.ts` |
| low | `/api/dashboard/social` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/social/route.ts` |
| low | `/api/dashboard/training/[moduleId]` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/training/[moduleId]/route.ts` |
| low | `/api/dashboard/training/progress` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/training/progress/route.ts` |
| medium | `/api/dashboard/training` | GET | no | yes | no | no | no | no | no | no | no | `src/app/api/dashboard/training/route.ts` |
| low | `/api/dashboard/treatment-plans` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/dashboard/treatment-plans/route.ts` |
| low | `/api/health/airtable` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/health/airtable/route.ts` |
| medium | `/api/health` | GET | no | no | no | no | no | no | no | no | no | `src/app/api/health/route.ts` |
| low | `/api/indexnow` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/indexnow/route.ts` |
| low | `/api/integrations/google-reviews/sync` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/integrations/google-reviews/sync/route.ts` |
| low | `/api/integrations/quickbooks/auth` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/integrations/quickbooks/auth/route.ts` |
| low | `/api/integrations/quickbooks/reports` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/integrations/quickbooks/reports/route.ts` |
| low | `/api/integrations/quickbooks/sync` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/integrations/quickbooks/sync/route.ts` |
| low | `/api/integrations/quickbooks/webhooks` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/integrations/quickbooks/webhooks/route.ts` |
| low | `/api/notify/treatment-plan` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/notify/treatment-plan/route.ts` |
| low | `/api/ops/crosssell` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/crosssell/route.ts` |
| low | `/api/ops/followup` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/followup/route.ts` |
| low | `/api/ops/intake` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/intake/route.ts` |
| low | `/api/ops/money` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/money/route.ts` |
| low | `/api/ops/morning` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/morning/route.ts` |
| low | `/api/ops/pipeline` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/pipeline/route.ts` |
| low | `/api/ops/refills` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/refills/route.ts` |
| low | `/api/ops/report` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/report/route.ts` |
| low | `/api/ops/sop` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/sop/route.ts` |
| low | `/api/ops/winback` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/ops/winback/route.ts` |
| medium | `/api/patient/appointments` | GET | no | yes | no | no | no | no | no | yes | no | `src/app/api/patient/appointments/route.ts` |
| high | `/api/patient/auth/magic-link` | POST | no | no | no | yes | yes | yes | no | yes | no | `src/app/api/patient/auth/magic-link/route.ts` |
| medium | `/api/patient/auth/me` | GET | no | yes | no | no | no | no | no | no | no | `src/app/api/patient/auth/me/route.ts` |
| medium | `/api/patient/auth/verify` | POST | no | yes | no | yes | yes | yes | no | yes | no | `src/app/api/patient/auth/verify/route.ts` |
| medium | `/api/patient/loyalty` | GET | no | yes | no | no | no | no | no | yes | no | `src/app/api/patient/loyalty/route.ts` |
| medium | `/api/patient/membership/billing` | GET | no | yes | no | no | no | no | no | yes | no | `src/app/api/patient/membership/billing/route.ts` |
| medium | `/api/patient/membership` | GET | no | yes | no | no | no | no | no | yes | no | `src/app/api/patient/membership/route.ts` |
| medium | `/api/patient/plan` | GET | no | yes | no | no | yes | no | no | yes | no | `src/app/api/patient/plan/route.ts` |
| medium | `/api/patient/profile` | GET, PATCH | no | yes | no | yes | yes | no | no | yes | yes | `src/app/api/patient/profile/route.ts` |
| medium | `/api/patient/referrals` | GET | no | yes | no | no | no | no | no | yes | no | `src/app/api/patient/referrals/route.ts` |
| medium | `/api/patient/treatments` | GET | no | yes | no | no | no | no | no | yes | no | `src/app/api/patient/treatments/route.ts` |
| high | `/api/photo/upload` | POST | no | no | no | yes | no | yes | no | no | no | `src/app/api/photo/upload/route.ts` |
| medium | `/api/plan/[id]` | GET | no | yes | no | no | yes | no | yes | yes | yes | `src/app/api/plan/[id]/route.ts` |
| medium | `/api/plan/[id]/track` | POST | no | yes | no | yes | yes | no | yes | yes | yes | `src/app/api/plan/[id]/track/route.ts` |
| low | `/api/saas/admin/billing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/admin/billing/route.ts` |
| low | `/api/saas/admin/metrics` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/admin/metrics/route.ts` |
| low | `/api/saas/admin/tenants` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/admin/tenants/route.ts` |
| low | `/api/saas/analytics` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/analytics/route.ts` |
| low | `/api/saas/audit` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/audit/route.ts` |
| low | `/api/saas/billing/webhooks` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/billing/webhooks/route.ts` |
| low | `/api/saas/branding` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/branding/route.ts` |
| low | `/api/saas/data` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/data/route.ts` |
| low | `/api/saas/flags` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/flags/route.ts` |
| low | `/api/saas/funnel` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/funnel/route.ts` |
| low | `/api/saas/gateway` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/gateway/route.ts` |
| low | `/api/saas/health` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/health/route.ts` |
| low | `/api/saas/keys` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/keys/route.ts` |
| low | `/api/saas/marketing/demo` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/marketing/demo/route.ts` |
| low | `/api/saas/marketing/waitlist` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/marketing/waitlist/route.ts` |
| low | `/api/saas/marketplace` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/marketplace/route.ts` |
| low | `/api/saas/metering` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/metering/route.ts` |
| low | `/api/saas/notifications` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/notifications/route.ts` |
| low | `/api/saas/onboarding/provision` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/saas/onboarding/provision/route.ts` |
| low | `/api/sdk/keys` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/sdk/keys/route.ts` |
| low | `/api/services/catalog` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/services/catalog/route.ts` |
| medium | `/api/simulation/generate` | POST | no | no | no | yes | yes | no | no | no | no | `src/app/api/simulation/generate/route.ts` |
| high | `/api/skin-analysis` | GET, POST | no | no | no | yes | no | yes | no | no | no | `src/app/api/skin-analysis/route.ts` |
| low | `/api/templates/intake-followup` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/templates/intake-followup/route.ts` |
| low | `/api/templates/membership-pitch` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/templates/membership-pitch/route.ts` |
| high | `/api/templates/pdf` | GET, POST | no | no | no | yes | no | yes | no | no | no | `src/app/api/templates/pdf/route.ts` |
| low | `/api/templates/post-consult-nobook` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/templates/post-consult-nobook/route.ts` |
| low | `/api/templates/post-treatment` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/templates/post-treatment/route.ts` |
| low | `/api/templates/pre-consult` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/templates/pre-consult/route.ts` |
| low | `/api/templates/reactivation` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/templates/reactivation/route.ts` |
| low | `/api/tenant/ai/churn` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/ai/churn/route.ts` |
| low | `/api/tenant/ai/hub` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/ai/hub/route.ts` |
| low | `/api/tenant/ai/pricing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/ai/pricing/route.ts` |
| low | `/api/tenant/alerts` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/alerts/route.ts` |
| low | `/api/tenant/billing` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/billing/route.ts` |
| low | `/api/tenant/clients/[id]` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/clients/[id]/route.ts` |
| low | `/api/tenant/clients/at-risk` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/clients/at-risk/route.ts` |
| low | `/api/tenant/clients` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/clients/route.ts` |
| low | `/api/tenant/clients/segments` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/clients/segments/route.ts` |
| low | `/api/tenant/communications/inbox` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/communications/inbox/route.ts` |
| low | `/api/tenant/communications/reviews` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/communications/reviews/route.ts` |
| low | `/api/tenant/communications/send` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/communications/send/route.ts` |
| low | `/api/tenant/communications/templates` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/communications/templates/route.ts` |
| low | `/api/tenant/health-score` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/health-score/route.ts` |
| low | `/api/tenant/integrations/hub` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/integrations/hub/route.ts` |
| low | `/api/tenant/onboarding` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/onboarding/route.ts` |
| low | `/api/tenant/overview` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/overview/route.ts` |
| low | `/api/tenant/reports/definitions` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/reports/definitions/route.ts` |
| low | `/api/tenant/reports/generate` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/reports/generate/route.ts` |
| low | `/api/tenant/revenue/anomalies` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/revenue/anomalies/route.ts` |
| low | `/api/tenant/revenue/cashflow` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/revenue/cashflow/route.ts` |
| low | `/api/tenant/revenue/pnl` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/revenue/pnl/route.ts` |
| medium | `/api/tenant/revenue` | - | no | no | no | no | no | no | no | no | no | `src/app/api/tenant/revenue/route.ts` |
| low | `/api/tenant/revenue/trends` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/revenue/trends/route.ts` |
| medium | `/api/tenant` | DELETE, GET, PATCH, POST | no | yes | no | yes | yes | no | no | yes | yes | `src/app/api/tenant/route.ts` |
| low | `/api/tenant/schedule/no-show-risk` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/schedule/no-show-risk/route.ts` |
| low | `/api/tenant/schedule/optimize` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/tenant/schedule/optimize/route.ts` |
| medium | `/api/tenant/schedule` | - | no | no | no | no | no | no | no | no | no | `src/app/api/tenant/schedule/route.ts` |
| medium | `/api/webhooks/cherry` | POST | no | no | no | no | yes | no | yes | yes | yes | `src/app/api/webhooks/cherry/route.ts` |
| low | `/api/webhooks/mangomint/membership` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/webhooks/mangomint/membership/route.ts` |
| medium | `/api/webhooks/mangomint` | GET, POST | no | no | no | no | yes | no | yes | yes | yes | `src/app/api/webhooks/mangomint/route.ts` |
| low | `/api/webhooks/mangomint/sale` | GET | yes | no | no | no | no | no | no | no | no | `src/app/api/webhooks/mangomint/sale/route.ts` |
| medium | `/api/webhooks/stripe` | GET, POST | no | no | no | no | yes | yes | yes | yes | yes | `src/app/api/webhooks/stripe/route.ts` |
