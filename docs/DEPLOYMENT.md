# Rani Beauty Clinic -- Deployment Guide

> How to deploy, manage environment variables, roll back, and add new features to the Rani Beauty Clinic platform.

---

## Table of Contents

1. [Vercel Deployment Process](#vercel-deployment-process)
2. [Environment Variable Reference](#environment-variable-reference)
3. [Rolling Back a Bad Deploy](#rolling-back-a-bad-deploy)
4. [How to Add a New Page](#how-to-add-a-new-page)
5. [How to Add a New API Route](#how-to-add-a-new-api-route)
6. [How to Add a New Dashboard Page](#how-to-add-a-new-dashboard-page)
7. [n8n Workflow Deployment](#n8n-workflow-deployment)
8. [Pre-Deployment Checklist](#pre-deployment-checklist)

---

## Vercel Deployment Process

### Automatic Deployment

The project is deployed on Vercel at `ranibeautyclinic.com`. Every push to the main branch triggers an automatic deployment.

```
git push origin main  -->  Vercel detects push  -->  Build  -->  Deploy
```

Build command: `next build`
Output directory: `.next`
Node.js version: 18.x

### Manual Deployment

If you need to deploy manually (e.g., after env var changes):

1. Go to Vercel Dashboard > Project: rani-beauty-clinic
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Or trigger from CLI: `vercel --prod` (requires Vercel CLI installed)

### Build Verification

Before pushing, verify the build passes locally:

```bash
cd ~/Desktop/Claude/rani-beauty-clinic
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run build        # Full production build
npm run test         # Vitest unit tests
```

### Preview Deployments

Every pull request or non-main branch push creates a preview deployment at a unique URL. Use these to test changes before merging to main.

---

## Environment Variable Reference

All environment variables are managed in Vercel > Project > Settings > Environment Variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `AIRTABLE_PAT` | Yes | Airtable Personal Access Token. Starts with `pat...`. Created at airtable.com/create/tokens. Grants read/write to all 12 tables. |
| `AIRTABLE_BASE_ID` | Yes | Airtable Base ID: `app1SwhSfwe8GKUg4`. Found in Airtable API docs. |
| `DASHBOARD_JWT_SECRET` | Yes | Secret key for JWT session signing (HS256). Must be a strong random string, minimum 32 characters. Used by jose library. |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude AI. Used by chat widget, intake analysis, recommendations, consult copilot, and all AI engines. Starts with `sk-ant-...`. |
| `META_ACCESS_TOKEN` | Yes | Meta (Facebook) API access token for ads management. Generated in Meta Business Suite. |
| `META_AD_ACCOUNT_ID` | Yes | Meta Ads account ID. Format: `act_XXXXX`. Found in Meta Business Suite > Ad Account Settings. |
| `RESEND_API_KEY` | Yes | Resend API key for transactional emails. Starts with `re_...`. Created at resend.com. |
| `CONTACT_EMAIL` | Yes | Email address for contact form submissions: `info@ranibeautyclinic.com` |
| `FROM_EMAIL` | Yes | Sender email for outbound messages: `Rani Beauty Clinic <noreply@ranibeautyclinic.com>` |
| `N8N_WEBHOOK_URL` | Yes | Base URL for n8n webhook endpoints. Format: `https://ranibeautyclinic.app.n8n.cloud/webhook/...` |
| `PINECONE_API_KEY` | Yes | Pinecone API key for the RAG knowledge base vector database. |
| `VAPI_API_KEY` | Conditional | Vapi AI API key for the phone receptionist agent. Required only if phone agent is active. |
| `VAPI_ASSISTANT_ID` | Conditional | Vapi assistant ID for the configured phone agent. |

### Environment Variable Safety

- Never commit `.env.local` to version control (it is in `.gitignore`)
- Rotate API keys quarterly
- Use Vercel's environment variable encryption (variables are encrypted at rest)
- Set variables for all three environments in Vercel: Production, Preview, Development
- After adding or changing env vars, redeploy for changes to take effect

---

## Rolling Back a Bad Deploy

### Method 1: Vercel Dashboard (Recommended)

1. Go to Vercel Dashboard > Project: rani-beauty-clinic > Deployments
2. Find the last known good deployment (green checkmark)
3. Click the three-dot menu on that deployment
4. Select "Promote to Production"
5. Confirm the promotion

This instantly points the production domain to the previous deployment with zero downtime.

### Method 2: Git Revert

```bash
# Revert the bad commit
git revert HEAD
git push origin main

# This triggers a new deployment with the reverted code
```

### Method 3: Force Redeploy of Specific Commit

```bash
# Find the good commit hash
git log --oneline -10

# Check out that commit and force deploy
git checkout <good-commit-hash>
vercel --prod --force
git checkout main
```

### Post-Rollback Verification

After any rollback:
1. Check the dashboard loads at `/dashboard`
2. Verify KPI data is populating (wait 30 seconds for SWR to fetch)
3. Confirm AI chat widget responds
4. Check n8n workflows are still connecting to the correct API endpoints
5. Review Vercel function logs for any errors

---

## How to Add a New Page

### Public Page

1. Create the page file:

```
src/app/<page-name>/page.tsx
```

2. Implement the page component:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | Rani Beauty Clinic',
  description: 'Page description for SEO',
}

export default function PageName() {
  return (
    <main>
      {/* Page content */}
    </main>
  )
}
```

3. The page is automatically wrapped by the root layout (`src/app/layout.tsx`) which includes the Navbar, Footer, and Mangomint booking widget.

4. Add structured data if needed using the `StructuredData` component from `/src/components/seo/`.

5. Update the sitemap at `src/app/sitemap.ts` to include the new page.

### Dynamic Route Page

For pages like `/services/[slug]`:

```
src/app/services/[slug]/page.tsx
```

```typescript
export default function ServicePage({ params }: { params: { slug: string } }) {
  // Fetch service data based on params.slug
}
```

---

## How to Add a New API Route

1. Create the route file:

```
src/app/api/<route-path>/route.ts
```

2. Implement the handler:

```typescript
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Your logic here
    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Your logic here
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

3. For dashboard routes that require authentication, add JWT verification:

```typescript
import { verifySession } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = await verifySession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role permissions if needed
  // session.role, session.permissions
}
```

4. For Airtable access, use the rate-limited client:

```typescript
import { Tables } from '@/lib/airtable/tables'

const records = await Tables.clients().select({
  filterByFormula: `{Email} = "${email}"`,
  maxRecords: 1,
}).firstPage()
```

---

## How to Add a New Dashboard Page

1. Create the page file in the dashboard route group:

```
src/app/(dashboard)/dashboard/<page-name>/page.tsx
```

2. The page automatically inherits the dashboard layout (`src/app/(dashboard)/layout.tsx`) which includes the Sidebar, Topbar, and authentication check.

3. Use the `'use client'` directive for interactive pages:

```typescript
'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { DashboardSkeleton } from '@/components/dashboard/shared'

export default function NewDashboardPage() {
  const { data, error, isLoading } = useDashboardData('/api/dashboard/new-endpoint')

  if (isLoading) return <DashboardSkeleton />
  if (error) return <div>Error loading data</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-playfair text-[#0F1D2C]">
        Page Title
      </h1>
      {/* Dashboard content */}
    </div>
  )
}
```

4. Add a navigation link in the Sidebar component:

```
src/components/dashboard/layout/Sidebar.tsx
```

5. Add the corresponding API route at `src/app/api/dashboard/<endpoint>/route.ts`.

6. If the page needs a new SWR hook, add it to `/src/hooks/useDashboardData.ts`.

---

## n8n Workflow Deployment

### Accessing n8n

- URL: `ranibeautyclinic.app.n8n.cloud`
- Login with n8n cloud credentials

### Adding a New Workflow

1. Log into the n8n instance
2. Click "Add Workflow"
3. Build the workflow using the visual editor
4. Configure credentials (Airtable PAT, Resend API key, Twilio, etc.)
5. Set the trigger:
   - **Cron/Schedule:** Set the schedule expression (timezone: Pacific Time)
   - **Webhook:** Copy the generated webhook URL and register it with the external service
   - **Polling:** Set the polling interval and filter formula
6. Test the workflow with "Execute Workflow"
7. Activate the workflow with the toggle switch

### Updating an Existing Workflow

1. Open the workflow in n8n
2. Make changes in the editor
3. Test with "Execute Workflow" using test data
4. Save changes (workflows auto-save, but verify)
5. Check execution history to confirm the changes work

### Webhook URL Registration

For Mangomint webhooks, register URLs in this format:

```
https://ranibeautyclinic.app.n8n.cloud/webhook/<webhook-path>
```

Current registered webhooks:
- `/webhook/booking-sync` -- Mangomint `appointment.created`
- `/webhook/post-treatment-trigger` -- Mangomint `appointment.completed`
- `/webhook/financing-trigger` -- Cherry/Stripe financing events
- `/webhook/postconsult-close-trigger` -- Post-consult follow-up
- `/webhook/pdf-generator-trigger` -- Document generation

### Airtable Field Name Rules

When configuring n8n nodes that write to Airtable, always use the exact field names. See the field name mapping in ARCHITECTURE.md for the correct names.

### n8n Workflow Inventory

| ID | Name | Trigger | Schedule |
|----|------|---------|----------|
| zbJcTZ3Ime9BSop8 | WF1 Intake Intelligence Engine v2 | Poll | Every 1 min |
| 9JGWwlYfUdVEkA7u | WF1b Aura Scan Processor | Poll | Every 5 min |
| 60VjUazBbCSCYSnM | WF2 Immediate Lead Response | Poll | Every 1 min |
| UyEbQab5gHP1atlH | WF2b No-Booking Follow-Up Ladder | Poll | Hourly |
| dqCueQXTDkXQjRe0 | WF5 Consult Outcome Tracking | Poll | Every 5 min |
| wOGRg2Q5BJ95puOc | W12 Alert Engine | Cron | Daily 11 PM |
| ajTQE3LwVvbPO0yV | WF4 Pre-Consult Preparation | Cron | Daily 6 AM |
| oReCnfFeNxe9lSgY | WF9 KPI Aggregation | Cron | Daily 6 AM |
| Qz5VLDUu7o9Yc5ge | WF7 Membership Engine | Cron | Daily 9 AM |
| FIL65iOmyd4CfHNG | W13 Review Commander | Cron | Daily 9 AM |
| mTAoqtrz7XGMsMds | W14 Client Status Keeper | Cron | Daily midnight |
| rtbIAVroFSGCQ7sK | WF8 Reactivation Campaigns | Cron | Mon 10 AM |
| 5aNNtyyCLYTDr5n3 | WF10 Provider Performance | Cron | Mon 7 AM |
| TpiezScNbp6BeGcv | WF3 Booking Sync | Webhook | appointment.created |
| XgkCfHilKUeyF0dv | WF6 Financing | Webhook | financing trigger |
| Tis5GeSHkVsk7bys | W16 Post-Consult Close | Webhook | post-consult trigger |
| mo5nubnsK16sfDgG | W17 Post-Treatment | Webhook | appointment.completed |
| zHJCkAf0ehhTzOfY | W2 Document Architect | Webhook | PDF generation trigger |
| yxKBbrqJHd2jtwnr | Intake to CRM | Typeform | Typeform submission |

---

## Pre-Deployment Checklist

Before every production deployment:

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] `npm run test` -- all unit tests pass
- [ ] All 13 environment variables are set in Vercel
- [ ] No `.env.local` or sensitive files in the commit
- [ ] API routes return expected responses (test key endpoints)
- [ ] Dashboard loads and shows data
- [ ] AI chat widget responds
- [ ] Contact form submits successfully
- [ ] n8n webhook URLs are still valid (no n8n updates that changed URLs)
