# Preview Smoke Checks

Generated: 2026-04-07

Use `scripts/smoke-preview.mjs` after deploying a Vercel preview.

```bash
BASE_URL=https://your-preview.vercel.app node scripts/smoke-preview.mjs
```

The script checks:

- `/api/health` responds with `200` or `503` and does not expose secret values
- allowed CORS preflight reflects `https://ranibeautyclinic.com`
- unknown CORS origin is not reflected
- unsigned Cherry webhook requests do not succeed
- contact form rejects invalid payloads
- patient magic link rejects invalid email payloads

Expected notes:

- `/api/health` may return `503` on a preview if required environment variables are missing. That is acceptable; the point is to return a safe structured readiness response.
- unsigned Cherry webhook should return `401` when `CHERRY_WEBHOOK_SECRET` is configured, or `503` when the secret is missing.
- invalid public-form payloads may return `429` if rate limits were already hit during repeated testing.
