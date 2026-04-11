# SOP: Monthly Refill Processing

---

## Timeline
- Day -7: Identify patients due for refill in next 7 days
- Day 0: Refill due date. Send refill reminder.
- Day 3: Nudge if no response
- Day 5: AT-RISK flag if no response
- Day 7+: Move to win-back if still no response

## Process
1. Run `/refills` weekly (Mondays) to generate upcoming refill list
2. For each patient:
   - Check last check-in date
   - Check for any open concerns or side effects
   - Verify payment method is current
   - Generate personalized refill text (use `templates/refill-reminder.md`)
3. Send batch refill texts
4. Process refills for patients who confirm (Reply YES)
5. Update pipeline, patient files, and refill-schedule.md
6. Flag non-responders at Day 3 and Day 5

## Revenue Protection
- Each missed refill = $299-599 lost that month
- Each churned patient = $3,588-7,188/year lost
- A 2-minute text at Day 0 prevents most churn
- Always offer to address concerns before accepting cancellation
