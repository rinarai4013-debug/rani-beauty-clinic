# Change Control Log

Source: `META-COMMANDER-OS-v8.md` — Versioning and Change Control

---

## Rules

No live update may happen unless it passes:

1. **Changelog entry** — recorded in this file
2. **Compliance check** — does this change introduce any compliance risk?
3. **Public-facing identity check** — does this change expose Rina's name publicly?
4. **Launch-gate impact check** — does this change affect any gate status?
5. **Owner approval** — required if change touches ads, pricing, services, patient content, or public messaging

---

## Owner Approval Required For

- Any new ad going live (copy + creative)
- Any new service line or price point
- Any budget increase > $100/month
- Any new campaign launch
- Any claim touching medication, hormones, peptides, or outcomes
- Any public-facing promo language
- Any ad creative using patient likeness, testimonial, or UGC
- Any DM or comment template (first use)
- Any response to a negative review
- Any public statement about pricing
- Any landing page or lead form changes
- Any new audience targeting strategy
- Any media inquiry response
- Any partnership or collaboration decision

---

## Does Not Require Approval (But Must Be Logged)

- Pausing an underperforming ad
- Routine bid or placement adjustments
- Standard DM responses using approved templates
- Standard comment responses using approved templates
- Hiding spam comments
- Daily monitoring and reporting
- A/B test variations within approved campaign structure

---

## Change Log

| ID | Date | Change Description | Category | Compliance Check | Identity Check | Gate Impact | Owner Approved | Applied By |
|----|------|--------------------|----------|-----------------|----------------|-------------|----------------|------------|
| C001 | 2026-03-29 | Canon doc v8.0 finalized | Governance | Pass | Pass | None | Yes | Sukhi |
| C002 | 2026-03-29 | Removed all public-facing Rina references from ad copy | Identity | Pass | Pass | None | Yes | Sukhi |
| C003 | 2026-03-29 | Added CLASS 2 pricing annotations to all ad copy | Compliance | Pass | N/A | None | Yes | Sukhi |
| C004 | 2026-03-29 | Replaced FDA-recognized with provider-guided in GLP-1 copy | Compliance | Pass | N/A | None | Yes | Sukhi |

---

## Violation Log

| ID | Date | Description | Severity | Resolution | Resolved By | Date Resolved |
|----|------|-------------|----------|------------|-------------|---------------|
| — | — | No violations recorded | — | — | — | — |

---

## Enforcement Checklist (Before Any Change Goes Live)

- [ ] Change logged in this file
- [ ] Compliance check: no new medical claims, no brand-name misuse, no guaranteed outcomes
- [ ] Identity check: no public-facing Rina references
- [ ] Gate impact: does this change any gate status? If yes, re-verify
- [ ] Owner approval obtained (if required)
- [ ] Canonical doc updated if this is a strategic change
- [ ] Dashboard and scoreboard updated to reflect new state
