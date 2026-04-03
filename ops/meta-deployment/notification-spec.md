# Notification Specification

## Trigger Conditions

Notifications fire when a phase status changes to:
- **COMPLETE** — phase finished, evidence confirmed
- **BLOCKED** — phase cannot proceed, action required
- **READY_FOR_REVIEW** — phase needs owner approval before advancing

## Phase Completion Subjects

| Phase | Subject |
|-------|---------|
| Canon Lock | 🛡️ Canon locked — Meta Commander OS |
| Deployment Board | 📋 Deployment board ready — Meta rollout |
| Gate 1 | 📡 Gate 1 complete — Tracking verified |
| Gate 2 | ⚖️ Gate 2 complete — Compliance cleared |
| Gate 3 | 🧪 Gate 3 complete — Services ready |
| Gate 4 | 🚪 Gate 4 complete — Funnel ready |
| Asset Bank | 🗂️ Asset bank built — Approved copy organized |
| Campaign Drafts | 🎯 Campaign drafts built — Ready for review |
| Lead Response | 💬 Lead response system ready — Team assigned |
| Controlled Launch | 🚀 Controlled launch live — Initial campaigns active |
| 72-Hour Check | 👀 72-hour check done — Signal review complete |
| Weekly Optimization | 📈 Weekly optimization complete — Decisions logged |
| Change Control | 🔒 Change control applied — Canon protected |

## Blocked Subjects

| Phase | Subject |
|-------|---------|
| Gate 1 | ⛔ Tracking blocked — Action required |
| Gate 2 | ⛔ Compliance blocked — Action required |
| Gate 3 | ⛔ Service readiness blocked — Action required |
| Gate 4 | ⛔ Funnel blocked — Action required |
| Any | ⛔ [Phase name] blocked — Action required |

## Review Subjects

| Phase | Subject |
|-------|---------|
| Any | 🔍 [Phase name] ready for review — Owner approval needed |

## Email Body Format

```
Phase: [phase_name]
Status: [status]
Health Score: [score]/100
Timestamp: [ISO timestamp]

Summary:
[description of what happened]

Blockers:
[list of blockers, or "None"]

Next Action:
[what needs to happen next]

---
Rani Beauty Clinic — Meta Deployment Ops
Dashboard: [dashboard_url]
```

## Notification Log Fields

Each sent notification is recorded with:
- `timestamp` — ISO 8601
- `subject` — email subject line
- `phase` — phase ID
- `status` — COMPLETE / BLOCKED / READY_FOR_REVIEW
- `recipient` — email address
- `sent_by` — system or manual
- `notes` — optional context
