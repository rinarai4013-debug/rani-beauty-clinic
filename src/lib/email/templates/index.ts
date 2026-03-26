/**
 * Rani Beauty Clinic - Email Template Library
 *
 * Barrel export for all email templates.
 * 47 total templates across 7 categories.
 */

// ── Engine ────────────────────────────────────────────────────
export {
  BRAND,
  interpolate,
  processConditionals,
  htmlToPlainText,
  baseLayout,
  render,
  buildTemplate,
  button,
  divider,
  heading,
  paragraph,
  bulletList,
  calloutBox,
  signoff,
} from '../engine';

export type {
  TemplateVariables,
  ConditionalSection,
  EmailTemplate,
  ServiceEmailSet,
  RenderedEmail,
} from '../engine';

// ── Service Templates (13 services × 3 emails = 39) ──────────
export { botox } from './services/botox';
export { hydrafacial } from './services/hydrafacial';
export { rfMicroneedling } from './services/rf-microneedling';
export { sofwave } from './services/sofwave';
export { laserHairRemoval } from './services/laser-hair-removal';
export { chemicalPeel } from './services/chemical-peel';
export { vitaminInjections } from './services/vitamin-injections';
export { peptideTherapy } from './services/peptide-therapy';
export { glp1 } from './services/glp1';
export { hrt } from './services/hrt';
export { nadPlus } from './services/nad-plus';
export { scarReduction } from './services/scar-reduction';
export { laserFacial } from './services/laser-facial';

// ── Lifecycle Templates (12) ──────────────────────────────────
export { welcome } from './lifecycle/welcome';
export { firstVisitPrep } from './lifecycle/first-visit-prep';
export { postFirstVisit } from './lifecycle/post-first-visit';
export { secondVisitNudge } from './lifecycle/second-visit-nudge';
export { milestone5th } from './lifecycle/milestone-5th';
export { milestone10th } from './lifecycle/milestone-10th';
export { anniversary } from './lifecycle/anniversary';
export { birthday } from './lifecycle/birthday';
export { reactivation30 } from './lifecycle/reactivation-30';
export { reactivation60 } from './lifecycle/reactivation-60';
export { reactivation90 } from './lifecycle/reactivation-90';
export { winBack } from './lifecycle/win-back';

// ── Membership Templates (6) ─────────────────────────────────
export { welcomeHalo } from './membership/welcome-halo';
export { welcomeGlow } from './membership/welcome-glow';
export { welcomeElite } from './membership/welcome-elite';
export { renewalReminder } from './membership/renewal-reminder';
export { upgradePitch } from './membership/upgrade-pitch';
export { cancellationSave } from './membership/cancellation-save';

// ── Loyalty Templates (4) ────────────────────────────────────
export { pointsEarned } from './loyalty/points-earned';
export { tierUpgrade } from './loyalty/tier-upgrade';
export { rewardAvailable } from './loyalty/reward-available';
export { pointsExpiring } from './loyalty/points-expiring';

// ── Referral Templates (3) ───────────────────────────────────
export { inviteSent } from './referral/invite-sent';
export { friendBooked } from './referral/friend-booked';
export { rewardEarned } from './referral/reward-earned';

// ── Review Templates (2) ─────────────────────────────────────
export { request as reviewRequest } from './review/request';
export { thankYou as reviewThankYou } from './review/thank-you';

// ── Campaign Templates (6) ───────────────────────────────────
export { seasonalSpring } from './campaigns/seasonal-spring';
export { seasonalSummer } from './campaigns/seasonal-summer';
export { seasonalFall } from './campaigns/seasonal-fall';
export { seasonalWinter } from './campaigns/seasonal-winter';
export { newService } from './campaigns/new-service';
export { eventInvitation } from './campaigns/event-invitation';

// ── Convenience maps ─────────────────────────────────────────
import { botox } from './services/botox';
import { hydrafacial } from './services/hydrafacial';
import { rfMicroneedling } from './services/rf-microneedling';
import { sofwave } from './services/sofwave';
import { laserHairRemoval } from './services/laser-hair-removal';
import { chemicalPeel } from './services/chemical-peel';
import { vitaminInjections } from './services/vitamin-injections';
import { peptideTherapy } from './services/peptide-therapy';
import { glp1 } from './services/glp1';
import { hrt } from './services/hrt';
import { nadPlus } from './services/nad-plus';
import { scarReduction } from './services/scar-reduction';
import { laserFacial } from './services/laser-facial';
import type { ServiceEmailSet } from '../engine';

/** Map of service slug → { pretreatment, dayOf, aftercare } */
export const serviceTemplates: Record<string, ServiceEmailSet> = {
  botox,
  hydrafacial,
  'rf-microneedling': rfMicroneedling,
  sofwave,
  'laser-hair-removal': laserHairRemoval,
  'chemical-peel': chemicalPeel,
  'vitamin-injections': vitaminInjections,
  'peptide-therapy': peptideTherapy,
  glp1,
  hrt,
  'nad-plus': nadPlus,
  'scar-reduction': scarReduction,
  'laser-facial': laserFacial,
};
