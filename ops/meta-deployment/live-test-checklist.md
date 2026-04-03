# Live Production Form Test — B001 + B004 Clearance

**Purpose:** Confirm the lead form pipeline and pixel tracking work end-to-end in production.
**When:** Run this test BEFORE reclassifying B001 or B004 as CLEARED.
**Who:** Ops (with Owner on standby for sign-off)

---

## Pre-Test Setup

- [ ] Open ranibeautyclinic.com/contact in Chrome (Incognito recommended)
- [ ] Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension
- [ ] Open Chrome DevTools → Console tab (to watch for JS errors)
- [ ] Open a second tab: Meta Events Manager → Test Events (enter ranibeautyclinic.com)
- [ ] Open a third tab: Airtable → Client Intakes table (sort by Created descending)
- [ ] Open a fourth tab: n8n execution log at ranibeautyclinic.app.n8n.cloud

---

## Test 1 — PageView Pixel Fire (B001)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1 | Navigate to ranibeautyclinic.com | Pixel Helper shows green icon with "1 event" | |
| 1.2 | Click Pixel Helper icon | Shows: `PageView` event, Pixel ID `769852657929598` | |
| 1.3 | Check Events Manager Test Events tab | `PageView` event received from your browser | |
| 1.4 | Count pixel fires | Exactly 1 `PageView` (not 2 — confirms no GTM duplicate) | |
| 1.5 | Navigate to /contact | New `PageView` fires (1 per page, no extras) | |

**Test 1 Result:** _______ (PASS / FAIL / PARTIAL)

---

## Test 2 — Form Submission Pipeline (B004)

Use this test data:

```
Name:    Test Submission [DATE]
Email:   test@ranibeautyclinic.com
Phone:   (425) 000-0000
Service: GLP-1 Medical Weight Loss
Message: LIVE TEST — delete after verification
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1 | Fill form with test data above | Form accepts input, no JS errors in console | |
| 2.2 | Submit form | Success response (no error displayed) | |
| 2.3 | Check Pixel Helper | `Lead` event fires (1 time, not 2) | |
| 2.4 | Check Events Manager Test Events | `Lead` event received with content_name | |
| 2.5 | Check Airtable Client Intakes | New row: Full Name = "Test Submission [DATE]", Processing Status = "New" | |
| 2.6 | Check email (info@ranibeautyclinic.com) | "New Consultation Request — GLP-1 Medical Weight Loss" arrives | |
| 2.7 | Check n8n execution log | WF2 (Immediate Lead Response) triggered with test data | |
| 2.8 | Check for duplicate Airtable rows | Only 1 row created (not 2) | |

**Test 2 Result:** _______ (PASS / FAIL / PARTIAL)

---

## Test 3 — Phone + Booking Events (B001 supplemental)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.1 | Click a phone number link on any page | Pixel Helper shows `Contact` event | |
| 3.2 | Click "Book Now" or booking widget trigger | Pixel Helper shows `Schedule` event | |
| 3.3 | Check event counts | Each event fires exactly once (no duplicates) | |

**Test 3 Result:** _______ (PASS / FAIL / PARTIAL)

---

## Post-Test Cleanup

- [ ] Delete the test row from Airtable Client Intakes
- [ ] Note any n8n follow-up messages triggered and cancel if needed

---

## Test Summary

| Blocker | Test | Result | Evidence |
|---------|------|--------|----------|
| B001 | Test 1 (PageView pixel) | | |
| B001 | Test 3 (Phone/booking events) | | |
| B001 | Duplicate counting | | |
| B004 | Test 2 (Form → Airtable) | | |
| B004 | Test 2 (Form → Resend email) | | |
| B004 | Test 2 (Form → n8n webhook) | | |
| B004 | Test 2 (Form → Meta Lead event) | | |

### Reclassification Decision

**B001:**
- All Test 1 + Test 3 PASS → **LIMITED TEST READY** (pixel works, but 14-day Trusted Metrics Rule not yet satisfied — label upgrades to CLEARED only after 14 days of active data + 30 conversions in Events Manager)
- Any FAIL → Remains **BLOCKED**, document failure

**B004:**
- All Test 2 steps PASS → **CLEARED** (full pipeline confirmed in production)
- Partial PASS → **LIMITED TEST READY** with specific failures documented
- Form submission fails → Remains **BLOCKED**, investigate

---

## 14-Day Trusted Metrics Rule (B001 only)

Even if all pixel tests PASS, B001 cannot be labeled COMPLETE until:
1. Pixel has been active 14+ consecutive days in Events Manager
2. 30+ conversion events received
3. No pixel outage during the window
4. Data manually verified against actual leads

Until these conditions are met, B001 status = **LIMITED TEST READY**.
Conversion-optimized campaigns may run at test budget only.

---

*Generated: 2026-03-29 | Source: gate-verification.md + analytics-architecture.md*
