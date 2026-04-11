# UTM Templates for Accurate Meta + Google Attribution

Use these templates on paid links to preserve deterministic attribution to `Lead Source` and `Lead Medium`.

## Shared UTM Rules

- Always keep one consistent `utm_source` + `utm_medium` per channel.
- Use `utm_campaign` to isolate creative/date/geo.
- Use `utm_content` for creative variant IDs.
- Use `utm_term` for keyword/targeting segment when available.

## Google Ads

### Search/Shopping
`?utm_source=google&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={adgroup_id}&utm_term={keyword}&gclid={gclid}`

### Display/YouTube
`?utm_source=google&utm_medium=display&utm_campaign={campaign_id}&utm_content={creative_id}&utm_term={placement}`

### Retargeting
`?utm_source=google&utm_medium=display&utm_campaign=rtg_{audience}_{date}&utm_content={creative_id}&utm_term={adgroup_id}`

## Meta Ads

### Facebook Feed/Stories
`?utm_source=facebook&utm_medium=paid_social&utm_campaign={campaign_name}&utm_content={ad_id}&utm_term={placement}`

### Instagram Feed/Reels
`?utm_source=instagram&utm_medium=paid_social&utm_campaign={campaign_name}&utm_content={ad_id}&utm_term={placement}`

## Direct & Social Organic

- Website/Referral: `?utm_source=direct&utm_medium=direct&utm_campaign=organic`
- Organic social posts: `?utm_source=facebook&utm_medium=social&utm_campaign=organic`

## TV / TV-like campaigns

- `?utm_source=hulu&utm_medium=tv&utm_campaign=tv_launch&utm_content={creative_id}`

## Newsletter

- `?utm_source=newsletter&utm_medium=email&utm_campaign={newsletter_name}&utm_content={cta_id}`

## QA Quick Checklist

1. Paste one of the templates into a test booking link.
2. Open link and submit a lead form.
3. Confirm the submitted lead has correct `Lead Source`, `Lead Medium`, and UTM fields in Airtable.

