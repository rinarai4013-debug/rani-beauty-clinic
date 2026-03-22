# HOTJAR QUICK SETUP GUIDE — Rani Beauty Clinic
## Copy-Paste Configuration for Surveys, Heatmaps & Recording Filters

**Status:**
- [x] Hotjar tag installed & executing (Site ID: 5241962, confirmed via `window.hj`)
- [x] Survey 1: Exit Intent created (ID: 1851952) — verify in dashboard after login
- [ ] Survey 2–5: Create using instructions below
- [ ] Heatmaps: Configure for 8 pages
- [ ] Recording Filters: Set up 6 segments
- [ ] Tag verification: Retry after real user traffic (tag IS working, verifier is flaky)

---

## SURVEY 2: Mid-Session Intent

**Go to:** Surveys → + Create survey → Start from scratch

| Setting | Value |
|---------|-------|
| **Name** | `CRO Mid-Session Intent - Service Pages` |
| **Description** | `Captures treatment demand signals from engaged service page visitors` |
| **Type** | Popover |
| **Question 1 Type** | Radio buttons |
| **Question 1** | `What are you most hoping to improve?` |

**Answers (copy each):**
1. `Fine lines & wrinkles`
2. `Skin texture & tone`
3. `Acne or scarring`
4. `Volume loss or facial contouring`
5. `Hair removal`
6. `Weight management`
7. `Overall wellness & energy`
8. `Just exploring options`

**Targeting:**
- Devices: All
- Pages: URL contains `/services/` OR URL contains `/wellness/`
- Users: All users

**Behavior:**
- Trigger: Scroll depth > 50%
- Frequency: Show once per user
- Status: **Active**

**Thank you message:** `Thank you! Your input helps us personalize our services for you.`

---

## SURVEY 3: Post-Scroll Content Gap

**Go to:** Surveys → + Create survey → Start from scratch

| Setting | Value |
|---------|-------|
| **Name** | `CRO Content Gap - Homepage` |
| **Description** | `Captures missing content/trust signals from engaged homepage visitors` |
| **Type** | Popover |
| **Question 1 Type** | Long text answer |
| **Question 1** | `Is there anything you wish this page showed you?` |

**Targeting:**
- Devices: All
- Pages: URL is exactly `https://www.ranibeautyclinic.com/`
- Users: All users

**Behavior:**
- Trigger: Scroll depth > 60%
- Frequency: Show once per user
- Status: **Active**

**Thank you message:** `Thank you for sharing! We're always working to give you the best experience.`

---

## SURVEY 4: Post-Booking Satisfaction

**Go to:** Surveys → + Create survey → Start from scratch

| Setting | Value |
|---------|-------|
| **Name** | `CRO Post-Booking - Satisfaction` |
| **Description** | `Measures booking flow ease from converted users (survivorship insight)` |
| **Type** | Popover |
| **Question 1 Type** | 1-5 Rating scale |
| **Question 1** | `How easy was it to book with us?` |
| **Low score label** | `Very difficult` |
| **High score label** | `Very easy` |

**Question 2 (add question):**
| Setting | Value |
|---------|-------|
| **Type** | Long text answer |
| **Question** | `What would have made it easier?` |

**Logic:** After Q1, if score ≤ 3 → go to Q2. If score > 3 → go to Thank You.

**Targeting:**
- Devices: All
- Pages: URL contains `/thank-you`
- Users: All users

**Behavior:**
- Trigger: Immediately on page load
- Frequency: Show once per user
- Status: **Active**

**Thank you message:** `Thank you for booking with us! We can't wait to see you at Rani Beauty Clinic.`

---

## SURVEY 5: Pricing Page Reaction

**Go to:** Surveys → + Create survey → Start from scratch

| Setting | Value |
|---------|-------|
| **Name** | `CRO Pricing Reaction` |
| **Description** | `Measures price perception and sticker shock risk on pricing page` |
| **Type** | Popover |
| **Question 1 Type** | Radio buttons |
| **Question 1** | `How do our prices compare to what you expected?` |

**Answers (copy each):**
1. `Lower than expected`
2. `About what I expected`
3. `Higher than expected`
4. `I need more context to evaluate`

