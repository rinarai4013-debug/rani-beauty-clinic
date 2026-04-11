# Airtable Attribution Setup — Clients Table

## Goal
Capture real source-to-revenue attribution on every lead and booking so `leadsBySource` and source-level performance summaries are trusted.

## Required Fields in `Clients`

Create each field in the `Clients` table with the exact name (case-sensitive):

1. `Lead Source` — Single select
2. `Lead Medium` — Single select
3. `Lead Campaign` — Single line text
4. `Lead Ad Set` — Single line text
5. `Lead Ad` — Single line text
6. `Lead Offer` — Single line text
7. `Lead Landing Page` — URL
8. `Lead Keyword` — Single line text
9. `Lead Referrer` — URL
10. `Attribution ID` — Single line text
11. `First Touch At` — Date (include time)
12. `Last Touch At` — Date (include time)
13. `UTM Source` — Single line text
14. `UTM Medium` — Single line text
15. `UTM Campaign` — Single line text
16. `UTM Content` — Single line text
17. `UTM Term` — Single line text
18. `First Booking Source` — Single select
19. `First Booking Offer` — Single line text
20. `Attributed Revenue` — Currency ($, 2 decimals)
21. `Attribution Model` — Single select

## Single Select Option Values

### `Lead Source`
- Google Organic
- Google Ads
- Meta Ads
- Instagram Organic
- Facebook Organic
- Yelp
- TikTok
- Hulu TV
- Referral
- Email
- Walk-In
- Direct
- Other

### `Lead Medium`
- organic
- cpc
- paid_social
- social
- referral
- email
- display
- tv
- direct
- affiliate

### `First Booking Source`
- Website Contact Form
- Skin Quiz
- Treatment Quiz
- AI Chat
- Quick Consult
- GLP-1 Landing Page
- Weight Loss Landing
- TV Landing Page
- Newsletter
- Mangomint Direct
- Phone Call
- Walk-In

### `Attribution Model`
- first_touch
- last_touch
- linear
- time_decay
- position_based

## Verification

1. Open a lead record after a test form submit.
2. Confirm all UTM and lead source values are populated.
3. Confirm `First Touch At` is stable until the record is first created.
4. Confirm `Last Touch At` updates on every later touch.
5. Confirm `Attributed Revenue` updates through financed/payment workflows.

