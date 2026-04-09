# AI Mastermind Implementation Context

## Objective
Build a unified end-to-end AI consultation flow that turns the existing consultation wizard into a premium provider-facing and patient-facing experience:

1. Patient intake
2. Aura skin scan
3. AI treatment plan generation
4. Provider review and editing
5. Predictive before/after simulations
6. Presentation, pricing, PDF, and conversion

This is not a greenfield build. The repo already contains most of the intelligence and simulation primitives. The goal is to wire them together into one coherent product surface under a new `mastermind` domain.

## Product Definition
`AI Mastermind` is a branded consultation pipeline for Rani Beauty Clinic. A patient completes intake, uploads photos, receives an Aura Scan result derived from internal AI analysis, and gets a structured treatment plan that a provider can review, edit, present, and convert into a booked package.

The experience should feel clinical, premium, and conversion-oriented, while staying technically pragmatic:

- Mock AI/network calls first where integration is uncertain.
- Prefer pure computation and existing local modules over new service dependencies.
- Use canvas-based visual effects for simulations. Do not introduce external image generation APIs.
- Build all five sprints in sequence, but keep interfaces stable enough that mocked logic can be replaced later.

## Critical Constraints

### Must use existing code where possible
The following modules already exist and should be wired in, not recreated:

- `src/lib/ai/skin-analysis.ts`
- `src/lib/ai/treatment-advisor.ts`
- `src/lib/ai/treatment-protocols.ts`
- `src/lib/ai/outcome-predictor.ts`
- `src/lib/ai/consultation-copilot.ts`
- `src/lib/photo-simulation/filters.ts`
- `src/lib/photo-simulation/filter-presets.ts`
- `src/lib/photo-simulation/skin-analysis.ts`
- `src/lib/plan-builder/ai-recommender.ts`
- `src/lib/plan-builder/constraints.ts`
- `src/lib/plan-builder/conversion-engine.ts`
- `src/lib/plan-builder/package-generator.ts`
- `src/lib/plan-builder/follow-up-templates.ts`
- `src/lib/plan-builder/aftercare-map.ts`
- `src/lib/medical/crosssell-matrix.ts`
- `src/lib/medical/intake-processor.ts`
- `src/components/consultation/FaceMapPicker.tsx`
- `src/components/photo-simulation/SimulationCanvas.tsx`
- `src/components/photo-simulation/SimulationDisclaimer.tsx`

### AUCA scanner is reference-only
The clinic’s AUCA scanner does not expose an API and only outputs PDF reports. We are not integrating with AUCA in this phase.

Instead:

- The user uploads photos in the existing consultation flow.
- Our Aura Scan independently analyzes those photos.
- Aura Scan reproduces AUCA’s five visible analysis categories:
  - Wrinkles
  - Texture
  - Brown Spots
  - Red Areas
  - Pores
- We also compute a branded composite `Aura Score`.

Future idea, not in scope now:

- Upload AUCA PDF and merge parsed scanner values with our internal scan result.

### Simulation architecture
- All visual simulations must remain local/canvas-driven.
- Reuse and extend `src/lib/photo-simulation/filters.ts`.
- Do not call external image generation services.

### Integration strategy
- Mock server responses first where needed.
- Keep route contracts stable so real AI/services can be swapped in later.
- Prefer deterministic typed outputs over vague AI-shaped blobs.

## What already exists in the repo

### Existing wizard foundation
The current consultation flow already exists in:

- `src/components/consultation/ConsultationWizard.tsx`
- `src/components/consultation/steps/Step5SkinHistory.tsx`
- `src/components/consultation/steps/Step7PhotoUpload.tsx`
- `src/lib/consultation/schema.ts`
- `src/lib/consultation/conditional-logic.ts`

Important implementation note:

- The current wizard schema is simpler than the new vision.
- `Step5SkinHistory.tsx` already implies extra fields like routine/allergies/history, but `src/lib/consultation/schema.ts` does not yet fully model the deeper medical intake we want.
- The revised build should treat schema alignment as part of Sprint 1, not an afterthought.

