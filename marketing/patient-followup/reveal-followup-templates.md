# Reveal Patient Follow-Up Templates
## For use in n8n workflows and Mangomint automated messaging

---

## Template 1: Post-Assessment Follow-Up (24 hours after Reveal Assessment)
**Channel:** SMS
**Trigger:** Patient completes Reveal Assessment but doesn't book treatment

Hi {first_name}, it was great meeting you at your Reveal Assessment yesterday. We hope it gave you clarity about your skin restoration options. If you have any questions about the protocol we discussed, reply here or call us at (425) 539-4440. We're here whenever you're ready. — Rani Beauty Clinic

---

## Template 2: Post-Assessment Follow-Up (Day 5, if no booking)
**Channel:** SMS
**Trigger:** Patient hasn't booked treatment within 5 days of Assessment

Hi {first_name}, just checking in from Rani Beauty Clinic. We know choosing a skin restoration protocol is a big decision. If it helps, here are 3 things our Reveal patients tell us they wish they'd known sooner: (1) You don't need to wait until you've hit goal weight, (2) Results build over 3-6 months, so starting sooner = seeing results sooner, (3) The assessment was the hardest part — treatment day is easy. Questions? We're here. (425) 539-4440

---

## Template 3: Post-First-Treatment Check-In (48 hours after treatment)
**Channel:** SMS
**Trigger:** 48 hours after first Reveal treatment session

Hi {first_name}, how are you feeling 2 days after your treatment? A little redness or tenderness is completely normal and should be resolving. Remember: stay hydrated, use the SPF we provided, and avoid saunas or hot yoga for a few more days. If anything feels unusual, text us here or call (425) 539-4440. We're always available. — Your Rani team

---

## Template 4: Progress Milestone (6 weeks post-treatment)
**Channel:** Email
**Trigger:** 6 weeks after first treatment session
**Subject Line:** Your 6-week Reveal check-in

Hi {first_name},

It's been 6 weeks since your first Reveal treatment, which means collagen remodeling is well underway. Many patients start noticing subtle improvements around this time — firmer skin, improved texture, and early tightening.

A few things to keep in mind at this stage:
- Results are cumulative and continue developing through month 3-6
- Hydration and sun protection support your collagen rebuilding process
- If you have a follow-up session scheduled, your skin is primed for maximum benefit

We'd love to see how you're progressing. If you'd like to come in for progress photos and a skin check, reply to this email or book online.

Keep going — the best is ahead.

Warmly,
The Rani Beauty Clinic Team

---

## Template 5: Final Results Check-In (4 months post-treatment)
**Channel:** Email
**Trigger:** 4 months after final treatment session
**Subject Line:** Your Reveal results — let's see how far you've come

Hi {first_name},

Four months have passed since your last Reveal treatment, which means your collagen has had significant time to mature and remodel. This is when many patients tell us they truly see "The Reveal" — the point where your skin catches up to your transformation.

We'd love to schedule a complimentary progress assessment to:
- Compare your before and after photos
- Evaluate your skin quality and firmness
- Discuss maintenance recommendations
- Celebrate how far you've come

Whether you're thrilled with your results or want to explore further optimization, this check-in is on us.

[Book Your Progress Assessment]

And if you're happy with your results, we'd be grateful if you'd share your experience in a Google review. Your story helps other patients who are where you were 4 months ago.

[Leave a Review]

Warmly,
The Rani Beauty Clinic Team

---

## Integration Notes

**SMS templates:** Deploy via n8n workflow triggered by Mangomint appointment status changes and Airtable date calculations
**Email templates:** Deploy via SendGrid through n8n email workflow
**Personalization fields:** {first_name}, {treatment_type}, {next_appointment_date}
**Airtable tracking:** Log all messages to Messages Log table with template ID, channel, and delivery status
**Exit conditions:** Patient opts out, patient complaint, patient cancels treatment plan
**Compliance:** All SMS includes opt-out language per TCPA; all email includes CAN-SPAM footer
