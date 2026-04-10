# UTM Parameter Templates -- Rani Beauty Clinic

Ready-to-copy UTM strings for all ad campaigns. These are engineered to flow correctly through the attribution system (`classifyChannel` -> `mapLeadSourceLabel` -> Airtable).

Base URL for all templates: `https://ranibeautyclinic.com/contact`

---

## How It Works

1. **UTM in URL** -- Ad platforms append UTM parameters to the landing page URL when a user clicks.
2. **useAttribution captures** -- The `useAttribution` hook on the contact page reads `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` from the URL query string.
3. **classifyChannel runs** -- The attribution engine classifies the visit into a `MarketingChannel` (e.g., `paid_social`, `paid_search`, `display`) based on the source/medium combination.
4. **mapLeadSourceLabel maps** -- The channel + source are mapped to a human-readable label (e.g., "Meta Ads", "Google Ads", "Hulu TV") that appears in the dashboard.
5. **localStorage persists** -- Attribution data is stored in `localStorage` under `rani_attribution_context` so it survives page navigation. First-touch data is preserved; later visits update last-touch.
6. **Contact form sends** -- When the visitor submits the contact form, the full attribution payload (source, medium, campaign, content, term, landing page, referrer, timestamps) is included in the POST to `/api/contact`.
7. **Airtable stores** -- The API route writes the lead + attribution fields to the Client Intakes table.
8. **n8n processes** -- Downstream workflows (WF1 Intake Intelligence, WF2 Lead Response) pick up the new record and trigger AI analysis, email sequences, and CRM updates.

### Key Classification Rules

| utm_source | utm_medium | Channel | Dashboard Label |
|------------|------------|---------|-----------------|
| `facebook` or `instagram` | `cpc` or `paid` or `paid_social` | `paid_social` | Meta Ads |
| `google` | `cpc` | `paid_search` | Google Ads |
| `instagram` | `social` | `organic_social` | Instagram Organic |
| `facebook` | `social` | `organic_social` | Facebook Organic |
| `email` or `newsletter` | `email` | `email` | Email |
| `hulu` | `display` | `display` | Hulu TV |

---

## 1. Meta Ads (Facebook / Instagram)

Channel: `paid_social` | Label: "Meta Ads"

Use `utm_source=facebook` for Facebook placements and `utm_source=instagram` for Instagram placements. Both map to "Meta Ads" in the dashboard.

### Botox

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=paid_social&utm_campaign=botox_spring2026&utm_content=botox_awareness_static&utm_term=botox+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=paid_social&utm_campaign=botox_spring2026&utm_content=botox_reels_video&utm_term=botox+near+me
```

### Sofwave

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=paid_social&utm_campaign=sofwave_skin_tightening&utm_content=sofwave_before_after_carousel&utm_term=skin+tightening+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=paid_social&utm_campaign=sofwave_skin_tightening&utm_content=sofwave_results_reel&utm_term=non+surgical+facelift
```

### GLP-1 Weight Loss

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=paid_social&utm_campaign=glp1_weight_loss&utm_content=glp1_tirzepatide_education&utm_term=medical+weight+loss+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=paid_social&utm_campaign=glp1_weight_loss&utm_content=glp1_transformation_story&utm_term=tirzepatide+near+me
```

### HydraFacial

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=paid_social&utm_campaign=hydrafacial_glow&utm_content=hydrafacial_process_video&utm_term=hydrafacial+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=paid_social&utm_campaign=hydrafacial_glow&utm_content=hydrafacial_results_carousel&utm_term=best+facial+near+me
```

### RF Microneedling

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=paid_social&utm_campaign=rf_microneedling&utm_content=rf_microneedling_education&utm_term=microneedling+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=paid_social&utm_campaign=rf_microneedling&utm_content=rf_microneedling_before_after&utm_term=rf+microneedling+near+me
```

### General Brand Awareness

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=paid_social&utm_campaign=brand_awareness_2026&utm_content=brand_intro_video&utm_term=medspa+renton+wa
```

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=paid_social&utm_campaign=brand_awareness_2026&utm_content=brand_lifestyle_carousel&utm_term=luxury+medspa+renton
```

---

## 2. Google Ads

Channel: `paid_search` | Label: "Google Ads"

Use `utm_source=google` and `utm_medium=cpc`. The `utm_term` field is critical here -- it tracks the search keyword that triggered the ad. Google Ads can auto-populate `{keyword}` if you use ValueTrack parameters.

### Botox

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=botox_search&utm_content=botox_rsa_v1&utm_term=botox+renton+wa
```

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=botox_search&utm_content=botox_rsa_v1&utm_term={keyword}
```

### Sofwave

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=sofwave_search&utm_content=sofwave_rsa_v1&utm_term=skin+tightening+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=sofwave_search&utm_content=sofwave_rsa_v1&utm_term={keyword}
```