### Existing AI and simulation foundation
- `src/lib/ai/skin-analysis.ts` already supports Fitzpatrick classification, Glogau scale classification, and multi-dimension skin scoring.
- `src/lib/photo-simulation/filters.ts` already has local canvas filters and should become the backbone for both improvement and degradation paths.
- `src/lib/plan-builder/*` and `src/lib/medical/*` provide plan, validation, conversion, and medical logic building blocks.

## Target System Architecture

### New domain
Create a new domain namespace under `src/lib/mastermind`, `src/types/mastermind.ts`, `src/app/api/mastermind/*`, and corresponding UI surfaces.

### Core flow
1. Intake data is collected in the existing consultation wizard.
2. Patient uploads up to 3 face photos.
3. Aura Scan runs against uploaded photos and intake context.
4. Scan output produces structured concerns and category scores.
5. Plan generator maps concerns, restrictions, and goals to recommended treatment packages.
6. Provider reviews and edits the plan in a dashboard workspace.
7. Simulation engine generates:
   - with treatment progression
   - without treatment progression
8. Presentation mode packages scan, plan, simulation, and pricing into a high-conviction review experience.
9. Completion route generates PDF and triggers post-consultation automation.

## Shared Data Model
All new work should center around a stable typed session object.

### Canonical entities
- `MastermindSession`
- `AuraScanResult`
- `AuraScore`
- `ZoneAnalysis`
- `AuraConcern`
- `MastermindPlan`
- `SimulationComparison`
- `SimulationPath`
- `SimulationFrame`

### Data model rules
- `MastermindSession` should represent the end-to-end record from intake to conversion.
- `AuraScanResult` should be deterministic and serializable.
- `MastermindPlan` should be pure data, not JSX-shaped presentation content.
- Server routes should return typed objects that exactly match `src/types/mastermind.ts`.
- Any mocked route should mimic final production response shape.

## Sprint Plan

## Sprint 1: Foundation and Intelligent Intake
Goal: make the existing consultation wizard capable of producing a medically safer, scan-ready session object.

### Deliverables
- Add `src/types/mastermind.ts`
- Add `src/lib/mastermind/session.ts`
- Add `src/lib/mastermind/aura-scan.ts`
- Add `src/lib/mastermind/mock-data.ts`
- Add `src/lib/consultation/medical-schema.ts`
- Add `src/lib/consultation/conditional-logic-v2.ts`
- Add `src/app/api/mastermind/scan/route.ts`

### Required modifications
- Expand `src/lib/consultation/schema.ts`
- Update `src/components/consultation/steps/Step5SkinHistory.tsx`
- Update `src/components/consultation/steps/Step7PhotoUpload.tsx`
- Update `src/components/consultation/ConsultationWizard.tsx`

### Functional expectations
- Introduce deeper medical intake fields:
  - pregnancy
  - medications
  - allergies
  - autoimmune conditions
  - keloid history
  - isotretinoin history
- Use progressive disclosure so the form does not feel overwhelming.
- Add branching medical follow-up logic and contraindication helpers.
- After photo upload, allow the user to trigger Aura Scan from the wizard.
- Persist flow state locally so a partially completed session can survive refresh.

### Aura Scan behavior in Sprint 1
`runAuraScan()` should orchestrate:

- `assessSkinHealth()`
- `determineFitzpatrickType()`
- `classifyGlogauScale()`
- internal photo analysis

It should normalize those signals into:

- five AUCA-style category outputs
- one composite Aura Score
- prioritized concerns
- suggested treatment directions

### Sprint 1 acceptance criteria
- Wizard can collect the extended intake safely.
- Patient can upload photos and trigger scan.
- `/api/mastermind/scan` returns a valid `AuraScanResult`.
- Session state survives reload via local persistence.
- Mock data exists for UI development when photos are absent.

## Sprint 2: Aura Scan UI and Plan Generation
Goal: turn scan output into a premium, clinically familiar reveal experience and generate treatment packages.

