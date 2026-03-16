# The Reveal — KPI Tracking Framework
## Additions to Existing KPI Dashboard

---

## New KPIs to Track

### Lead Generation KPIs
| Metric | Source | Target (Month 1) | Target (Month 3) | Tracking Method |
|--------|--------|-------------------|-------------------|-----------------|
| Reveal page views | Vercel Analytics | 500/mo | 2,000/mo | Vercel dashboard |
| Lead magnet downloads | n8n webhook | 50/mo | 200/mo | Airtable Clients (tag: Reveal Guide) |
| Reveal Assessment bookings | Mangomint | 15/mo | 40/mo | Mangomint + Airtable Appointments |
| Assessment show rate | Mangomint | 80% | 85% | Appointments (showed vs booked) |
| Assessment → Treatment conversion | Airtable | 40% | 55% | Packages table (Reveal tag) |

### Revenue KPIs
| Metric | Source | Target (Month 1) | Target (Month 3) | Tracking Method |
|--------|--------|-------------------|-------------------|-----------------|
| Reveal protocol revenue | Square/Airtable | $15,000/mo | $50,000/mo | Transactions (Reveal category) |
| Average Reveal ticket size | Airtable | $3,500 | $4,000 | Packages table (avg) |
| Reveal tier distribution | Airtable | 20/60/20 E/S/C | 15/55/30 E/S/C | Packages table (tier breakdown) |
| Inner Circle signups | Airtable | 5/mo | 15/mo | Memberships table |
| Inner Circle retention rate | Airtable | — | 85% | Memberships (active/churned) |

### Marketing KPIs
| Metric | Source | Target (Month 1) | Target (Month 3) | Tracking Method |
|--------|--------|-------------------|-------------------|-----------------|
| Google Ads CPA (Reveal) | Google Ads | $150 | $100 | Google Ads dashboard |
| Meta Ads CPA (Reveal) | Meta Ads | $120 | $80 | Meta Ads + daily-meta-ads-check |
| Blog organic traffic (Reveal cluster) | Vercel Analytics | 300/mo | 3,000/mo | Analytics (filter /blog/ paths) |
| Email nurture sequence completion | n8n/SendGrid | 60% | 70% | SendGrid analytics |
| Email → Assessment booking rate | n8n | 5% | 10% | Airtable lead source tracking |
| GBP impressions (Reveal-related) | GBP Insights | 1,000/mo | 5,000/mo | GBP dashboard |
| GBP clicks (Reveal actions) | GBP Insights | 50/mo | 200/mo | GBP dashboard |

### SEO KPIs
| Metric | Source | Target (Month 1) | Target (Month 3) | Tracking Method |
|--------|--------|-------------------|-------------------|-----------------|
| Keyword rankings: "skin tightening after ozempic" | Google Search Console | Top 50 | Top 10 | GSC |
| Keyword rankings: "sofwave renton" | Google Search Console | Top 20 | Top 5 | GSC |
| Keyword rankings: "post glp-1 skin" | Google Search Console | Top 50 | Top 10 | GSC |
| Organic impressions (Reveal pages) | Google Search Console | 1,000/mo | 10,000/mo | GSC |
| Organic CTR (Reveal pages) | Google Search Console | 2% | 4% | GSC |
| Backlinks to /the-reveal | Ahrefs/GSC | 0 | 10+ | Link tracking |

### Patient Experience KPIs
| Metric | Source | Target | Tracking Method |
|--------|--------|--------|-----------------|
| Reveal patient satisfaction | Post-treatment survey | 4.8/5.0 | Typeform/n8n |
| Progress photo completion rate | Airtable | 90% | Appointments (photo flag) |
| Post-treatment follow-up response | n8n Messages Log | 80% | Messages Log (Reveal tag) |
| Google reviews mentioning Reveal/skin tightening | Reviews table | 5/mo | W13 Review Commander |
| Referral rate from Reveal patients | Airtable | 15% | Clients (referral source) |

---

## Dashboard Integration

### Recommended additions to existing KPI dashboard (`/api/dashboard/kpis`):

Add a "Reveal" section to the existing KPI cards:

```typescript
// New KPI card data for Reveal protocol
{
  label: "Reveal Revenue",
  value: revealRevenue,
  change: revealRevenueChange,
  trend: "up",
  icon: "Sparkles",
}
{
  label: "Reveal Assessments",
  value: revealAssessments,
  change: assessmentChange,
  trend: "up",
  icon: "Calendar",
}
{
  label: "Reveal Conversion",
  value: `${revealConversion}%`,
  change: conversionChange,
  trend: "up",
  icon: "Target",
}
{
  label: "Inner Circle Members",
  value: innerCircleMembers,
  change: memberChange,
  trend: "up",
  icon: "Star",
}
```

### Airtable Tracking Fields to Add

**Clients table:**
- `Reveal Interest` — Checkbox (downloaded guide or visited /the-reveal)
- `Reveal Segment` — Single Select: Lead, Assessment Booked, Assessment Complete, Treatment Active, Treatment Complete, Inner Circle

**Appointments table:**
- `Appointment Type` — Add "Reveal Assessment" option to existing single select

**Packages table:**
- `Package Category` — Add "Reveal Essential", "Reveal Signature", "Reveal Complete" options

**Transactions table:**
- `Service Category` — Add "Reveal Protocol" option

---

## Reporting Cadence

| Report | Frequency | Audience | Format |
|--------|-----------|----------|--------|
| Reveal Weekly Snapshot | Friday | Rina (CEO) | Included in `weekly-revenue-report` |
| Reveal Marketing Report | Bi-weekly | Marketing team | Added to `biweekly-ad-copy-refresh` output |
| Reveal Monthly Deep Dive | Monthly | Full team | New Airtable view + dashboard section |
| Reveal Quarterly Review | Quarterly | Strategy | Manual analysis + recommendations |

---

## Competitor Monitoring Additions

Add to `weekly-competitor-intel` scan:

**Track competitors offering:**
- Post-GLP-1 skin treatments
- Sofwave services
- Combination skin tightening protocols
- GLP-1 + aesthetics integration

**New competitor signals to monitor:**
- Competitors advertising "Ozempic face" treatments
- New Sofwave providers entering the Renton/South King County market
- Pricing changes for skin tightening at local competitors
- Competitors launching similar combination protocols