### GLP-1 Weight Loss

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=glp1_search&utm_content=glp1_rsa_v1&utm_term=medical+weight+loss+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=glp1_search&utm_content=glp1_rsa_v1&utm_term={keyword}
```

### HydraFacial

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=hydrafacial_search&utm_content=hydrafacial_rsa_v1&utm_term=hydrafacial+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=hydrafacial_search&utm_content=hydrafacial_rsa_v1&utm_term={keyword}
```

### RF Microneedling

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=rf_microneedling_search&utm_content=rf_microneedling_rsa_v1&utm_term=rf+microneedling+renton
```

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=rf_microneedling_search&utm_content=rf_microneedling_rsa_v1&utm_term={keyword}
```

### General Brand Awareness

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=brand_search&utm_content=brand_rsa_v1&utm_term=rani+beauty+clinic
```

```
https://ranibeautyclinic.com/contact?utm_source=google&utm_medium=cpc&utm_campaign=brand_search&utm_content=brand_rsa_v1&utm_term={keyword}
```

### Google Ads ValueTrack Tip

For dynamic keyword insertion in Google Ads, use this tracking template at the campaign level:

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}
```

This auto-populates campaign ID, creative ID, and the matched keyword.

---

## 3. Email Campaigns

Channel: `email` | Label: "Email"

Use `utm_source=email` and `utm_medium=email`. Differentiate campaigns and content variants via `utm_campaign` and `utm_content`.

### Newsletter

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=newsletter_apr2026&utm_content=spring_services_cta
```

### Reactivation

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=reactivation_30day&utm_content=we_miss_you_cta
```

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=reactivation_60day&utm_content=special_offer_cta
```

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=reactivation_90day&utm_content=last_chance_cta
```

### Post-Treatment Follow-Up

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=post_treatment_followup&utm_content=rebook_cta
```

### Service-Specific Promotion

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=glp1_email_launch&utm_content=glp1_learn_more
```

```
https://ranibeautyclinic.com/contact?utm_source=email&utm_medium=email&utm_campaign=sofwave_email_promo&utm_content=sofwave_book_now
```

---

## 4. Organic Social

Channel: `organic_social` | Labels: "Instagram Organic" / "Facebook Organic"

Use `utm_medium=social` (not `paid_social`). This ensures `classifyChannel` routes to `organic_social` instead of `paid_social`.

### Instagram Bio Link

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=social&utm_campaign=ig_bio_link&utm_content=linkinbio
```

### Instagram Story Link

```
https://ranibeautyclinic.com/contact?utm_source=instagram&utm_medium=social&utm_campaign=ig_story_apr2026&utm_content=swipe_up_cta
```

### Facebook Post

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=social&utm_campaign=fb_organic_post&utm_content=service_highlight
```

### Facebook Bio / About Link

```
https://ranibeautyclinic.com/contact?utm_source=facebook&utm_medium=social&utm_campaign=fb_bio_link&utm_content=page_cta
```

---

## 5. Hulu / Display Ads

Channel: `display` | Label: "Hulu TV"

The attribution system has special handling: when `utm_source=hulu` and `utm_medium=display`, `mapLeadSourceLabel` returns "Hulu TV" instead of the generic "Display" label.

### Hulu TV Ad

```
https://ranibeautyclinic.com/contact?utm_source=hulu&utm_medium=display&utm_campaign=hulu_q2_2026&utm_content=hulu_30s_spot_v1&utm_term=renton+wa+medspa
```

```
https://ranibeautyclinic.com/contact?utm_source=hulu&utm_medium=display&utm_campaign=hulu_q2_2026&utm_content=hulu_15s_spot_v1&utm_term=luxury+medspa
```

### Other Display / Banner Ads

```
https://ranibeautyclinic.com/contact?utm_source=gdn&utm_medium=display&utm_campaign=display_retargeting_q2&utm_content=banner_300x250_v1&utm_term=medspa+services
```

---

## UTM Parameter Reference

| Parameter | Purpose | Example Values |
|-----------|---------|----------------|
| `utm_source` | Platform origin | `google`, `facebook`, `instagram`, `email`, `hulu`, `gdn` |
| `utm_medium` | Traffic type | `cpc`, `paid_social`, `social`, `email`, `display` |
| `utm_campaign` | Campaign name | `botox_spring2026`, `glp1_search`, `reactivation_30day` |
| `utm_content` | Ad/creative variant | `botox_rsa_v1`, `sofwave_before_after_carousel`, `swipe_up_cta` |
| `utm_term` | Keyword (search) or audience | `botox+renton+wa`, `{keyword}`, `renton+wa+medspa` |

## Naming Conventions

- **Campaign names:** `{service}_{channel}_{period}` -- e.g., `botox_spring2026`, `glp1_search`, `brand_awareness_2026`
- **Content names:** `{service}_{format}_{version}` -- e.g., `botox_rsa_v1`, `sofwave_results_reel`, `glp1_transformation_story`
- **Terms:** Use `+` for spaces in manual entries. Use `{keyword}` for Google Ads auto-population.
- **Keep values lowercase** with underscores. The attribution engine lowercases everything during classification, but consistent casing in the raw data makes Airtable filtering and n8n workflow logic cleaner.