### Deliverables
- `src/components/aura-scan/AuraScanReveal.tsx`
- `src/components/aura-scan/AuraScoreGauge.tsx`
- `src/components/aura-scan/SkinAnalysisGrid.tsx`
- `src/components/aura-scan/AnalysisCard.tsx`
- `src/components/aura-scan/ScoringToggle.tsx`
- `src/components/aura-scan/ZoneDetailPanel.tsx`
- `src/components/aura-scan/ConcernCards.tsx`
- `src/components/aura-scan/PredictiveMetrics.tsx`
- `src/lib/mastermind/plan-generator.ts`
- `src/app/api/mastermind/plan/route.ts`

### UI design direction
Mirror the AUCA report layout so providers instantly recognize the scan pattern:

- 2x3 face analysis grid:
  - Neutral
  - Wrinkles
  - Texture
  - Brown Spots
  - Red Areas
  - Pores
- Fitzpatrick indicator
- scoring legend
- comparative mode toggle

Upgrade that layout with:

- animated Aura Score gauge
- clickable category cards
- detail panel for concern/treatment recommendations
- animated reveal sequence

### Plan generation expectations
`generateMastermindPlan()` should map scan concerns and intake constraints through existing modules:

- `ai-recommender.ts`
- `constraints.ts`
- `conversion-engine.ts`
- package generation logic

The output should include three package tiers suitable for conversion:

- Start
- Transform
- Elite

### Sprint 2 acceptance criteria
- Scan reveal works on desktop and tablet.
- Absolute and peer-comparison scoring modes both render.
- Clicking a scan category opens relevant recommendations.
- Plan generator returns 3 coherent package tiers for representative cases like acne plus pigmentation.

## Sprint 3: Provider Review Dashboard
Goal: give providers a workspace to review, edit, validate, and approve the plan before presentation.

### Deliverables
- `src/app/(dashboard)/dashboard/mastermind/page.tsx`
- `src/app/(dashboard)/dashboard/mastermind/[sessionId]/page.tsx`
- `src/components/dashboard/mastermind/PatientOverview.tsx`
- `src/components/dashboard/mastermind/ScanResultsPanel.tsx`
- `src/components/dashboard/mastermind/PlanEditor.tsx`
- `src/components/dashboard/mastermind/CopilotSidebar.tsx`
- `src/hooks/useMastermindSessions.ts`
- `src/app/api/mastermind/sessions/route.ts`
- `src/app/api/mastermind/sessions/[id]/route.ts`
- `src/app/api/mastermind/sessions/[id]/validate/route.ts`

### UX requirements
- Queue view with status badges, timestamps, and Aura Scores
- Detailed review page with 3 panels:
  - Patient overview
  - Scan results
  - Plan editor
- Copilot suggestions should be assistive, not disruptive
- Edits should validate in real time against existing constraints logic

### Reuse expectations
- Reuse compact versions of Aura scan components
- Reuse existing draggable service tooling where possible
- Pull suggestion logic from `src/lib/ai/consultation-copilot.ts`

### Sprint 3 acceptance criteria
- Provider can open a session, inspect intake and photos, edit the plan, and see constraint warnings.
- Session detail layout remains usable on smaller laptop widths.

## Sprint 4: Predictive Simulation Engine
Goal: visualize likely outcomes with and without treatment using only local canvas effects.

### Deliverables
- `src/lib/photo-simulation/degradation-filters.ts`
- `src/lib/photo-simulation/degradation-presets.ts`
- `src/lib/mastermind/simulation-engine.ts`
- `src/components/mastermind/PredictiveSimulation.tsx`
- `src/components/mastermind/TimelineScrubber.tsx`
- `src/components/mastermind/SimulationMetrics.tsx`
- `src/app/api/mastermind/simulate/route.ts`

### Simulation behavior
Create two distinct paths:

- With treatment:
  - use `getPresetsForService()` and progressive treatment intensity
- Without treatment:
  - use degradation filters such as aging progression, texture decline, tone decline, elasticity loss

All rendering should remain local canvas processing.

