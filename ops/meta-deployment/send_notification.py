#!/usr/bin/env python3
"""
Meta Deployment Notification Sender
Sends emoji email notifications when deployment phases change status.

Usage:
    python3 send_notification.py --phase gate_1 --status COMPLETE
    python3 send_notification.py --phase gate_2 --status BLOCKED --note "FB page flagged"
    python3 send_notification.py --list-phases
"""

import argparse
import json
import smtplib
import sys
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "config.json"
SCOREBOARD_PATH = SCRIPT_DIR / "team-scoreboard.json"

PHASE_SUBJECTS = {
    "canon_lock":       {"COMPLETE": "🛡️ Canon locked — Meta Commander OS"},
    "deployment_board": {"COMPLETE": "📋 Deployment board ready — Meta rollout"},
    "gate_1":           {"COMPLETE": "📡 Gate 1 complete — Tracking verified",
                         "BLOCKED":  "⛔ Tracking blocked — Action required"},
    "gate_2":           {"COMPLETE": "⚖️ Gate 2 complete — Compliance cleared",
                         "BLOCKED":  "⛔ Compliance blocked — Action required"},
    "gate_3":           {"COMPLETE": "🧪 Gate 3 complete — Services ready",
                         "BLOCKED":  "⛔ Service readiness blocked — Action required"},
    "gate_4":           {"COMPLETE": "🚪 Gate 4 complete — Funnel ready",
                         "BLOCKED":  "⛔ Funnel blocked — Action required"},
    "asset_bank":       {"COMPLETE": "🗂️ Asset bank built — Approved copy organized"},
    "campaign_drafts":  {"COMPLETE": "🎯 Campaign drafts built — Ready for review"},
    "lead_response":    {"COMPLETE": "💬 Lead response system ready — Team assigned"},
    "controlled_launch":{"COMPLETE": "🚀 Controlled launch live — Initial campaigns active"},
    "72_hour_review":   {"COMPLETE": "👀 72-hour check done — Signal review complete"},
    "weekly_optimization": {"COMPLETE": "📈 Weekly optimization complete — Decisions logged"},
    "change_control":   {"COMPLETE": "🔒 Change control applied — Canon protected"},
}

REVIEW_SUBJECT = "🔍 {phase} ready for review — Owner approval needed"
GENERIC_BLOCKED = "⛔ {phase} blocked — Action required"


def load_config():
    if not CONFIG_PATH.exists():
        print(f"Error: {CONFIG_PATH} not found.")
        print(f"Copy config.example.json to config.json and fill in your SMTP credentials.")
        sys.exit(1)
    with open(CONFIG_PATH) as f:
        return json.load(f)


def load_scoreboard():
    if not SCOREBOARD_PATH.exists():
        return None
    with open(SCOREBOARD_PATH) as f:
        return json.load(f)


def save_scoreboard(data):
    with open(SCOREBOARD_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_subject(phase, status):
    phase_map = PHASE_SUBJECTS.get(phase, {})
    if status in phase_map:
        return phase_map[status]
    if status == "BLOCKED":
        return GENERIC_BLOCKED.format(phase=phase.replace("_", " ").title())
    if status == "READY_FOR_REVIEW":
        return REVIEW_SUBJECT.format(phase=phase.replace("_", " ").title())
    return f"📋 {phase.replace('_', ' ').title()} — {status}"


def build_body(phase, status, note, config):
    now = datetime.now(timezone.utc).isoformat()
    body = f"""Phase: {phase.replace('_', ' ').title()}
Status: {status}
Timestamp: {now}

Summary:
{note or 'Phase status updated.'}

Blockers:
{'See dashboard for details.' if status == 'BLOCKED' else 'None'}

Next Action:
{'Resolve blockers before proceeding.' if status == 'BLOCKED' else 'Continue to next phase.'}

---
{config.get('clinic_name', 'Rani Beauty Clinic')} — Meta Deployment Ops
Dashboard: {config.get('dashboard_url', 'Open dashboard.html locally')}
"""
    return body


def send_email(config, subject, body):
    msg = MIMEMultipart()
    msg["From"] = config["from_email"]
    msg["To"] = ", ".join(config["to_emails"])
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        server = smtplib.SMTP(config["smtp_host"], config["smtp_port"])
        if config.get("use_tls", True):
            server.starttls()
        server.login(config["smtp_username"], config["smtp_password"])
        server.sendmail(
            config["smtp_username"],
            config["to_emails"],
            msg.as_string()
        )
        server.quit()
        print(f"Sent: {subject}")
        return True
    except Exception as e:
        print(f"Failed to send: {e}")
        return False


def log_notification(phase, status, subject, config, note):
    scoreboard = load_scoreboard()
    if scoreboard is None:
        return

    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "timestamp": now,
        "subject": subject,
        "phase": phase,
        "status": status,
        "recipient": ", ".join(config["to_emails"]),
        "sent_by": "send_notification.py",
        "notes": note or ""
    }

    if "notifications" not in scoreboard:
        scoreboard["notifications"] = []
    scoreboard["notifications"].append(entry)
    save_scoreboard(scoreboard)
    print(f"Logged to {SCOREBOARD_PATH}")


def list_phases():
    print("\nAvailable phases:\n")
    for phase in PHASE_SUBJECTS:
        statuses = list(PHASE_SUBJECTS[phase].keys())
        print(f"  {phase:25s} -> {', '.join(statuses)}")
    print(f"\n  (Any phase also supports READY_FOR_REVIEW)")
    print(f"\nUsage: python3 send_notification.py --phase <phase> --status <status>\n")


def main():
    parser = argparse.ArgumentParser(description="Send Meta deployment notification")
    parser.add_argument("--phase", type=str, help="Phase ID (e.g., gate_1, canon_lock)")
    parser.add_argument("--status", type=str, choices=["COMPLETE", "BLOCKED", "READY_FOR_REVIEW"],
                        help="New status")
    parser.add_argument("--note", type=str, default="", help="Optional note")
    parser.add_argument("--dry-run", action="store_true", help="Print email without sending")
    parser.add_argument("--list-phases", action="store_true", help="List available phases")
    args = parser.parse_args()

    if args.list_phases:
        list_phases()
        return

    if not args.phase or not args.status:
        parser.print_help()
        return

    config = load_config()

    if not config.get("notification_enabled", True):
        print("Notifications disabled in config.")
        return

    subject = get_subject(args.phase, args.status)
    body = build_body(args.phase, args.status, args.note, config)

    if args.dry_run:
        print(f"\n--- DRY RUN ---")
        print(f"To: {', '.join(config['to_emails'])}")
        print(f"Subject: {subject}")
        print(f"\n{body}")
        return

    sent = send_email(config, subject, body)
    if sent:
        log_notification(args.phase, args.status, subject, config, args.note)


if __name__ == "__main__":
    main()