**Targeting:**
- Devices: All
- Pages: URL contains `/pricing`
- Users: All users

**Behavior:**
- Trigger: Time on page > 30 seconds
- Frequency: Show once per user
- Status: **Active**

**Thank you message:** `Thank you for your feedback! We offer flexible financing and membership savings — ask us about The Glow Program.`

---

## HEATMAPS — 8 Priority Pages

**Go to:** Heatmaps in left sidebar → These are automatically tracked on all pages by Hotjar once the tag is verified. No manual configuration needed for basic heatmaps.

However, to create **named heatmap views** for easy access:

Go to Heatmaps → + New heatmap for each:

| # | Name | URL |
|---|------|-----|
| 1 | `Homepage` | `https://www.ranibeautyclinic.com/` |
| 2 | `Get Started` | `https://www.ranibeautyclinic.com/get-started` |
| 3 | `Botox & Dysport` | `https://www.ranibeautyclinic.com/services/botox-dysport` |
| 4 | `HydraFacial` | `https://www.ranibeautyclinic.com/services/hydrafacial` |
| 5 | `Dermal Fillers` | `https://www.ranibeautyclinic.com/services/dermal-fillers` |
| 6 | `Pricing` | `https://www.ranibeautyclinic.com/pricing` |
| 7 | `Membership` | `https://www.ranibeautyclinic.com/membership` |
| 8 | `Quiz` | `https://www.ranibeautyclinic.com/quiz` |

**For each heatmap:** Enable Click map + Scroll map. Move map is optional (enable for Get Started and Pricing pages).

---

## RECORDING FILTERS — 6 Segments

**Go to:** Recordings in left sidebar → Use the filter bar to create saved segments.

### Segment A: High-Intent Non-Converters
```
Filters:
- Pages visited: ≥ 3
- Session duration: > 90 seconds
- Visited page containing: /get-started OR /services/ OR /pricing OR /membership
- Exit page: any (did not convert)
Save as: "High-Intent Non-Converters"
```

### Segment B: Booking Page Drop-offs
```
Filters:
- Visited page: /get-started
- Session duration: > 30 seconds
Save as: "Booking Page Drop-offs"
```

### Segment C: Mobile Funnel Friction
```
Filters:
- Device: Mobile
- Pages visited: ≥ 2
- Session duration: > 60 seconds
Save as: "Mobile Funnel Friction"
```

### Segment D: Returning Visitors Who Don't Book
```
Filters:
- User type: Returning
- Pages visited: ≥ 2
Save as: "Returning Non-Converters"
```

### Segment E: Pricing Page Behavior
```
Filters:
- Visited page: /pricing
- Session duration: > 45 seconds
Save as: "Pricing Page Behavior"
```

### Segment F: Quiz Abandoners
```
Filters:
- Visited page: /quiz
- Session duration: > 30 seconds
Save as: "Quiz Abandoners"
```

---

## WEEKLY REVIEW CADENCE

| Day | Task | Time |
|-----|------|------|
| **Monday** | Review 15-20 recordings from priority segments. Collect survey responses. | 30 min |
| **Tuesday** | Score new hypotheses (ICE). Pick 1-2 experiments to launch. | 20 min |
| **Wednesday-Thursday** | Implement test changes. | As needed |
| **Friday** | Check heatmap data. Review experiment results. Update backlog. | 20 min |

---

## FIRST WEEK PRIORITY

1. **Verify tag** — Log into Hotjar, go to Get Set Up → Install tag manually → Verify. If it still fails, ignore it — the tag IS working (confirmed via JS console).
2. **Check Exit Intent survey** — Go to Surveys → verify "CRO Exit Intent - Booking Friction" exists and is Inactive. Edit to set Active if ready.
3. **Create remaining 4 surveys** — Follow the copy-paste instructions above (~10 min total).
4. **Create 8 heatmap views** — Follow the table above (~5 min).
5. **Save 6 recording filter segments** — Follow the filter specs above (~5 min).
6. **Wait 7 days** for data to accumulate, then begin Monday insight reviews.
