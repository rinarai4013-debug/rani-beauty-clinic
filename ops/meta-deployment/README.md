# Meta Deployment Operations — README

## What This Is

This is the operational deployment layer for Rani Beauty Clinic's Meta/Instagram Commander OS v8.0. It turns the canonical strategy document into a trackable, scoreable, notification-enabled rollout system.

**Canonical source of truth:** `rani-beauty-clinic/docs/META-COMMANDER-OS-v8.md`

---

## File Guide

### Deployment Files

| File | Purpose |
|------|---------|
| `deployment-checklist.md` | 12-phase rollout checklist with task-level tracking |
| `service-launch-matrix.md` | Per-service gate status and readiness tracking |
| `gate-verification.md` | Detailed verification criteria for Gates 1-4 |
| `campaign-rollout-plan.md` | Campaign build sequence and launch prerequisites |
| `community-management-sla.md` | Response SLAs, escalation rules, health tracking |
| `kpi-reporting-framework.md` | KPI hierarchy, targets, confidence labels, cadence |
| `change-control.md` | Change enforcement rules, approval flow, violation log |
| `notification-spec.md` | Email notification templates and trigger conditions |
| `status-log.md` | Master operational log with phase-level status tracking |
| `team-scoreboard.json` | Structured data for dashboard rendering |
| `config.example.json` | SMTP and notification configuration template |

### Dashboard Files

| File | Purpose |
|------|---------|
| `dashboard.html` | Static command center dashboard (open in any browser) |
| `dashboard.css` | Dashboard styling |
| `dashboard.js` | Dashboard logic, scoring, and rendering |

### Notification Script

| File | Purpose |
|------|---------|
| `send_notification.py` | Python script for SMTP email notifications |

### Asset Files (`../meta-assets/`)

| File | Purpose |
|------|---------|
| `ad-copy-bank.md` | All approved ad copy variants by service tier |
| `reels-scripts.md` | Reel scripts (hook/body/close format) |
| `story-scripts.md` | Story frame sequences |
| `dm-scripts.md` | DM response templates by category |
| `comment-templates.md` | Comment response templates |
| `review-response-templates.md` | Review response templates by star rating |

---

## How To

### Open the Dashboard

```bash
open dashboard.html
```

Or double-click `dashboard.html` in Finder. It reads `team-scoreboard.json` and renders everything locally. No server needed.

### Update Status

1. Edit `status-log.md` — update the phase status, health score, and timestamp
2. Edit `team-scoreboard.json` — update the matching category or owner data
3. Refresh `dashboard.html` in browser

### Send a Notification

1. Copy `config.example.json` to `config.json`
2. Fill in your SMTP credentials
3. Run:

```bash
python3 send_notification.py --phase "gate_1" --status "COMPLETE"
```

Or for a blocked notification:

```bash
python3 send_notification.py --phase "gate_1" --status "BLOCKED" --note "Pixel not firing on form submit"
```

### Interpret Health Scores

| Score | Label | Color |
|-------|-------|-------|
| 90-100 | Excellent | Green |
| 75-89 | Stable | Light Green |
| 50-74 | At Risk | Yellow |
| 0-49 | Blocked | Red |
| N/A | Not Started | Gray |

### Add a New Owner

1. Add an entry to the `owner_summary` array in `team-scoreboard.json`
2. Add them as `owner` on relevant tasks in `deployment-checklist.md`
3. Refresh the dashboard

### Add a New Category

1. Add an entry to the `categories` array in `team-scoreboard.json`
2. Create corresponding tasks in `deployment-checklist.md`
3. Add a phase entry to `status-log.md`
4. Refresh the dashboard

---

## Rules

- The canonical doc (`META-COMMANDER-OS-v8.md`) is the single source of truth
- No live changes without a changelog entry in `change-control.md`
- No public-facing content without owner approval
- Health scores below 50 trigger BLOCKED status
- All notifications are logged in `status-log.md` and `team-scoreboard.json`
