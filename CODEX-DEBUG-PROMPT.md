# AI Mastermind Engine — Production Debug & Deployment Verification Prompt

## Instructions for Codex / Claude Code

You are an elite full-stack engineer debugging a Next.js 14.2 App Router application deployed on Vercel. This is the AI Mastermind consultation engine for Rani Beauty Clinic — a luxury medical aesthetics clinic.

**Your mission**: Make this application build and deploy successfully on Vercel. Fix every TypeScript error, every import resolution failure, every type mismatch, and every runtime issue. Do NOT skip anything. Do NOT leave TODOs. Fix it completely.

## System Architecture

- **Framework**: Next.js 14.2.29 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + custom CSS design system at `src/styles/mastermind-design-system.css`
- **Database**: Airtable (Base ID: `app1SwhSfwe8GKUg4`)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`) — `claude-sonnet-4-20250514` model
- **Auth**: Custom JWT-based auth in `src/lib/auth/middleware.ts`
- **Deployment**: Vercel (Node 20, not Node 24)
- **Env vars needed**: `ANTHROPIC_API_KEY`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `N8N_WEBHOOK_URL`

## Critical Rules

1. **Airtable Status field is singleSelect** — ALL writes MUST include `typecast: true`
2. **SessionPayload has `name` not `displayName`** — check all auth references
3. **`'use client'` is required** on ALL components using React hooks and ALL pages using hooks
4. **Server-only modules** (`fs`, `path`, `crypto`, `os`, `sharp`, `@anthropic-ai/sdk`) MUST NOT be imported in client components — use dynamic imports in API routes
5. **USE_MOCK_AI=true** is set on Vercel — when this env var is set, all AI calls should use mock data
6. **Brand rule**: NEVER say "infusion" — Rani does INJECTIONS only

## Files to Verify (in order of importance)

### Tier 1 — Must work for basic functionality
1. `src/types/mastermind.ts` — Core types (MastermindSession, AuraScanResult, MastermindPlan, etc.)
2. `src/types/consent.ts` — Consent types
3. `src/lib/mastermind/session.ts` + `session-store.ts` — Session management + Airtable persistence
4. `src/lib/mastermind/api-helpers.ts` — parseJsonBody, apiError, apiSuccess
5. `src/lib/auth/middleware.ts` — requireAuth, unauthorized
6. `src/app/api/mastermind/sessions/route.ts` — GET/POST sessions
7. `src/app/api/mastermind/sessions/[id]/route.ts` — GET/PATCH individual session
8. `src/app/api/consultation/submit/route.ts` — Intake submission
9. `src/app/api/mastermind/scan/route.ts` — 4-mode scan (AI/Device/Rules/Mock)
10. `src/app/api/mastermind/plan/route.ts` — AI plan generation
11. `src/app/api/mastermind/simulate/route.ts` — Simulation

### Tier 2 — New AI engines
12. `src/lib/mastermind/ai-aura-scan.ts` — Claude Vision skin analysis
13. `src/lib/mastermind/ai-plan-generator.ts` — Claude AI plan generator
14. `src/lib/mastermind/ai-aura-scan-with-device.ts` — Aura 3D device + Claude analysis
15. `src/lib/mastermind/aura-device-integration.ts` — Hexagon Aura scanner import
16. `src/lib/mastermind/aftercare-map.ts` — Treatment-specific aftercare
17. `src/lib/mastermind/product-catalog.ts` — Retail product catalog
18. `src/lib/mastermind/product-engine.ts` — Skincare Rx engine
19. `src/lib/mastermind/consent-templates.ts` — Medical consent templates

### Tier 3 — API routes
20. `src/app/api/mastermind/copilot/route.ts` — Streaming Claude copilot
21. `src/app/api/mastermind/consent/route.ts` — Consent capture
22. `src/app/api/mastermind/aura-import/route.ts` — Aura device import
23. `src/app/api/mastermind/share/route.ts` — Share token generation
24. `src/app/api/mastermind/share/[token]/route.ts` — Token resolver
25. `src/app/api/mastermind/share/interest/route.ts` — Patient interest capture

### Tier 4 — Components (all need 'use client')
26. `src/components/dashboard/mastermind/NewConsultationModal.tsx`
27. `src/components/dashboard/mastermind/CopilotSidebar.tsx`
28. `src/components/dashboard/mastermind/PresentationMode.tsx`
29. `src/components/dashboard/mastermind/SignaturePad.tsx`
30. `src/components/dashboard/mastermind/ConsentModal.tsx`
31. `src/components/dashboard/mastermind/SkincareRxPanel.tsx`
32. `src/components/dashboard/mastermind/AuraImportPanel.tsx`
33. `src/components/dashboard/mastermind/PatientOverview.tsx`
34. `src/components/dashboard/mastermind/PlanEditor.tsx`
35. `src/components/dashboard/mastermind/ScanResultsPanel.tsx`
36. All 10 slides in `src/components/dashboard/mastermind/slides/`
37. `src/components/ui/FuturisticBackground.tsx`
38. `src/components/ui/AnimatedCounter.tsx`
39. `src/components/ui/GlassCard.tsx`
40. `src/components/ui/AuraScoreGauge.tsx`

### Tier 5 — Pages
41. `src/app/(dashboard)/dashboard/mastermind/page.tsx` — Dashboard hub
42. `src/app/(dashboard)/dashboard/mastermind/[sessionId]/page.tsx` — Session detail
43. `src/app/my-plan/[token]/page.tsx` — Patient portal
44. `src/app/my-plan/[token]/print/page.tsx` — Print-ready plan

## Common Issues to Check

1. **Import resolution**: Every `import ... from '@/...'` must resolve to a real file
2. **Type exports**: Verify that imported types/interfaces are actually exported from their source files
3. **Missing modules**: Check that `@anthropic-ai/sdk`, `sharp`, `framer-motion`, `lucide-react`, `swr` are in package.json
4. **Circular dependencies**: Check for circular imports between mastermind files
5. **Async/await**: All async function calls must be awaited
6. **API route signatures**: Next.js App Router API routes must export named functions (GET, POST, PATCH, DELETE)
7. **Page component exports**: All page.tsx files must have a default export
8. **Dynamic imports**: Server-only modules in API routes should use `await import('...')` not static imports if the module might not exist in all environments
9. **Framer Motion**: Components using `motion.div` need framer-motion installed and 'use client'
10. **lucide-react**: All icon imports must be valid icon names

## Verification Steps

After fixing all issues:
1. Run `npx tsc --noEmit` to verify TypeScript compilation
2. Run `next build` to verify the production build
3. Check that all API routes return proper responses
4. Verify all pages render without errors

## What Success Looks Like

- `next build` completes with 0 errors
- All 44+ files compile cleanly
- Vercel deployment succeeds
- Dashboard loads at /dashboard/mastermind
- Session detail page loads with all tabs
- Patient portal loads at /my-plan/{token}
- All API endpoints return proper JSON responses
