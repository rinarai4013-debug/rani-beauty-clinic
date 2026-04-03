# Service Launch Matrix

Source: `META-COMMANDER-OS-v8.md` — Service Launch Matrix section

Last updated: 2026-03-29

---

## Current Matrix

| Service | Readiness State | Compliance Cleared | Tracking Ready | Landing Page Ready | Fulfillment Ready | Allowed Geography | Allowed CTA | Hold Reason |
|--------|------------------|-------------------|----------------|-------------------|------------------|------------------|------------|------------|
| GLP-1 Medical Weight Loss | Ready to Test | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Washington State | Learn More / Book Now | Gate 1, 2, 3, 4 not fully re-verified |
| Sofwave | Ready to Test | Yes, conservative copy only | Pending Re-Verification | Pending Re-Verification | Yes | 15-mile radius around Renton | Book Now / Learn More | Gate 1 and 4 pending |
| Peptide Therapy | Hold | Pending Explicit Clearance | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Washington State | Learn More only if cleared | Compliance path not cleared |
| Women's Hormone Support | Partial | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Washington State if applicable | Learn More | Workflow not fully verified |
| Men's TRT | Waitlist Only | Partial | Not Required for waitlist-only traffic test | Pending | Not Ready | Washington State | Sign Up | NP not live yet |
| Wellness Injections | Partial | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Pending Re-Verification | Local / as applicable | Learn More | Service-specific workflow pending |

---

## Rules

- If Compliance Cleared = No → **HOLD**
- If Tracking Ready = No → no conversion-optimized campaigns; reach, engagement, or traffic only
- If Fulfillment Ready = No → **HOLD**
- If Landing Page Ready = No → **HOLD** or limited test only
- If service availability is partial → CTA must reflect actual state: book now, consult, or waitlist only
- Never launch from narrative description alone when the matrix is incomplete

## Update Protocol

1. Owner verifies each cell before changing status
2. Changes logged in `change-control.md`
3. Matrix must be re-verified before any budget increase
4. Dashboard refreshes from this data via `team-scoreboard.json`