### Extension requirement
Update `src/lib/photo-simulation/filters.ts` so `applyFilterChain()` can support both improvement and degradation filter definitions cleanly.

### Sprint 4 acceptance criteria
- Same uploaded source photo can generate visibly distinct original, with-treatment, and without-treatment frames.
- Timeline scrubber updates render state smoothly.
- Target performance is under 2 seconds per generated frame on a typical laptop.

## Sprint 5: Presentation, Conversion, and PDF
Goal: turn provider-approved plans into a polished sales and handoff experience.

### Deliverables
- `src/components/mastermind/PresentationMode.tsx`
- `src/components/mastermind/PackageSelector.tsx`
- `src/components/mastermind/FinancingCalculator.tsx`
- `src/lib/mastermind/pdf-generator.ts`
- `src/lib/mastermind/post-consultation.ts`
- `src/app/api/mastermind/complete/route.ts`
- `src/app/api/mastermind/pdf/route.ts`
- `src/app/(dashboard)/dashboard/mastermind/present/[sessionId]/page.tsx`
- `src/lib/mastermind/index.ts`
- `src/hooks/useMastermindFlow.ts`

### Presentation requirements
Five-slide presentation sequence:

1. Aura Score and summary
2. Primary concerns
3. Package options
4. Predictive simulation
5. Booking and financing CTA

### Conversion requirements
- Highlight the middle package visually by default.
- Offer financing views without turning the UI into a generic e-commerce calculator.
- Completion flow should trigger:
  - Airtable write
  - follow-up templates
  - webhook automation
- PDF should include:
  - cover
  - score summary
  - concern breakdown
  - package details
  - timeline
  - pricing
  - disclaimers

### Sprint 5 acceptance criteria
- Provider can move from intake to presentation and generate a branded PDF.
- Completion action returns a PDF URL and runs post-consultation automation hooks.
- Presentation mode is usable on iPad in full-screen landscape.

## Non-Goals for this phase
- AUCA PDF parsing
- AUCA hardware integration
- external image generation
- true server-side image rendering
- full EMR integration
- re-platforming the existing consultation flow from scratch

## Implementation Notes for Coding Agents

### Preferred build order inside the repo
1. Define types first.
2. Create mock data second.
3. Create pure orchestrators and generators before UI.
4. Add API routes that wrap pure functions.
5. Integrate wizard entry points.
6. Build dashboard and presentation shells after the underlying data contracts are stable.

### Stability rules
- Keep `mastermind` modules pure where possible.
- Put orchestration in `src/lib/mastermind/*`, not inside UI components.
- Route handlers should be thin wrappers around library functions.
- UI should degrade gracefully when only mock data exists.

### Design rules
- Preserve Rani branding and current visual language.
- Make the Aura Scan feel medical-luxury, not sci-fi.
- The AUCA-inspired grid is the anchor layout for trust and familiarity.

### Validation rules
- Medical contraindications must be explicit and inspectable.
- Provider override should be possible, but warnings should remain visible.
- Every AI-generated recommendation should resolve into actual service/package objects already known by the system.

## Verification Plan

### Sprint 1
- Complete wizard through step 7
- upload photos
- trigger scan
- verify `AuraScanResult` shape in browser/network logs
- run existing tests

### Sprint 2
- visually inspect scan reveal on desktop and tablet
- confirm plan generator returns 3 package tiers for representative concern sets

### Sprint 3
- open a session in dashboard
- edit plan
- confirm constraint warnings render immediately
- test narrower responsive layouts

### Sprint 4
- generate both simulation paths from one photo
- verify output differs from original
- verify rendering speed target

### Sprint 5
- run full wizard to completion
- generate PDF
- verify automation payload shape
- validate presentation flow on iPad-sized viewport

### Global verification
- Search codebase for `"infusion"` and ensure zero matches in this feature surface
- Run vitest

## Definition of Done
The feature is done when a patient can complete intake, receive a branded Aura Scan, have a plan generated and reviewed by a provider, view predictive outcomes, and leave with a presentable package plus PDF output, all while the implementation reuses existing repo intelligence instead of duplicating it.

