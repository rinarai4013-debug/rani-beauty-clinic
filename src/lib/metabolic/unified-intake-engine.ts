import {
  METABOLIC_TRACKS,
  generateMetabolicRecommendation,
  type FulfillmentOption,
  type MetabolicIntake,
  type MetabolicRecommendation,
  type MetabolicTrack,
} from '@/lib/metabolic/matrix';
import { getPackagesForRecommendation, type MetabolicPackageOption } from '@/lib/metabolic/boomrx-matrix';
import { buildDosagePlan, type DosagePlan } from '@/lib/metabolic/dosing-engine';
import { buildTreatmentTrajectory, type TreatmentTrajectory } from '@/lib/metabolic/trajectory-engine';

export interface UnifiedTrackProgram {
  track: MetabolicTrack;
  recommendation: MetabolicRecommendation;
  packages: MetabolicPackageOption[];
  dosagePlan: DosagePlan;
  trajectory: TreatmentTrajectory;
  checkout: {
    clinic: string;
    home: string;
  };
}

export interface UnifiedIntakeDecisionBundle {
  primaryTrack: MetabolicTrack;
  primary: UnifiedTrackProgram;
  alternatives: UnifiedTrackProgram[];
  allTracks: UnifiedTrackProgram[];
}

function checkoutPath(track: MetabolicTrack, fulfillment: FulfillmentOption): string {
  if (track === 'peptides') {
    return `/peptide/intake?checkout=${fulfillment}`;
  }
  return `/glp1/intake?checkout=${fulfillment}&track=${track}`;
}

function buildTrackProgram(
  intake: MetabolicIntake,
  track: MetabolicTrack,
  recommendation: MetabolicRecommendation,
): UnifiedTrackProgram {
  const packages = getPackagesForRecommendation(track, recommendation.fulfillment.recommended);
  const dosagePlan = buildDosagePlan(intake, recommendation, 'start');
  const trajectory = buildTreatmentTrajectory(intake, recommendation, 'start');

  return {
    track,
    recommendation,
    packages,
    dosagePlan,
    trajectory,
    checkout: {
      clinic: checkoutPath(track, 'clinic'),
      home: checkoutPath(track, 'home'),
    },
  };
}

export function buildUnifiedIntakeDecisionBundle(intake: MetabolicIntake): UnifiedIntakeDecisionBundle {
  const primaryRecommendation = generateMetabolicRecommendation(intake);
  const primaryTrack = primaryRecommendation.recommendedTrack;

  const primaryProgram = buildTrackProgram(intake, primaryTrack, primaryRecommendation);

  const alternativePrograms = METABOLIC_TRACKS
    .filter((track) => track !== primaryTrack)
    .map((track) => {
      const recommendation = generateMetabolicRecommendation(
        { ...intake, preferredTrack: track },
        { forceTrack: track },
      );
      return buildTrackProgram(intake, track, recommendation);
    });

  const allTracks = [primaryProgram, ...alternativePrograms];

  return {
    primaryTrack,
    primary: primaryProgram,
    alternatives: alternativePrograms,
    allTracks,
  };
}
